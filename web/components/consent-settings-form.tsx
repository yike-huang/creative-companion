"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type ConsentSettings = {
  id: string;
  allow_ai_analysis: boolean;
  allow_diary_storage: boolean;
  allow_emotion_summary_storage: boolean;
  allow_artwork_storage: boolean;
  allow_audio_generation: boolean;
  allow_emergency_contact: boolean;
  emergency_contact_name: string | null;
  emergency_contact_email: string | null;
};

type ConsentSettingsFormProps = {
  consent: ConsentSettings;
  supportsAudioGeneration: boolean;
  copy: {
    allowDiaryStorage: string;
    allowDiaryStorageDescription: string;
    allowAiAnalysis: string;
    allowAiAnalysisDescription: string;
    allowSummaryStorage: string;
    allowSummaryStorageDescription: string;
    allowArtworkStorage: string;
    allowArtworkStorageDescription: string;
    allowAudioGeneration: string;
    allowAudioGenerationDescription: string;
    allowEmergencyContact: string;
    allowEmergencyContactDescription: string;
    emergencyContactName: string;
    emergencyContactEmail: string;
    emergencyContactNote: string;
    optional: string;
    saved: string;
    saving: string;
    save: string;
  };
};

const consentOptions = [
  {
    key: "allow_diary_storage",
    labelKey: "allowDiaryStorage",
    descriptionKey: "allowDiaryStorageDescription",
  },
  {
    key: "allow_ai_analysis",
    labelKey: "allowAiAnalysis",
    descriptionKey: "allowAiAnalysisDescription",
  },
  {
    key: "allow_emotion_summary_storage",
    labelKey: "allowSummaryStorage",
    descriptionKey: "allowSummaryStorageDescription",
  },
  {
    key: "allow_artwork_storage",
    labelKey: "allowArtworkStorage",
    descriptionKey: "allowArtworkStorageDescription",
  },
  {
    key: "allow_audio_generation",
    labelKey: "allowAudioGeneration",
    descriptionKey: "allowAudioGenerationDescription",
  },
  {
    key: "allow_emergency_contact",
    labelKey: "allowEmergencyContact",
    descriptionKey: "allowEmergencyContactDescription",
  },
] as const;

type ConsentKey = (typeof consentOptions)[number]["key"];
type ConsentOptionCopyKey = (typeof consentOptions)[number][
  | "labelKey"
  | "descriptionKey"];

export function ConsentSettingsForm({
  consent,
  supportsAudioGeneration,
  copy,
}: ConsentSettingsFormProps) {
  const [values, setValues] = useState({
    allow_ai_analysis: consent.allow_ai_analysis,
    allow_diary_storage: consent.allow_diary_storage,
    allow_emotion_summary_storage: consent.allow_emotion_summary_storage,
    allow_artwork_storage: consent.allow_artwork_storage,
    allow_audio_generation: consent.allow_audio_generation,
    allow_emergency_contact: consent.allow_emergency_contact,
    emergency_contact_name: consent.emergency_contact_name ?? "",
    emergency_contact_email: consent.emergency_contact_email ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  function setConsentValue(key: ConsentKey, checked: boolean) {
    setValues((current) => ({
      ...current,
      [key]: checked,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = createClient();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const updateValues = supportsAudioGeneration
      ? values
      : {
          allow_ai_analysis: values.allow_ai_analysis,
          allow_diary_storage: values.allow_diary_storage,
          allow_emotion_summary_storage: values.allow_emotion_summary_storage,
          allow_artwork_storage: values.allow_artwork_storage,
          allow_emergency_contact: values.allow_emergency_contact,
          emergency_contact_name: values.emergency_contact_name,
          emergency_contact_email: values.emergency_contact_email,
        };

    const { error } = await supabase
      .from("consents")
      .update({
        ...updateValues,
        emergency_contact_name: values.allow_emergency_contact
          ? values.emergency_contact_name || null
          : null,
        emergency_contact_email: values.allow_emergency_contact
          ? values.emergency_contact_email || null
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", consent.id);

    if (error) {
      setError(error.message);
    } else {
      setMessage(copy.saved);
      router.refresh();
    }

    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-4">
        {consentOptions
          .filter(
            (option) =>
              supportsAudioGeneration || option.key !== "allow_audio_generation",
          )
          .map((option) => (
          <div key={option.key} className="flex items-start gap-3 rounded-md border p-4">
            <Checkbox
              id={option.key}
              checked={values[option.key]}
              onCheckedChange={(checked) =>
                setConsentValue(option.key, checked === true)
              }
            />
            <div className="grid gap-1.5">
              <Label htmlFor={option.key}>
                {copy[option.labelKey as ConsentOptionCopyKey]}
              </Label>
              <p className="text-sm text-muted-foreground">
                {copy[option.descriptionKey as ConsentOptionCopyKey]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {values.allow_emergency_contact && (
        <div className="grid gap-4 rounded-md border p-4">
          <div className="grid gap-2">
            <Label htmlFor="emergency_contact_name">
              {copy.emergencyContactName}
            </Label>
            <Input
              id="emergency_contact_name"
              value={values.emergency_contact_name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  emergency_contact_name: event.target.value,
                }))
              }
              placeholder={copy.optional}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emergency_contact_email">
              {copy.emergencyContactEmail}
            </Label>
            <Input
              id="emergency_contact_email"
              type="email"
              value={values.emergency_contact_email}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  emergency_contact_email: event.target.value,
                }))
              }
              placeholder={copy.optional}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {copy.emergencyContactNote}
          </p>
        </div>
      )}

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-fit" disabled={isSaving}>
        {isSaving ? copy.saving : copy.save}
      </Button>
    </form>
  );
}
