import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { AnalyzeDiaryButton } from "@/components/analyze-diary-button";
import { DiaryEntryForm } from "@/components/diary-entry-form";
import { DiaryEntryList } from "@/components/diary-entry-list";
import { EmotionSummaryList } from "@/components/emotion-summary-list";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

async function DiaryDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

  const { data: consent } = await supabase
    .from("consents")
    .select("allow_diary_storage")
    .eq("user_id", data.user.id)
    .single();

  if (!consent?.allow_diary_storage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", data.user.id)
      .single();
    const t = getDictionary(normalizeLanguage(profile?.preferred_language));

    return (
      <div className="grid gap-4 rounded-md border p-5">
        <h2 className="text-xl font-semibold">{t.diary.storageOffTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {t.diary.storageOffDescription}
        </p>
        <Button asChild className="w-fit" variant="outline">
          <Link href="/consent">{t.diary.openConsent}</Link>
        </Button>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", data.user.id)
    .single();
  const t = getDictionary(normalizeLanguage(profile?.preferred_language));

  const { data: entries } = await supabase
    .from("diary_entries")
    .select("id, mood_labels, mood_intensity, diary_text, created_at")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false });

  const { data: summaries } = await supabase
    .from("emotion_summaries")
    .select(
      "id, summary_text, dominant_moods, average_intensity, safety_level, created_at",
    )
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="grid gap-8">
      <AnalyzeDiaryButton copy={t.diary} />
      <EmotionSummaryList summaries={summaries ?? []} copy={t.diary} />
      <DiaryEntryForm userId={data.user.id} copy={t.diary} />
      <DiaryEntryList entries={entries ?? []} copy={t.diary} />
    </div>
  );
}

async function DiaryHeader() {
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

  return <PageHero title={t.diary.pageTitle} intro={t.diary.pageIntro} />;
}

export default function DiaryPage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <DiaryHeader />
        </Suspense>

        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <DiaryDetails />
        </Suspense>
      </div>
    </AppShell>
  );
}
