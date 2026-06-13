import OpenAI from "openai";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const highRiskPatterns = [
  "suicide",
  "kill myself",
  "end my life",
  "harm myself",
  "hurt myself",
  "want to die",
  "no reason to live",
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

function parseAnalysis(text: string): AnalysisResult {
  try {
    const parsed = JSON.parse(text) as Partial<AnalysisResult>;
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
      summary_text: text,
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

  const averageIntensity =
    entries.reduce((sum, entry) => sum + (entry.mood_intensity ?? 0), 0) /
    entries.length;
  const heuristicSafetyLevel = estimateSafetyLevel(entries);

  const client = new OpenAI({
    timeout: 30_000,
  });

  let response;

  try {
    response = await client.responses.create({
      model,
      max_output_tokens: 500,
      input: [
        {
          role: "system",
          content:
            "You analyze private diary check-ins for a non-clinical emotional support app. Do not diagnose, provide medical advice, provide psychotherapy, or give crisis counseling. Return only valid JSON with keys summary_text, dominant_moods, and safety_level. safety_level must be one of none, low, elevated. Keep summary_text gentle, concise, and non-clinical.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction:
              "Summarize recent emotional patterns from these diary entries. Do not provide coping recommendations yet.",
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
