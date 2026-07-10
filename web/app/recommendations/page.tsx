import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
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
  const { data: consent } = await supabase
    .from("consents")
    .select("allow_artwork_storage")
    .eq("user_id", data.user.id)
    .single();
  const t = getDictionary(normalizeLanguage(profile?.preferred_language));

  return (
    <RecommendationWorkspace
      userId={data.user.id}
      copy={t.recommendations}
      artworkCopy={t.artworks}
      canStoreArtwork={Boolean(consent?.allow_artwork_storage)}
      language={profile?.preferred_language}
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
    <PageHero
      title={t.recommendations.pageTitle}
      intro={t.recommendations.pageIntro}
    />
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
