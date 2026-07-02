import { redirect } from "next/navigation";
import { Palette, Sparkles } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-lg border border-border/70 bg-[linear-gradient(135deg,rgba(240,253,250,0.9)_0%,hsl(var(--background))_58%,rgba(255,237,213,0.65)_100%)] p-6 shadow-sm md:p-8 dark:bg-[linear-gradient(135deg,rgba(20,83,45,0.18)_0%,hsl(var(--background))_58%,rgba(124,45,18,0.18)_100%)]">
      <div className="absolute right-5 top-5 hidden items-center gap-2 text-muted-foreground md:flex">
        <Palette className="size-5" />
        <Sparkles className="size-4" />
      </div>
      <div className="grid max-w-3xl gap-3">
        <h1 className="text-3xl font-bold">
          {t.recommendations.pageTitle}
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          {t.recommendations.pageIntro}
        </p>
      </div>
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
