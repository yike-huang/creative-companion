import OpenAI from "openai";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const embeddingModel =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

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

type RecommendationSource = {
  title: string;
  sourceName: string;
  url: string | null;
};

type ActivityRecommendation = {
  id: string;
  title: string;
  reason: string;
  whyThisFits: string;
  steps: string[];
  safetyNote: string;
  sources: RecommendationSource[];
};

function getContextSources(context: ResourceContext[]): RecommendationSource[] {
  const sources = new Map<string, RecommendationSource>();

  for (const item of context) {
    const source = item.source as
      | { title?: unknown; source_name?: unknown; source_url?: unknown }
      | null
      | undefined;

    if (
      typeof source?.title !== "string" ||
      typeof source.source_name !== "string"
    ) {
      continue;
    }

    const isBackgroundEvidence =
      source.title
        .toLowerCase()
        .includes("what is the evidence on the role of the arts") ||
      source.source_name.toLowerCase().includes("world health organization");

    if (isBackgroundEvidence) {
      continue;
    }

    const url = typeof source.source_url === "string" ? source.source_url : null;
    const key = url ?? `${source.source_name}:${source.title}`;

    sources.set(key, {
      title: source.title,
      sourceName: source.source_name,
      url,
    });
  }

  return Array.from(sources.values()).slice(0, 4);
}

function parseRecommendations(
  text: string,
  sources: RecommendationSource[],
): ActivityRecommendation[] {
  const jsonText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    const parsed = JSON.parse(jsonText) as { recommendations?: unknown };

    if (!Array.isArray(parsed.recommendations)) {
      return [];
    }

    return parsed.recommendations
      .map((item, index) => {
        const recommendation = item as Partial<ActivityRecommendation>;

        return {
          id:
            typeof recommendation.id === "string"
              ? recommendation.id
              : `generated-${index + 1}`,
          title:
            typeof recommendation.title === "string"
              ? recommendation.title
              : "Creative reflection",
          reason:
            typeof recommendation.reason === "string"
              ? recommendation.reason
              : "This activity is intended as non-clinical creative reflection.",
          whyThisFits:
            typeof recommendation.whyThisFits === "string"
              ? recommendation.whyThisFits
              : "This activity was generated from your latest non-clinical emotion reflection and curated creative-support boundaries.",
          steps: Array.isArray(recommendation.steps)
            ? recommendation.steps.filter((step) => typeof step === "string")
            : [],
          safetyNote:
            typeof recommendation.safetyNote === "string"
              ? recommendation.safetyNote
              : "This is a non-clinical creative activity, not art therapy or medical care.",
          sources,
        };
      })
      .filter(
        (recommendation) =>
          recommendation.title && recommendation.steps.length > 0,
      );
  } catch {
    return [];
  }
}

async function getResourceContextByTags(
  supabase: SupabaseClient,
  useCaseTags: string[],
): Promise<ResourceContext[]> {
  const { data, error } = await supabase
    .from("resource_chunks")
    .select(
      "chunk_text, chunk_summary, topic_tags, use_case_tags, curated_resources(title, source_name, source_url)",
    )
    .overlaps("use_case_tags", useCaseTags)
    .limit(8);

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
      match_count: 8,
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

export async function POST() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = authData.user.id;

  const { data: consent } = await supabase
    .from("consents")
    .select("allow_ai_analysis")
    .eq("user_id", userId)
    .single();

  if (!consent?.allow_ai_analysis) {
    return NextResponse.json(
      {
        error:
          "Please enable AI analysis in consent settings before generating recommendations.",
      },
      { status: 403 },
    );
  }

  const { data: latestSummary } = await supabase
    .from("emotion_summaries")
    .select("summary_text, dominant_moods, average_intensity, safety_level, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestSummary) {
    return NextResponse.json(
      {
        error:
          "Please analyze recent diary entries before generating recommendations.",
      },
      { status: 400 },
    );
  }

  if (latestSummary.safety_level === "elevated") {
    return NextResponse.json(
      {
        error:
          "Recent reflections may need extra support. Please review crisis resources before using activity recommendations.",
      },
      { status: 409 },
    );
  }

  const { data: entries, error: entriesError } = await supabase
    .from("diary_entries")
    .select("mood_labels, mood_intensity, diary_text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (entriesError) {
    return NextResponse.json({ error: entriesError.message }, { status: 500 });
  }

  const client = new OpenAI({
    timeout: 30_000,
  });
  const contextQuery = JSON.stringify({
    latest_summary: latestSummary,
    recent_entries: entries ?? [],
  });
  let activityContext = await getResourceContextByEmbedding(
    supabase,
    client,
    contextQuery,
    ["activity_recommendation"],
  );
  let safetyContext = await getResourceContextByEmbedding(
    supabase,
    client,
    contextQuery,
    ["safety_boundary"],
  );

  if (activityContext.length === 0) {
    activityContext = await getResourceContextByTags(supabase, [
      "activity_recommendation",
    ]);
  }

  if (safetyContext.length === 0) {
    safetyContext = await getResourceContextByTags(supabase, [
      "safety_boundary",
    ]);
  }
  const recommendationSources = getContextSources([
    ...activityContext,
    ...safetyContext,
  ]);

  let response;

  try {
    response = await client.responses.create({
      model,
      max_output_tokens: 900,
      input: [
        {
          role: "system",
          content:
            "You generate non-clinical art-inspired coping activity recommendations for people affected by cancer. Use activity_context for grounded creative activity framing and safety_context for boundaries. Do not call the activities art therapy, psychotherapy, treatment, or medical advice. Do not diagnose. Do not claim clinical benefit. Recommend gentle, optional, low-pressure creative activities that can be done digitally or on paper. Avoid trauma processing, exposure, body inspection, or emotionally intense prompts. Return only valid JSON with key recommendations, an array of exactly 2 items. Each item must include id, title, reason, whyThisFits, steps, and safetyNote. Do not invent citations or URLs. Use short practical steps.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction:
              "Generate two personalized art-inspired creative coping activities based on the latest non-clinical emotion summary and recent diary entries. Ground the activities in the provided context. Explain why each activity fits the emotion summary in whyThisFits.",
            latest_summary: latestSummary,
            recent_entries: entries ?? [],
            activity_context: activityContext,
            safety_context: safetyContext,
          }),
        },
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "OpenAI recommendation request failed.";

    return NextResponse.json(
      {
        error: `Recommendation generation failed: ${message}`,
      },
      { status: 500 },
    );
  }

  const recommendations = parseRecommendations(
    response.output_text,
    recommendationSources,
  );

  if (recommendations.length === 0) {
    return NextResponse.json(
      { error: "The recommendation response could not be parsed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ recommendations });
}
