import OpenAI from "openai";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const embeddingModel =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const promptVersion = "recommendation-v1.1";

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

type UserProfileContext = {
  age_range: string | null;
  cancer_type: string | null;
  journey_stage: string | null;
  country: string | null;
  preferred_language: string | null;
};

type ResourceContext = {
  chunkId: string | null;
  resourceId: string | null;
  text: string;
  summary: string | null;
  tags: string[];
  use_case_tags: string[];
  source: unknown;
  similarity?: number;
  retrievalType?: "activity" | "safety";
  retrievalRank?: number;
};

type EvidenceScopeContext = {
  sourceTitle: string;
  evidenceRole: string;
  evidenceDirection: string;
  populationFit: string;
  ageScope: string[];
  cancerStageScope: string[];
  careSettingScope: string[];
  cancerTypeScope: string[];
  generalizabilityNote: string | null;
};

type RecommendationSource = {
  title: string;
  sourceName: string;
  url: string | null;
};

type RecommendationSourceOption = RecommendationSource & {
  id: string;
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

type RecommendationPreferences = {
  energy: "surprise_me" | "low" | "medium";
  medium: "surprise_me" | "digital" | "paper";
  direction: "surprise_me" | "gently_engage" | "take_a_pause";
};

const defaultPreferences: RecommendationPreferences = {
  energy: "surprise_me",
  medium: "surprise_me",
  direction: "surprise_me",
};

function parsePreferences(value: unknown): RecommendationPreferences {
  const preferences =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    energy:
      preferences.energy === "low" || preferences.energy === "medium"
        ? preferences.energy
        : defaultPreferences.energy,
    medium:
      preferences.medium === "digital" || preferences.medium === "paper"
        ? preferences.medium
        : defaultPreferences.medium,
    direction:
      preferences.direction === "gently_engage" ||
      preferences.direction === "take_a_pause"
        ? preferences.direction
        : defaultPreferences.direction,
  };
}

async function getContextSources(
  supabase: SupabaseClient,
  context: ResourceContext[],
): Promise<RecommendationSourceOption[]> {
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

  const candidates = Array.from(sources.values());
  const sourceUrls = candidates.flatMap((source) =>
    source.url ? [source.url] : [],
  );

  if (sourceUrls.length === 0) {
    return candidates.slice(0, 6).map((source, index) => ({
      ...source,
      id: `source-${index + 1}`,
    }));
  }

  const { data, error } = await supabase
    .from("curated_resources")
    .select("source_url, display_to_users")
    .in("source_url", sourceUrls);

  // Keep the old behavior until the display_to_users migration is applied.
  if (error || !data) {
    return candidates.slice(0, 6).map((source, index) => ({
      ...source,
      id: `source-${index + 1}`,
    }));
  }

  const visibilityByUrl = new Map(
    data.map((source) => [source.source_url, source.display_to_users]),
  );

  return candidates
    .filter(
      (source) =>
        source.url === null || visibilityByUrl.get(source.url) !== false,
    )
    .slice(0, 6)
    .map((source, index) => ({
      ...source,
      id: `source-${index + 1}`,
    }));
}

