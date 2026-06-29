import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { ConsentSettingsForm } from "@/components/consent-settings-form";
import { CreateConsentButton } from "@/components/create-consent-button";
import { createClient } from "@/lib/supabase/server";

async function ConsentDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

  const { data: consent, error: consentError } = await supabase
    .from("consents")
    .select(
      "id, allow_ai_analysis, allow_diary_storage, allow_emotion_summary_storage, allow_artwork_storage, allow_emergency_contact, emergency_contact_name, emergency_contact_email",
    )
    .eq("user_id", data.user.id)
    .single();

  if (consentError || !consent) {
    return (
      <div className="grid gap-4 rounded-md border p-5">
        <h2 className="text-xl font-semibold">No consent settings yet</h2>
        <p className="text-sm text-muted-foreground">
          Consent settings are needed before diary, AI, artwork, or optional
          emergency contact features are used.
        </p>
        <CreateConsentButton userId={data.user.id} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 rounded-md border p-5">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">Your choices</h2>
        <p className="text-sm text-muted-foreground">
          You can change these settings later. Turning a setting off should
          prevent future use of that data for the related feature.
        </p>
      </div>
      <ConsentSettingsForm consent={consent} />
    </div>
  );
}

export default function ConsentPage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold">Consent settings</h1>
          <p className="max-w-2xl text-muted-foreground">
            Here you can decide how AI reflection, data storage, artwork
            storage, and optional emergency contact preferences work for your
            account.
          </p>
        </div>

        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <ConsentDetails />
        </Suspense>
      </div>
    </AppShell>
  );
}
