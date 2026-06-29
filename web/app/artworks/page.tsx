import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { ArtworkDrawingCanvas } from "@/components/artwork-drawing-canvas";
import { ArtworkGallery } from "@/components/artwork-gallery";
import { ArtworkUploadForm } from "@/components/artwork-upload-form";
import { Button } from "@/components/ui/button";
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
    return (
      <div className="grid gap-4 rounded-md border p-5">
        <h2 className="text-xl font-semibold">Artwork storage is off</h2>
        <p className="text-sm text-muted-foreground">
          Please enable artwork storage in consent settings before saving
          artwork photos.
        </p>
        <Button asChild className="w-fit" variant="outline">
          <Link href="/consent">Open consent settings</Link>
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

  return (
    <div className="grid gap-8">
      <ArtworkDrawingCanvas userId={data.user.id} />
      <ArtworkUploadForm userId={data.user.id} />
      <ArtworkGallery artworks={artworksWithUrls} />
    </div>
  );
}

export default function ArtworksPage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold">Independent artwork space</h1>
          <p className="max-w-2xl text-muted-foreground">
            Here you can make artwork on your own, separate from a specific
            recommendation. You can draw online, upload a photo of offline
            artwork, and keep private reflections about your creative process.
          </p>
        </div>

        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
        >
          <ArtworkDetails />
        </Suspense>
      </div>
    </AppShell>
  );
}
