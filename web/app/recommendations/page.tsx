import { AppShell } from "@/components/app-shell";

export default function RecommendationsPage() {
  return (
    <AppShell>
      <div className="grid gap-3">
        <h1 className="text-3xl font-bold">Recommendations</h1>
        <p className="max-w-2xl text-muted-foreground">
          This area will show art-inspired coping activities grounded in diary
          reflections, emotion patterns, profile context, and curated sources.
        </p>
      </div>
    </AppShell>
  );
}
