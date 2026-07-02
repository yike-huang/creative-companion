"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { dictionary } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

const maxFileSize = 5 * 1024 * 1024;
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
type ArtworkCopy = Record<keyof (typeof dictionary)["en"]["artworks"], string>;

export function ArtworkUploadForm({
  userId,
  copy,
}: {
  userId: string;
  copy: ArtworkCopy;
}) {
  const [title, setTitle] = useState("");
  const [reflection, setReflection] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setError(null);
    setFile(null);

    if (!selectedFile) {
      return;
    }

    if (!allowedMimeTypes.includes(selectedFile.type)) {
      setError(copy.invalidFileType);
      return;
    }

    if (selectedFile.size > maxFileSize) {
      setError(copy.fileTooLarge);
      return;
    }

    setFile(selectedFile);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError(copy.missingArtworkImage);
      return;
    }

    const supabase = createClient();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const extension = file.name.split(".").pop() ?? "png";
    const imagePath = `${userId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("artworks")
      .upload(imagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setError(uploadError.message);
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("artworks").insert({
      user_id: userId,
      title,
      reflection: reflection || null,
      image_path: imagePath,
      creation_method: "physical_upload",
    });

    if (insertError) {
      await supabase.storage.from("artworks").remove([imagePath]);
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    setTitle("");
    setReflection("");
    setFile(null);
    setMessage(copy.artworkSaved);
    setIsSaving(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-3xl border border-border/70 bg-background/75 p-5"
    >
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">{copy.uploadTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {copy.uploadDescription}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="artwork_image">{copy.artworkImage}</Label>
        <Input
          id="artwork_image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground">
          {copy.fileHint}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="artwork_title">{copy.title}</Label>
        <Input
          id="artwork_title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={copy.optionalTitle}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="artwork_reflection">{copy.reflection}</Label>
        <textarea
          id="artwork_reflection"
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder={copy.uploadReflectionPlaceholder}
          className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        />
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-fit" disabled={isSaving}>
        {isSaving ? copy.saving : copy.saveArtwork}
      </Button>
    </form>
  );
}
