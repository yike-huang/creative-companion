import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { ArtworkDrawingCanvas } from "@/components/artwork-drawing-canvas";
import { ArtworkGallery } from "@/components/artwork-gallery";
import { ArtworkUploadForm } from "@/components/artwork-upload-form";
import { Button } from "@/components/ui/button";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

async function ArtworkDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

  const { data: consent } = await supabase
    .from("consents")
    .select("allow_artwork_storage")
    .eq("user_id", data.user.id)
    .single();

  if (!consent?.allow_artwork_storage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", data.user.id)
      .single();
    const t = getDictionary(normalizeLanguage(profile?.preferred_language));

    return (
      <div className="grid gap-4 rounded-md border p-5">
        <h2 className="text-xl font-semibold">{t.artworks.storageOffTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {t.artworks.storageOffDescription}
        </p>
        <Button asChild className="w-fit" variant="outline">
          <Link href="/consent">{t.artworks.openConsent}</Link>
        </Button>
      </div>
    );
  }

  const { data: artworks } = await supabase
    .from("artworks")
    .select("id, title, reflection, image_path, creation_method, created_at")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false });

  const artworksWithUrls = await Promise.all(
    (artworks ?? []).map(async (artwork) => {
      const { data: signedUrl } = await supabase.storage
        .from("artworks")
        .createSignedUrl(artwork.image_path, 60 * 10);

      return {
        ...artwork,
        image_url: signedUrl?.signedUrl ?? "",
      };
    }),
  );
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", data.user.id)
    .single();
  const t = getDictionary(normalizeLanguage(profile?.preferred_language));

  return (
    <div className="grid gap-8">
      <ArtworkDrawingCanvas userId={data.user.id} copy={t.artworks} />
      <ArtworkUploadForm userId={data.user.id} copy={t.artworks} />
      <ArtworkGallery artworks={artworksWithUrls} copy={t.artworks} />
    </div>
  );
}

async function ArtworksHeader() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const { data: profile } = authData.user
    ? await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", authData.user.id)
        .single()
    : { data: null };
  const t = getDictionary(normalizeLanguage(profile?.preferred_language));

  return (
    <div className="grid gap-2">
      <h1 className="text-3xl font-bold">{t.artworks.pageTitle}</h1>
      <p className="max-w-2xl text-muted-foreground">
        {t.artworks.pageIntro}
      </p>
    </div>
  );
}

export default function ArtworksPage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <ArtworksHeader />
        </Suspense>

        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <ArtworkDetails />
        </Suspense>
      </div>
    </AppShell>
  );
}
