import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { ConsentSettingsForm } from "@/components/consent-settings-form";
import { CreateConsentButton } from "@/components/create-consent-button";
import { PageHero } from "@/components/page-hero";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

async function ConsentDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

  let supportsAudioGeneration = true;
  let { data: consent, error: consentError } = await supabase
    .from("consents")
    .select(
      "id, allow_ai_analysis, allow_diary_storage, allow_emotion_summary_storage, allow_artwork_storage, allow_audio_generation, allow_emergency_contact, emergency_contact_name, emergency_contact_email",
    )
    .eq("user_id", data.user.id)
    .single();

  if (consentError?.code === "42703") {
    supportsAudioGeneration = false;
    const fallbackResult = await supabase
      .from("consents")
      .select(
        "id, allow_ai_analysis, allow_diary_storage, allow_emotion_summary_storage, allow_artwork_storage, allow_emergency_contact, emergency_contact_name, emergency_contact_email",
      )
      .eq("user_id", data.user.id)
      .single();

    consent = fallbackResult.data
      ? { ...fallbackResult.data, allow_audio_generation: false }
      : null;
    consentError = fallbackResult.error;
  }

  if (consentError || !consent) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", data.user.id)
      .single();
    const t = getDictionary(normalizeLanguage(profile?.preferred_language));

    return (
      <div className="grid gap-4 rounded-md border p-5">
        <h2 className="text-xl font-semibold">{t.consent.missingTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {t.consent.missingDescription}
        </p>
        <CreateConsentButton userId={data.user.id} copy={t.consent} />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", data.user.id)
    .single();
  const t = getDictionary(normalizeLanguage(profile?.preferred_language));

  return (
    <div className="grid gap-6 rounded-md border p-5">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">{t.consent.choicesTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {t.consent.choicesDescription}
        </p>
      </div>
      <ConsentSettingsForm
        consent={consent}
        copy={t.consent}
        supportsAudioGeneration={supportsAudioGeneration}
      />
    </div>
  );
}

async function ConsentHeader() {
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

  return <PageHero title={t.consent.pageTitle} intro={t.consent.pageIntro} />;
}

export default function ConsentPage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <ConsentHeader />
        </Suspense>

        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <ConsentDetails />
        </Suspense>
      </div>
    </AppShell>
  );
}
