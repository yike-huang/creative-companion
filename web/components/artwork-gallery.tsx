"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { dictionary } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type Artwork = {
  id: string;
  title: string;
  reflection: string | null;
  image_path: string;
  image_url: string;
  creation_method: string;
  created_at: string;
};
type ArtworkCopy = Record<keyof (typeof dictionary)["en"]["artworks"], string>;

export function ArtworkGallery({
  artworks,
  copy,
}: {
  artworks: Artwork[];
  copy: ArtworkCopy;
}) {
  if (artworks.length === 0) {
    return (
      <div className="rounded-md border p-5">
        <h2 className="text-xl font-semibold">{copy.pastArtworks}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy.noArtworks}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">{copy.pastArtworks}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {artworks.map((artwork) => (
          <ArtworkCard key={artwork.id} artwork={artwork} copy={copy} />
        ))}
      </div>
    </div>
  );
}

function ArtworkCard({
  artwork,
  copy,
}: {
  artwork: Artwork;
  copy: ArtworkCopy;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    const shouldDelete = window.confirm(copy.deleteArtworkConfirm);

    if (!shouldDelete) {
      return;
    }

    const supabase = createClient();
    setIsDeleting(true);
    setError(null);

    const { error: fileError } = await supabase.storage
      .from("artworks")
      .remove([artwork.image_path]);

    if (fileError) {
      setError(fileError.message);
      setIsDeleting(false);
      return;
    }

    const { error: rowError } = await supabase
      .from("artworks")
      .delete()
      .eq("id", artwork.id);

    if (rowError) {
      setError(rowError.message);
      setIsDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <article className="grid gap-4 rounded-md border p-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md border bg-muted">
        <Image
          src={artwork.image_url}
          alt={artwork.title || copy.uploadedArtworkAlt}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 50vw, 100vw"
          unoptimized
        />
      </div>
      <div className="grid gap-2">
        <div>
          <h3 className="font-semibold">
            {artwork.title || copy.untitledArtwork}
          </h3>
          <p className="text-sm text-muted-foreground">
            {artwork.creation_method === "digital"
              ? copy.digitalDrawing
              : copy.physicalArtworkUpload}{" "}
            · {new Date(artwork.created_at).toLocaleString()}
          </p>
        </div>
        {artwork.reflection && (
          <p className="whitespace-pre-wrap text-sm">{artwork.reflection}</p>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button
        type="button"
        variant="destructive"
        className="w-fit"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? copy.deleting : copy.delete}
      </Button>
    </article>
  );
}
