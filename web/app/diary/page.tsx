import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { DiaryEntryForm } from "@/components/diary-entry-form";
import { DiaryEntryList } from "@/components/diary-entry-list";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

async function DiaryDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

  const { data: consent } = await supabase
    .from("consents")
    .select("allow_diary_storage")
    .eq("user_id", data.user.id)
    .single();

  if (!consent?.allow_diary_storage) {
    return (
      <div className="grid gap-4 rounded-md border p-5">
        <h2 className="text-xl font-semibold">Diary storage is off</h2>
        <p className="text-sm text-muted-foreground">
          Please enable diary storage in consent settings before saving diary
          entries.
        </p>
        <Button asChild className="w-fit" variant="outline">
          <Link href="/consent">Open consent settings</Link>
        </Button>
      </div>
    );
  }

  const { data: entries } = await supabase
    .from("diary_entries")
    .select("id, mood_labels, mood_intensity, diary_text, created_at")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-8">
      <DiaryEntryForm userId={data.user.id} />
      <DiaryEntryList entries={entries ?? []} />
    </div>
  );
}

export default function DiaryPage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold">Emotion diary</h1>
          <p className="max-w-2xl text-muted-foreground">
            Create private daily check-ins and reflections. This first version
            stores entries only when diary storage consent is enabled.
          </p>
        </div>

        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <DiaryDetails />
        </Suspense>
      </div>
    </AppShell>
  );
}
