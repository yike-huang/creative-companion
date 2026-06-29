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

function getSafetyMessage(safetyLevel: string) {
  if (safetyLevel === "elevated") {
    return "Some parts of this reflection may deserve extra care. Crisis resources are available if you feel at risk or need urgent support.";
  }

  if (safetyLevel === "low") {
    return "This reflection noticed some strain. Treat it as a gentle, non-clinical read of your recent entries.";
  }

  return "This is a gentle reflection, not a diagnosis.";
}

function EmotionSummaryCard({
  summary,
  onDeleted,
}: {
  summary: EmotionSummary;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const shouldDelete = window.confirm("Delete this reflection?");

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
        <span>Support note: {summary.safety_level}</span>
        {summary.average_intensity !== null && (
          <span>Average intensity: {summary.average_intensity}/10</span>
        )}
      </div>
      <p className="text-sm leading-6">{summary.summary_text}</p>
      <p className="text-sm text-muted-foreground">
        {getSafetyMessage(summary.safety_level)}
      </p>
      {summary.dominant_moods.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Noticed themes: {summary.dominant_moods.join(", ")}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {summary.safety_level === "elevated" && (
          <Button asChild variant="outline" className="w-fit">
            <a href="/crisis">View crisis resources</a>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete analysis"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </article>
  );
}

export function EmotionSummaryList({
  summaries,
}: {
  summaries: EmotionSummary[];
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
        <h2 className="text-xl font-semibold">Latest reflection</h2>
        <p className="text-sm text-muted-foreground">
          A gentle read of your recent entries. You can keep it, delete it, or
          create a new one later.
        </p>
      </div>

      {latestSummary && (
        <EmotionSummaryCard
          summary={latestSummary}
          onDeleted={() => hideSummary(latestSummary.id)}
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
            {showHistory ? "Hide reflection history" : "View reflection history"}
          </Button>

          {showHistory && (
            <div className="grid gap-4">
              {historySummaries.map((summary) => (
                <EmotionSummaryCard
                  key={summary.id}
                  summary={summary}
                  onDeleted={() => hideSummary(summary.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
