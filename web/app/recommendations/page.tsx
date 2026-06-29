import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { RecommendationWorkspace } from "@/components/recommendation-workspace";
import { createClient } from "@/lib/supabase/server";

async function RecommendationsContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

  return <RecommendationWorkspace userId={data.user.id} />;
}

export default function RecommendationsPage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold">Recommendations</h1>
          <p className="max-w-2xl text-muted-foreground">
            Here you can explore non-clinical, art-inspired activity ideas from
            your latest emotion reflection and curated resources. If an idea
            feels useful, you can open a side-by-side space and keep it visible
            while you create.
          </p>
        </div>

        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <RecommendationsContent />
        </Suspense>
      </div>
    </AppShell>
  );
}
