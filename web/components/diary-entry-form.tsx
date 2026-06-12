"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { moodOptions } from "@/components/mood-options";
import { createClient } from "@/lib/supabase/client";

export function DiaryEntryForm({ userId }: { userId: string }) {
  const [moodLabels, setMoodLabels] = useState<string[]>([]);
  const [moodIntensity, setMoodIntensity] = useState("5");
  const [diaryText, setDiaryText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  function toggleMood(value: string) {
    setMoodLabels((current) => {
      if (current.includes(value)) {
        return current.filter((mood) => mood !== value);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, value];
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = createClient();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const { error } = await supabase.from("diary_entries").insert({
      user_id: userId,
      mood_labels: moodLabels,
      mood_intensity: Number(moodIntensity),
      diary_text: diaryText,
    });

    if (error) {
      setError(error.message);
    } else {
      setMoodLabels([]);
      setMoodIntensity("5");
      setDiaryText("");
      setMessage("Diary entry saved.");
      router.refresh();
    }

    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-md border p-5">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">New diary entry</h2>
        <p className="text-sm text-muted-foreground">
          Save a private check-in for today. AI analysis will be handled later
          and should depend on your consent settings.
        </p>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-1">
          <Label>Mood labels</Label>
          <p className="text-sm text-muted-foreground">
            Choose up to 3 feelings.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {moodOptions.map((mood) => (
            <Button
              key={mood.value}
              type="button"
              variant={moodLabels.includes(mood.value) ? "default" : "outline"}
              onClick={() => toggleMood(mood.value)}
              disabled={
                moodLabels.length >= 3 && !moodLabels.includes(mood.value)
              }
              className="justify-start"
            >
              <span aria-hidden="true">{mood.emoji}</span>
              {mood.value}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="mood_intensity">Mood intensity, 1 to 10</Label>
        <input
          id="mood_intensity"
          type="range"
          min="1"
          max="10"
          step="1"
          required
          value={moodIntensity}
          onChange={(event) => setMoodIntensity(event.target.value)}
          className="w-full accent-primary"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Gentle</span>
          <span className="font-medium text-foreground">{moodIntensity}/10</span>
          <span>Strong</span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="diary_text">Diary entry</Label>
        <textarea
          id="diary_text"
          required
          value={diaryText}
          onChange={(event) => setDiaryText(event.target.value)}
          placeholder="Write what you would like to reflect on today."
          className="min-h-36 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        />
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-fit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save diary entry"}
      </Button>
    </form>
  );
}
