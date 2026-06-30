import OpenAI from "openai";
import { NextResponse } from "next/server";

import { normalizeLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const embeddingModel =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

const highRiskPatterns = [
  "suicide",
  "suicidal",
  "kill myself",
  "end my life",
  "harm myself",
  "self harm",
  "self-harm",
  "hurt myself",
  "want to die",
  "wanted to die",
  "wish i were dead",
  "wish i was dead",
  "no reason to live",
  "can't go on",
  "cannot go on",
];

type AnalysisResult = {
  summary_text: string;
  dominant_moods: string[];
  safety_level: "none" | "low" | "elevated";
};

function estimateSafetyLevel(entries: { diary_text: string }[]) {
  const text = entries.map((entry) => entry.diary_text).join("\n").toLowerCase();
  return highRiskPatterns.some((pattern) => text.includes(pattern))
    ? "elevated"
    : "none";
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ResourceChunkMatch = {
  chunk_text: string;
  chunk_summary: string | null;
  topic_tags: string[];
  use_case_tags: string[];
  title: string;
  source_name: string;
  source_url: string | null;
  similarity: number;
};

type ResourceContext = {
  text: string;
  summary: string | null;
  tags: string[];
  use_case_tags: string[];
  source: unknown;
  similarity?: number;
};

function getOutputLanguageName(language: string | null | undefined) {
  const normalizedLanguage = normalizeLanguage(language);

  if (normalizedLanguage === "zh-Hans") {
    return "Simplified Chinese";
  }

  if (normalizedLanguage === "zh-Hant") {
    return "Traditional Chinese";
  }

  if (normalizedLanguage === "es") {
    return "Spanish";
  }

  return "English";
}

async function getResourceContextByTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  useCaseTags: string[],
): Promise<ResourceContext[]> {
  const { data, error } = await supabase
    .from("resource_chunks")
    .select(
      "chunk_text, chunk_summary, topic_tags, use_case_tags, curated_resources(title, source_name, source_url)",
    )
    .overlaps("use_case_tags", useCaseTags)
    .limit(6);

  if (error || !data) {
    return [];
  }

  return data.map((chunk) => {
    const source = Array.isArray(chunk.curated_resources)
      ? chunk.curated_resources[0]
      : chunk.curated_resources;

    return {
      text: chunk.chunk_text,
      summary: chunk.chunk_summary,
      tags: chunk.topic_tags,
      use_case_tags: chunk.use_case_tags,
      source,
    };
  });
}

async function getResourceContextByEmbedding(
  supabase: SupabaseClient,
  openai: OpenAI,
  queryText: string,
  useCaseTags: string[],
): Promise<ResourceContext[]> {
  let queryEmbedding: number[] | undefined;

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: embeddingModel,
      input: queryText,
      dimensions: 1536,
    });
    queryEmbedding = embeddingResponse.data[0]?.embedding;
  } catch {
    return [];
  }

  if (!queryEmbedding) {
    return [];
  }

  const { data, error } = await supabase.rpc(
    "match_resource_chunks_by_use_case",
    {
      query_embedding: queryEmbedding,
      match_threshold: 0.2,
      match_count: 6,
      filter_use_case_tags: useCaseTags,
    },
  );

  if (error || !data) {
    return [];
  }

  return (data as ResourceChunkMatch[]).map((chunk) => ({
    text: chunk.chunk_text,
    summary: chunk.chunk_summary,
    tags: chunk.topic_tags,
    use_case_tags: chunk.use_case_tags,
    source: {
      title: chunk.title,
      source_name: chunk.source_name,
      source_url: chunk.source_url,
    },
    similarity: chunk.similarity,
  }));
}

function parseAnalysis(text: string): AnalysisResult {
  const jsonText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    const parsed = JSON.parse(jsonText) as Partial<AnalysisResult>;
    return {
      summary_text:
        typeof parsed.summary_text === "string"
          ? parsed.summary_text
          : "A summary could not be generated.",
      dominant_moods: Array.isArray(parsed.dominant_moods)
        ? parsed.dominant_moods.filter((mood) => typeof mood === "string")
        : [],
      safety_level:
        parsed.safety_level === "low" || parsed.safety_level === "elevated"
          ? parsed.safety_level
          : "none",
    };
  } catch {
    return {
      summary_text: jsonText,
      dominant_moods: [],
      safety_level: "none",
    };
  }
}

