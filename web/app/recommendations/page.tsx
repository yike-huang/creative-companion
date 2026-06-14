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
            Choose a starter art-inspired activity, then open a side-by-side
            creation space where you can keep the recommendation visible while
            drawing.
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
