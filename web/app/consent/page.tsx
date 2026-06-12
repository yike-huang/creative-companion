import { AppShell } from "@/components/app-shell";

export default function ConsentPage() {
  return (
    <AppShell>
      <div className="grid gap-3">
        <h1 className="text-3xl font-bold">Consent settings</h1>
        <p className="max-w-2xl text-muted-foreground">
          This page will let users control AI analysis, data storage, artwork
          storage, emotion summary storage, and optional safety preferences.
        </p>
      </div>
    </AppShell>
  );
}
