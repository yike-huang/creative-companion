import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { ProfileOnboardingForm } from "@/components/profile-onboarding-form";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

async function ProfileDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, email, display_name, age_range, cancer_type, journey_stage, country, preferred_language",
    )
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    const t = getDictionary("en");

    return (
      <div className="rounded-md border p-5">
        <h2 className="text-xl font-semibold">{t.profile.missingTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.profile.missingDescription}
        </p>
      </div>
    );
  }

  const t = getDictionary(normalizeLanguage(profile.preferred_language));

  return (
    <div className="grid gap-6 rounded-md border p-5">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">{t.profile.backgroundTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {t.profile.backgroundDescription}
        </p>
      </div>
      <ProfileOnboardingForm profile={profile} copy={t.profile} />
    </div>
  );
}

async function ProfileHeader() {
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

  return <PageHero title={t.profile.pageTitle} intro={t.profile.pageIntro} />;
}

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <ProfileHeader />
        </Suspense>

        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <ProfileDetails />
        </Suspense>
      </div>
    </AppShell>
  );
}
