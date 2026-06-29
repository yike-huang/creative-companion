"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const maxFileSize = 5 * 1024 * 1024;
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

export function ArtworkUploadForm({ userId }: { userId: string }) {
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
      setError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (selectedFile.size > maxFileSize) {
      setError("Please choose an image smaller than 5 MB.");
      return;
    }

    setFile(selectedFile);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Please choose an artwork image.");
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
    setMessage("Artwork saved.");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-md border p-5">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">Upload physical artwork</h2>
        <p className="text-sm text-muted-foreground">
          Here you can add a photo of artwork you made offline, with an optional
          private note or reflection.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="artwork_image">Artwork image</Label>
        <Input
          id="artwork_image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground">
          JPG, PNG, or WEBP. Maximum 5 MB.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="artwork_title">Title</Label>
        <Input
          id="artwork_title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Optional title"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="artwork_reflection">Reflection</Label>
        <textarea
          id="artwork_reflection"
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="What would you like to remember about this artwork?"
          className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        />
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-fit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save artwork"}
      </Button>
    </form>
  );
}
