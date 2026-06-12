import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ProfileOnboardingForm } from "@/components/profile-onboarding-form";
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
    return (
      <div className="rounded-md border p-5">
        <h2 className="text-xl font-semibold">Profile not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account exists, but a matching profile row was not found yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 rounded-md border p-5">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">Your background</h2>
        <p className="text-sm text-muted-foreground">
          These fields are optional and should stay limited to what helps the
          app personalize supportive, art-inspired coping suggestions.
        </p>
      </div>
      <ProfileOnboardingForm profile={profile} />
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">Creative Companion</h1>
        <p className="max-w-2xl text-muted-foreground">
          Start with a small profile so the app can personalize future
          reflections and creative coping suggestions with care.
        </p>
      </div>

      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
      >
        <ProfileDetails />
      </Suspense>
    </div>
  );
}
