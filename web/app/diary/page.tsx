import { AppShell } from "@/components/app-shell";

export default function DiaryPage() {
  return (
    <AppShell>
      <div className="grid gap-3">
        <h1 className="text-3xl font-bold">Emotion diary</h1>
        <p className="max-w-2xl text-muted-foreground">
          This space will hold daily check-ins and private diary entries. We
          will connect it to Supabase after consent settings are in place.
        </p>
      </div>
    </AppShell>
  );
}
