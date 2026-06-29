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
  allow_emergency_contact: boolean;
  emergency_contact_name: string | null;
  emergency_contact_email: string | null;
};

type ConsentSettingsFormProps = {
  consent: ConsentSettings;
};

const consentOptions = [
  {
    key: "allow_diary_storage",
    label: "Allow diary storage",
    description: "Save daily check-ins and diary entries to your account.",
  },
  {
    key: "allow_ai_analysis",
    label: "Allow AI-assisted reflection",
    description:
      "Allow AI to review diary entries for gentle, non-clinical emotional pattern reflections.",
  },
  {
    key: "allow_emotion_summary_storage",
    label: "Allow reflection summary storage",
    description:
      "Save generated emotional reflections so you can review them later.",
  },
  {
    key: "allow_artwork_storage",
    label: "Allow artwork storage",
    description: "Save uploaded artwork photos and reflections in your account.",
  },
  {
    key: "allow_emergency_contact",
    label: "Allow optional emergency contact information",
    description:
      "Store contact details for future user-initiated safety actions. The app should not contact anyone automatically.",
  },
] as const;

type ConsentKey = (typeof consentOptions)[number]["key"];

export function ConsentSettingsForm({ consent }: ConsentSettingsFormProps) {
  const [values, setValues] = useState({
    allow_ai_analysis: consent.allow_ai_analysis,
    allow_diary_storage: consent.allow_diary_storage,
    allow_emotion_summary_storage: consent.allow_emotion_summary_storage,
    allow_artwork_storage: consent.allow_artwork_storage,
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

    const { error } = await supabase
      .from("consents")
      .update({
        ...values,
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
      setMessage("Your consent settings have been saved.");
      router.refresh();
    }

    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-4">
        {consentOptions.map((option) => (
          <div key={option.key} className="flex items-start gap-3 rounded-md border p-4">
            <Checkbox
              id={option.key}
              checked={values[option.key]}
              onCheckedChange={(checked) =>
                setConsentValue(option.key, checked === true)
              }
            />
            <div className="grid gap-1.5">
              <Label htmlFor={option.key}>{option.label}</Label>
              <p className="text-sm text-muted-foreground">
                {option.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {values.allow_emergency_contact && (
        <div className="grid gap-4 rounded-md border p-4">
          <div className="grid gap-2">
            <Label htmlFor="emergency_contact_name">
              Emergency contact name
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
              placeholder="Optional"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emergency_contact_email">
              Emergency contact email
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
              placeholder="Optional"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Emergency contact actions should remain user-initiated and manually
            confirmed.
          </p>
        </div>
      )}

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-fit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save consent settings"}
      </Button>
    </form>
  );
}