export async function POST() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = authData.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", userId)
    .maybeSingle();
  const outputLanguage = getOutputLanguageName(profile?.preferred_language);

  const { data: consent } = await supabase
    .from("consents")
    .select("allow_ai_analysis, allow_emotion_summary_storage")
    .eq("user_id", userId)
    .single();

  if (
    !consent?.allow_ai_analysis ||
    !consent?.allow_emotion_summary_storage
  ) {
    return NextResponse.json(
      {
        error:
          "Please enable AI analysis and emotion summary storage in consent settings first.",
      },
      { status: 403 },
    );
  }

  const { data: entries, error: entriesError } = await supabase
    .from("diary_entries")
    .select("id, mood_labels, mood_intensity, diary_text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (entriesError) {
    return NextResponse.json({ error: entriesError.message }, { status: 500 });
  }

  if (!entries || entries.length === 0) {
    return NextResponse.json(
      { error: "Please create at least one diary entry first." },
      { status: 400 },
    );
  }

  const client = new OpenAI({
    timeout: 30_000,
  });
  const averageIntensity =
    entries.reduce((sum, entry) => sum + (entry.mood_intensity ?? 0), 0) /
    entries.length;
  const heuristicSafetyLevel = estimateSafetyLevel(entries);
  const contextQuery = JSON.stringify(
    entries.map((entry) => ({
      mood_labels: entry.mood_labels,
      mood_intensity: entry.mood_intensity,
      diary_text: entry.diary_text,
    })),
  );
  let emotionContext = await getResourceContextByEmbedding(
    supabase,
    client,
    contextQuery,
    ["emotion_analysis"],
  );
  let safetyContext = await getResourceContextByEmbedding(
    supabase,
    client,
    contextQuery,
    ["safety_boundary", "support_referral"],
  );

  if (emotionContext.length === 0) {
    emotionContext = await getResourceContextByTags(supabase, [
      "emotion_analysis",
    ]);
  }

  if (safetyContext.length === 0) {
    safetyContext = await getResourceContextByTags(supabase, [
      "safety_boundary",
      "support_referral",
    ]);
  }

  let response;

  try {
    response = await client.responses.create({
      model,
      max_output_tokens: 500,
      input: [
        {
          role: "system",
          content:
            "You analyze private diary check-ins for a non-clinical emotional support app for people affected by cancer. Write all user-facing JSON string values in the requested output_language, including summary_text and dominant_moods. Keep safety_level in English as one of none, low, elevated. Use a neutral yet empathetic tone in the requested language: calm, plain, respectful, and choice-centered. Avoid literal translation patterns; write naturally for the language and context. Sound like a careful guide, not a clinician, therapist, crisis counselor, cheerleader, or best friend. Follow this workflow: 1) treat the provided rule_based_safety_level as a safety floor; never lower elevated safety to none or low, 2) use emotion_context only as background for careful, non-pathologizing emotion reflection, 3) use safety_context only for non-diagnostic boundary and support-referral language, 4) identify likely emotion themes using uncertain wording such as may, might, could, or seems, 5) return a concise non-clinical reflection only. Do not diagnose, provide medical advice, provide psychotherapy, provide crisis counseling, or recommend coping activities. Do not use clinical labels such as depression, anxiety disorder, PTSD, adjustment disorder, disorder, symptom, or patient appears to have. Use everyday feeling words instead, translated naturally when needed, such as worry, fear, sadness, guilt, numbness, tiredness, loneliness, uncertainty, anger, hope, or gratitude. Avoid sounding like a medical report. Do not overstate patterns, imply certainty, or make the user feel judged or analyzed. Do not use hype, forced positivity, or fake intimacy. Return only valid JSON with keys summary_text, dominant_moods, and safety_level. safety_level must be one of none, low, elevated. dominant_moods should contain 1 to 5 short everyday emotion/theme labels.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction:
              "Summarize recent emotional patterns from these diary entries in 2 to 4 calm, gentle sentences. Use language that feels human and respectful, not clinical or overly intimate. Do not provide coping recommendations yet. If context is empty, still use the rule-based safety floor and non-clinical boundaries.",
            output_language: outputLanguage,
            rule_based_safety_level: heuristicSafetyLevel,
            emotion_context: emotionContext,
            safety_context: safetyContext,
            entries,
          }),
        },
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "OpenAI analysis request failed.";

    return NextResponse.json(
      {
        error: `AI analysis failed: ${message}`,
      },
      { status: 500 },
    );
  }

  const analysis = parseAnalysis(response.output_text);
  const safetyLevel =
    heuristicSafetyLevel === "elevated" ? "elevated" : analysis.safety_level;

  const { data: summary, error: insertError } = await supabase
    .from("emotion_summaries")
    .insert({
      user_id: userId,
      summary_text: analysis.summary_text,
      dominant_moods: analysis.dominant_moods,
      average_intensity: Number(averageIntensity.toFixed(2)),
      diary_entry_ids: entries.map((entry) => entry.id),
      safety_level: safetyLevel,
      model_name: model,
    })
    .select("id, summary_text, dominant_moods, average_intensity, safety_level")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ summary });
}
