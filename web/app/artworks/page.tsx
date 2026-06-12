import { AppShell } from "@/components/app-shell";

export default function ArtworksPage() {
  return (
    <AppShell>
      <div className="grid gap-3">
        <h1 className="text-3xl font-bold">Artwork space</h1>
        <p className="max-w-2xl text-muted-foreground">
          This private space will let users upload artwork photos and add
          reflections or notes about the creative process.
        </p>
      </div>
    </AppShell>
  );
}