async function getEvidenceScopeContext(
  supabase: SupabaseClient,
  context: ResourceContext[],
): Promise<EvidenceScopeContext[]> {
  const sourceUrls = Array.from(
    new Set(
      context.flatMap((item) => {
        const source = item.source as
          | { source_url?: unknown }
          | null
          | undefined;

        return typeof source?.source_url === "string"
          ? [source.source_url]
          : [];
      }),
    ),
  );

  if (sourceUrls.length === 0) {
    return [];
  }

  const { data: resources, error: resourcesError } = await supabase
    .from("curated_resources")
    .select("id, title")
    .in("source_url", sourceUrls);

  if (resourcesError || !resources || resources.length === 0) {
    return [];
  }

  const resourceTitles = new Map(
    resources.map((resource) => [resource.id, resource.title]),
  );
  const { data: links, error: linksError } = await supabase
    .from("recommendation_evidence_links")
    .select(
      "resource_id, evidence_role, evidence_direction, population_fit, age_scope, cancer_stage_scope, care_setting_scope, cancer_type_scope, generalizability_note",
    )
    .in(
      "resource_id",
      resources.map((resource) => resource.id),
    );

  if (linksError || !links) {
    return [];
  }

  return links.map((link) => ({
    sourceTitle: resourceTitles.get(link.resource_id) ?? "Curated source",
    evidenceRole: link.evidence_role,
    evidenceDirection: link.evidence_direction,
    populationFit: link.population_fit,
    ageScope: link.age_scope ?? [],
    cancerStageScope: link.cancer_stage_scope ?? [],
    careSettingScope: link.care_setting_scope ?? [],
    cancerTypeScope: link.cancer_type_scope ?? [],
    generalizabilityNote: link.generalizability_note,
  }));
}

async function enrichContextIds(
  supabase: SupabaseClient,
  context: ResourceContext[],
): Promise<ResourceContext[]> {
  const missingTexts = Array.from(
    new Set(
      context
        .filter((item) => !item.chunkId)
        .map((item) => item.text),
    ),
  );

  if (missingTexts.length === 0) {
    return context;
  }

  const { data, error } = await supabase
    .from("resource_chunks")
    .select("id, resource_id, chunk_text")
    .in("chunk_text", missingTexts);

  if (error || !data) {
    return context;
  }

  const idsByText = new Map(
    data.map((chunk) => [
      chunk.chunk_text,
      { chunkId: chunk.id, resourceId: chunk.resource_id },
    ]),
  );

  return context.map((item) => {
    const ids = idsByText.get(item.text);

    return ids
      ? {
          ...item,
          chunkId: ids.chunkId,
          resourceId: ids.resourceId,
        }
      : item;
  });
}

async function saveRecommendations(
  supabase: SupabaseClient,
  {
    userId,
    emotionSummaryId,
    preferences,
    recommendations,
    context,
    evidenceScopeContext,
  }: {
    userId: string;
    emotionSummaryId: string;
    preferences: RecommendationPreferences;
    recommendations: ActivityRecommendation[];
    context: ResourceContext[];
    evidenceScopeContext: EvidenceScopeContext[];
  },
): Promise<string | null> {
  const generationId = crypto.randomUUID();
  const usedResourceIds = Array.from(
    new Set(
      context.flatMap((item) =>
        item.resourceId ? [item.resourceId] : [],
      ),
    ),
  );

  const { data: savedRecommendations, error: recommendationError } =
    await supabase
      .from("recommendations")
      .insert(
        recommendations.map((recommendation) => ({
          user_id: userId,
          emotion_summary_id: emotionSummaryId,
          generation_id: generationId,
          title: recommendation.title,
          recommendation_text: recommendation.reason,
          activity_steps: recommendation.steps,
          used_resource_ids: usedResourceIds,
          safety_note: recommendation.safetyNote,
          model_name: model,
          rationale_summary: recommendation.whyThisFits,
          creative_preferences: preferences,
          evidence_summary: {
            retrieved_source_count: usedResourceIds.length,
            scope_notes: evidenceScopeContext,
            user_visible_sources: recommendation.sources,
          },
          prompt_version: promptVersion,
        })),
      )
      .select("id");

  if (
    recommendationError ||
    !savedRecommendations ||
    savedRecommendations.length !== recommendations.length
  ) {
    return recommendationError?.message ?? "Unable to save recommendations.";
  }

  const traces = savedRecommendations.flatMap((saved, recommendationIndex) => {
    const citedUrls = new Set(
      recommendations[recommendationIndex].sources.flatMap((source) =>
        source.url ? [source.url] : [],
      ),
    );

    return context.flatMap((item) => {
      if (!item.chunkId) {
        return [];
      }

      const source = item.source as
        | { source_url?: unknown }
        | null
        | undefined;
      const scope = evidenceScopeContext.find((entry) => {
        const contextSource = item.source as
          | { title?: unknown }
          | null
          | undefined;

        return (
          typeof contextSource?.title === "string" &&
          entry.sourceTitle === contextSource.title
        );
      });

      return [
        {
          recommendation_id: saved.id,
          resource_chunk_id: item.chunkId,
          resource_id: item.resourceId,
          retrieval_type: item.retrievalType ?? "activity",
          similarity: item.similarity ?? null,
          retrieval_rank: item.retrievalRank ?? null,
          evidence_role: scope?.evidenceRole ?? null,
          evidence_direction: scope?.evidenceDirection ?? null,
          population_fit: scope?.populationFit ?? null,
          generalizability_note: scope?.generalizabilityNote ?? null,
          included_in_prompt: true,
          cited_to_user:
            typeof source?.source_url === "string" &&
            citedUrls.has(source.source_url),
        },
      ];
    });
  });

  if (traces.length === 0) {
    return null;
  }

  const { error: traceError } = await supabase
    .from("recommendation_rag_traces")
    .insert(traces);

  return traceError?.message ?? null;
}

