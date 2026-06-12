"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  display_name: string;
  age_range: string | null;
  cancer_type: string | null;
  journey_stage: string | null;
  country: string | null;
  preferred_language: string;
};

type ProfileOnboardingFormProps = {
  profile: Profile;
};

export function ProfileOnboardingForm({ profile }: ProfileOnboardingFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [ageRange, setAgeRange] = useState(profile.age_range ?? "");
  const [cancerType, setCancerType] = useState(profile.cancer_type ?? "");
  const [journeyStage, setJourneyStage] = useState(profile.journey_stage ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [preferredLanguage, setPreferredLanguage] = useState(
    profile.preferred_language,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = createClient();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        age_range: ageRange || null,
        cancer_type: cancerType || null,
        journey_stage: journeyStage || null,
        country: country || null,
        preferred_language: preferredLanguage || "en",
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Profile saved.");
      router.refresh();
    }

    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="How should Creative Companion address you?"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="age_range">Age range</Label>
        <Input
          id="age_range"
          value={ageRange}
          onChange={(event) => setAgeRange(event.target.value)}
          placeholder="Example: 18-24, 25-34, 35-44"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cancer_type">Cancer type</Label>
        <Input
          id="cancer_type"
          value={cancerType}
          onChange={(event) => setCancerType(event.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="journey_stage">Cancer journey stage</Label>
        <Input
          id="journey_stage"
          value={journeyStage}
          onChange={(event) => setJourneyStage(event.target.value)}
          placeholder="Example: treatment, survivorship, recurrence monitoring"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="country">Current country of residence</Label>
        <Input
          id="country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          placeholder="Example: United States"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="preferred_language">Preferred language</Label>
        <Input
          id="preferred_language"
          value={preferredLanguage}
          onChange={(event) => setPreferredLanguage(event.target.value)}
          placeholder="Example: en, zh, es"
        />
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-fit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
