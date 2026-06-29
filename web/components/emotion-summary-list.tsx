"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type EmotionSummary = {
  id: string;
  summary_text: string;
  dominant_moods: string[];
  average_intensity: number | null;
  safety_level: string;
  created_at: string;
};

type EmotionSummaryCopy = {
  latestReflectionTitle: string;
  latestReflectionDescription: string;
  supportNote: string;
  averageIntensity: string;
  noticedThemes: string;
  viewCrisisResources: string;
  deleteReflection: string;
  deleting: string;
  deleteReflectionConfirm: string;
  showHistory: string;
  hideHistory: string;
  safetyElevated: string;
  safetyLow: string;
  safetyNone: string;
};

function getSafetyMessage(safetyLevel: string, copy: EmotionSummaryCopy) {
  if (safetyLevel === "elevated") {
    return copy.safetyElevated;
  }

  if (safetyLevel === "low") {
    return copy.safetyLow;
  }

  return copy.safetyNone;
}

function EmotionSummaryCard({
  summary,
  onDeleted,
  copy,
}: {
  summary: EmotionSummary;
  onDeleted: () => void;
  copy: EmotionSummaryCopy;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const shouldDelete = window.confirm(copy.deleteReflectionConfirm);

    if (!shouldDelete) {
      return;
    }

    const supabase = createClient();
    setIsDeleting(true);
    setError(null);

    const { error: deleteError } = await supabase
      .from("emotion_summaries")
      .delete()
      .eq("id", summary.id);

    if (deleteError) {
      setError(deleteError.message);
      setIsDeleting(false);
      return;
    }

    onDeleted();
    router.refresh();
  }

  return (
    <article className="grid gap-3 rounded-md border p-5">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>{new Date(summary.created_at).toLocaleString()}</span>
        <span>
          {copy.supportNote}: {summary.safety_level}
        </span>
        {summary.average_intensity !== null && (
          <span>
            {copy.averageIntensity}: {summary.average_intensity}/10
          </span>
        )}
      </div>
      <p className="text-sm leading-6">{summary.summary_text}</p>
      <p className="text-sm text-muted-foreground">
        {getSafetyMessage(summary.safety_level, copy)}
      </p>
      {summary.dominant_moods.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {copy.noticedThemes}: {summary.dominant_moods.join(", ")}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {summary.safety_level === "elevated" && (
          <Button asChild variant="outline" className="w-fit">
            <a href="/crisis">{copy.viewCrisisResources}</a>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? copy.deleting : copy.deleteReflection}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </article>
  );
}

export function EmotionSummaryList({
  summaries,
  copy,
}: {
  summaries: EmotionSummary[];
  copy: EmotionSummaryCopy;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const visibleSummaries = summaries.filter(
    (summary) => !hiddenIds.includes(summary.id),
  );
  const latestSummary = visibleSummaries[0];
  const historySummaries = visibleSummaries.slice(1);

  if (visibleSummaries.length === 0) {
    return null;
  }

  function hideSummary(id: string) {
    setHiddenIds((current) => [...current, id]);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">
          {copy.latestReflectionTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          {copy.latestReflectionDescription}
        </p>
      </div>

      {latestSummary && (
        <EmotionSummaryCard
          summary={latestSummary}
          onDeleted={() => hideSummary(latestSummary.id)}
          copy={copy}
        />
      )}

      {historySummaries.length > 0 && (
        <div className="grid gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => setShowHistory((current) => !current)}
          >
            {showHistory ? copy.hideHistory : copy.showHistory}
          </Button>

          {showHistory && (
            <div className="grid gap-4">
              {historySummaries.map((summary) => (
                <EmotionSummaryCard
                  key={summary.id}
                  summary={summary}
                  onDeleted={() => hideSummary(summary.id)}
                  copy={copy}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