function parseRecommendations(
  text: string,
  sourceOptions: RecommendationSourceOption[],
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
        const recommendation = item as Partial<ActivityRecommendation> & {
          sourceIds?: unknown;
        };
        const sourceIds = Array.isArray(recommendation.sourceIds)
          ? recommendation.sourceIds.filter(
              (sourceId): sourceId is string =>
                typeof sourceId === "string",
            )
          : [];
        const sources = sourceIds
          .flatMap((sourceId) => {
            const source = sourceOptions.find(
              (option) => option.id === sourceId,
            );

            return source
              ? [
                  {
                    title: source.title,
                    sourceName: source.sourceName,
                    url: source.url,
                  },
                ]
              : [];
          })
          .slice(0, 2);

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
      "id, resource_id, chunk_text, chunk_summary, topic_tags, use_case_tags, curated_resources(id, title, source_name, source_url)",
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
      chunkId: chunk.id,
      resourceId: chunk.resource_id,
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
    chunkId: null,
    resourceId: null,
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

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = authData.user.id;
  let requestBody: unknown = {};

  try {
    requestBody = await request.json();
  } catch {
    // Preferences are optional, so an empty or invalid body uses defaults.
  }

  const preferences = parsePreferences(
    typeof requestBody === "object" && requestBody !== null
      ? (requestBody as Record<string, unknown>).preferences
      : null,
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "age_range, cancer_type, journey_stage, country, preferred_language",
    )
    .eq("id", userId)
    .maybeSingle();

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
    .select("id, summary_text, dominant_moods, average_intensity, safety_level, created_at")
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
    profile: profile ?? null,
    creative_preferences: preferences,
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
  activityContext = (await enrichContextIds(supabase, activityContext)).map(
    (item, index) => ({
      ...item,
      retrievalType: "activity",
      retrievalRank: index + 1,
    }),
  );
  safetyContext = (await enrichContextIds(supabase, safetyContext)).map(
    (item, index) => ({
      ...item,
      retrievalType: "safety",
      retrievalRank: index + 1,
    }),
  );
  const evidenceScopeContext = await getEvidenceScopeContext(supabase, [
    ...activityContext,
    ...safetyContext,
  ]);
  const recommendationSources = await getContextSources(supabase, [
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
            "You generate non-clinical art-inspired coping activity recommendations for people affected by cancer. There is no deterministic or universally valid one-to-one mapping between an emotion and an art exercise. Present every output as a tentative creative option, never as the correct activity for a feeling. Use creative_preferences as optional, momentary preferences rather than a wellbeing assessment: low energy should reduce steps and effort; medium should influence paper versus digital format; direction should gently shape whether options engage with a feeling or offer a pause. A preference is a soft constraint, never permission to force emotional disclosure, and surprise_me means preserve variety. Use activity_context for grounded creative activity framing and safety_context for boundaries. Use evidence_scope_context to judge how closely retrieved evidence matches the user's optional profile. Treat profile fields as contextual preferences, not clinical facts. When evidence comes from a different age group, cancer type, journey stage, or care setting, adapt conservatively and describe the connection with lower certainty. Never imply that evidence from hospitalized adolescents, a specific cancer population, or professionally delivered art therapy directly validates a self-guided activity for a different user. If scope data is absent or mismatched, keep the activity low-risk and general rather than filling gaps with clinical assumptions. Separate evidence-supported mechanisms from creative presentation: reasons and whyThisFits may refer only to grounded mechanisms or broad principles, while materials, colors, subjects, composition, and mark-making can vary as clearly non-validated creative adaptations. Do not imply that every material variation was studied. Treat sources as background principles and creative constraints for source-informed adaptation, not as a closed catalog of activities or instructions that prescribe exact art activities. You may create gentle variations that combine supported principles with different colors, marks, shapes, patterns, symbols, collage-like composition, short captions, or digital and paper formats. Keep adaptations proportionate to the evidence and clearly distinguish them from a study's exact activity. Do not say or imply that NIH, NCCIH, AATA, ACS, or any source recommends this specific activity unless the source explicitly does. Do not call the activities art therapy, psychotherapy, treatment, or medical advice. Do not diagnose. Do not claim clinical benefit, symptom reduction, or guaranteed emotional improvement. Generate exactly two genuinely different, complementary options so the user can choose what feels right. Unless the user's medium preference requires otherwise, use different materials or visual structures for the two options. Vary the creative process, visual structure, level of emotional engagement, and effort level; avoid repeatedly defaulting to the same watercolor, mandala, breathing-color, or journaling prompt unless it is especially relevant. When supported by the retrieved context, one option may gently engage with, notice, or express the emotion, while the other may offer soothing, grounding, attentional shifting, or a neutral absorbing subject. Do not rank the options, claim one regulation strategy is generally better, or imply the user should avoid, suppress, confront, or process an emotion. Never force emotional disclosure or interpretation. Recommend gentle, optional, low-pressure creative activities that can be done digitally or on paper. Avoid trauma processing, exposure, body inspection, or emotionally intense prompts. Every recommendation should make it easy for the user to stop, rest, simplify, or choose something else. Return only valid JSON with key recommendations, an array of exactly 2 items. Each item must include id, title, reason, whyThisFits, steps, safetyNote, and sourceIds. sourceIds must contain zero to two IDs copied exactly from user_facing_source_options that genuinely support that specific option. Do not automatically attach the same sources to both recommendations. Use an empty array when no visible source clearly fits. Never invent source IDs, citations, or URLs. Use short practical steps.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction:
              "Generate two personalized and meaningfully different art-inspired creative coping options based on the latest non-clinical emotion summary and recent diary entries. Present them as equal choices, not as a best option and a fallback. Ground them in the provided context as gentle adaptations of general principles, not as source-prescribed interventions. Explain why each option might fit in tentative, non-clinical language, and preserve the user's choice between engaging with a feeling and taking a gentle pause from it when the evidence context supports both.",
            latest_summary: latestSummary,
            recent_entries: entries ?? [],
            profile: (profile ?? null) as UserProfileContext | null,
            creative_preferences: preferences,
            activity_context: activityContext,
            safety_context: safetyContext,
            evidence_scope_context: evidenceScopeContext,
            user_facing_source_options: recommendationSources.map((source) => ({
              id: source.id,
              title: source.title,
              source_name: source.sourceName,
            })),
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

  const saveError = await saveRecommendations(supabase, {
    userId,
    emotionSummaryId: latestSummary.id,
    preferences,
    recommendations,
    context: [...activityContext, ...safetyContext],
    evidenceScopeContext,
  });

  if (saveError) {
    return NextResponse.json(
      { error: `Recommendations were generated but could not be saved: ${saveError}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ recommendations });
}
