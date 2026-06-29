import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { RecommendationWorkspace } from "@/components/recommendation-workspace";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

async function RecommendationsContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", data.user.id)
    .single();
  const t = getDictionary(normalizeLanguage(profile?.preferred_language));

  return (
    <RecommendationWorkspace
      userId={data.user.id}
      copy={t.recommendations}
      artworkCopy={t.artworks}
    />
  );
}

async function RecommendationsHeader() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const { data: profile } = authData.user
    ? await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", authData.user.id)
        .single()
    : { data: null };
  const t = getDictionary(normalizeLanguage(profile?.preferred_language));

  return (
    <div className="grid gap-2">
      <h1 className="text-3xl font-bold">{t.recommendations.pageTitle}</h1>
      <p className="max-w-2xl text-muted-foreground">
        {t.recommendations.pageIntro}
      </p>
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <RecommendationsHeader />
        </Suspense>

        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <RecommendationsContent />
        </Suspense>
      </div>
    </AppShell>
  );
}
