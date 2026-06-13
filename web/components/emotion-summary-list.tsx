type EmotionSummary = {
  id: string;
  summary_text: string;
  dominant_moods: string[];
  average_intensity: number | null;
  safety_level: string;
  created_at: string;
};

export function EmotionSummaryList({
  summaries,
}: {
  summaries: EmotionSummary[];
}) {
  if (summaries.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Recent summaries</h2>
      {summaries.map((summary) => (
        <article key={summary.id} className="grid gap-2 rounded-md border p-5">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{new Date(summary.created_at).toLocaleString()}</span>
            <span>Safety: {summary.safety_level}</span>
            {summary.average_intensity !== null && (
              <span>Average intensity: {summary.average_intensity}/10</span>
            )}
          </div>
          <p className="text-sm">{summary.summary_text}</p>
          {summary.dominant_moods.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Dominant moods: {summary.dominant_moods.join(", ")}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
