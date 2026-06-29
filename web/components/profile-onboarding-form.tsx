"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeLanguage, supportedLanguages } from "@/lib/i18n";
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
  copy: {
    displayName: string;
    displayNamePlaceholder: string;
    ageRange: string;
    ageRangePlaceholder: string;
    cancerType: string;
    journeyStage: string;
    journeyStagePlaceholder: string;
    country: string;
    countryPlaceholder: string;
    preferredLanguage: string;
    optional: string;
    saved: string;
    saving: string;
    save: string;
  };
};

export function ProfileOnboardingForm({
  profile,
  copy,
}: ProfileOnboardingFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [ageRange, setAgeRange] = useState(profile.age_range ?? "");
  const [cancerType, setCancerType] = useState(profile.cancer_type ?? "");
  const [journeyStage, setJourneyStage] = useState(profile.journey_stage ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [preferredLanguage, setPreferredLanguage] = useState(
    normalizeLanguage(profile.preferred_language),
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
        preferred_language: preferredLanguage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      setError(error.message);
    } else {
      document.cookie = `creative_companion_language=${preferredLanguage}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = preferredLanguage;
      setMessage(copy.saved);
      router.refresh();
    }

    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="display_name">{copy.displayName}</Label>
        <Input
          id="display_name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={copy.displayNamePlaceholder}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="age_range">{copy.ageRange}</Label>
        <Input
          id="age_range"
          value={ageRange}
          onChange={(event) => setAgeRange(event.target.value)}
          placeholder={copy.ageRangePlaceholder}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cancer_type">{copy.cancerType}</Label>
        <Input
          id="cancer_type"
          value={cancerType}
          onChange={(event) => setCancerType(event.target.value)}
          placeholder={copy.optional}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="journey_stage">{copy.journeyStage}</Label>
        <Input
          id="journey_stage"
          value={journeyStage}
          onChange={(event) => setJourneyStage(event.target.value)}
          placeholder={copy.journeyStagePlaceholder}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="country">{copy.country}</Label>
        <Input
          id="country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          placeholder={copy.countryPlaceholder}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="preferred_language">{copy.preferredLanguage}</Label>
        <select
          id="preferred_language"
          value={preferredLanguage}
          onChange={(event) =>
            setPreferredLanguage(normalizeLanguage(event.target.value))
          }
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        >
          {supportedLanguages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-fit" disabled={isSaving}>
        {isSaving ? copy.saving : copy.save}
      </Button>
    </form>
  );
}
