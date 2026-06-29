"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AnalyzeDiaryButton() {
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 35_000);

    let response: Response;
    let result: { error?: string } = {};

    try {
      response = await fetch("/api/analyze-diary", {
        method: "POST",
        signal: controller.signal,
      });
    } catch (error) {
      setError(
        error instanceof Error && error.name === "AbortError"
          ? "The analysis request took too long. Please try again."
          : "Unable to reach the analysis service.",
      );
      setIsAnalyzing(false);
      window.clearTimeout(timeoutId);
      return;
    }

    window.clearTimeout(timeoutId);

    const responseText = await response.text();

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = {
        error:
          responseText ||
          "The analysis service returned an unexpected response.",
      };
    }

    if (!response.ok) {
      setError(result.error ?? "Unable to analyze diary entries.");
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(false);
    router.refresh();
  }

  return (
    <div className="grid gap-3 rounded-md border p-5">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">Reflect on recent entries</h2>
        <p className="text-sm text-muted-foreground">
          Here you can use AI to notice gentle, non-clinical emotional patterns
          in your recent diary entries. This is not a diagnosis, and it will not
          create activity suggestions yet.
        </p>
      </div>
      <Button
        type="button"
        className="w-fit"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? "Reflecting..." : "Reflect on recent entries"}
      </Button>
      {error && (
        <p className="text-sm text-red-500">
          {error}{" "}
          <Link href="/consent" className="underline underline-offset-4">
            Open consent settings
          </Link>
        </p>
      )}
    </div>
  );
}
