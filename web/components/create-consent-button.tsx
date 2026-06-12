"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function CreateConsentButton({ userId }: { userId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    const supabase = createClient();
    setIsCreating(true);
    setError(null);

    const { error } = await supabase.from("consents").insert({
      user_id: userId,
    });

    if (error) {
      setError(error.message);
      setIsCreating(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <Button type="button" className="w-fit" onClick={handleCreate} disabled={isCreating}>
        {isCreating ? "Creating..." : "Create consent settings"}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
