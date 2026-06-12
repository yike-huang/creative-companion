"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getMoodDisplays, moodOptions } from "@/components/mood-options";
import { createClient } from "@/lib/supabase/client";

type DiaryEntry = {
  id: string;
  mood_labels: string[];
  mood_intensity: number | null;
  diary_text: string;
  created_at: string;
};

export function DiaryEntryList({ entries }: { entries: DiaryEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-md border p-5">
        <h2 className="text-xl font-semibold">Past entries</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No diary entries yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Past entries</h2>
      {entries.map((entry) => (
        <DiaryEntryItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function DiaryEntryItem({ entry }: { entry: DiaryEntry }) {
  const [isEditing, setIsEditing] = useState(false);
  const [moodLabels, setMoodLabels] = useState<string[]>(entry.mood_labels);
  const [moodIntensity, setMoodIntensity] = useState(
    String(entry.mood_intensity ?? 5),
  );
  const [diaryText, setDiaryText] = useState(entry.diary_text);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = createClient();
    setIsSaving(true);
    setError(null);

    const { error } = await supabase
      .from("diary_entries")
      .update({
        mood_labels: moodLabels,
        mood_intensity: Number(moodIntensity),
        diary_text: diaryText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entry.id);

    if (error) {
      setError(error.message);
    } else {
      setIsEditing(false);
      router.refresh();
    }

    setIsSaving(false);
  }

  async function handleDelete() {
    const shouldDelete = window.confirm("Delete this diary entry?");

    if (!shouldDelete) {
      return;
    }

    const supabase = createClient();
    setIsDeleting(true);
    setError(null);

    const { error } = await supabase
      .from("diary_entries")
      .delete()
      .eq("id", entry.id);

    if (error) {
      setError(error.message);
      setIsDeleting(false);
      return;
    }

    router.refresh();
  }

  if (isEditing) {
    return (
      <form onSubmit={handleUpdate} className="grid gap-4 rounded-md border p-5">
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
                variant={
                  moodLabels.includes(mood.value) ? "default" : "outline"
                }
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
          <Label htmlFor={`mood_intensity_${entry.id}`}>
            Mood intensity, 1 to 10
          </Label>
          <input
            id={`mood_intensity_${entry.id}`}
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
            <span className="font-medium text-foreground">
              {moodIntensity}/10
            </span>
            <span>Strong</span>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`diary_text_${entry.id}`}>Diary entry</Label>
          <textarea
            id={`diary_text_${entry.id}`}
            required
            value={diaryText}
            onChange={(event) => setDiaryText(event.target.value)}
            className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSaving || isDeleting}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(false)}
            disabled={isSaving || isDeleting}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <article className="grid gap-4 rounded-md border p-5">
      <div className="grid gap-1">
        <p className="text-sm text-muted-foreground">
          {new Date(entry.created_at).toLocaleString()}
        </p>
        <h3 className="font-semibold">
          {getMoodDisplays(entry.mood_labels).join(" · ")}
          {entry.mood_intensity ? ` · ${entry.mood_intensity}/10` : ""}
        </h3>
      </div>
      <p className="whitespace-pre-wrap text-sm">{entry.diary_text}</p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </article>
  );
}
