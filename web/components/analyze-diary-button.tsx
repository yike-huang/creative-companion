"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type AnalyzeDiaryCopy = {
  reflectTitle: string;
  reflectDescription: string;
  reflecting: string;
  reflectAction: string;
  analysisTimeout: string;
  analysisUnavailable: string;
  analysisUnexpected: string;
  analysisFailed: string;
  openConsent: string;
};

export function AnalyzeDiaryButton({ copy }: { copy: AnalyzeDiaryCopy }) {
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
          ? copy.analysisTimeout
          : copy.analysisUnavailable,
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
          copy.analysisUnexpected,
      };
    }

    if (!response.ok) {
      setError(result.error ?? copy.analysisFailed);
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(false);
    router.refresh();
  }

  return (
    <div className="grid gap-3 rounded-md border p-5">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">{copy.reflectTitle}</h2>
        <p className="text-sm text-muted-foreground">{copy.reflectDescription}</p>
      </div>
      <Button
        type="button"
        className="w-fit"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? copy.reflecting : copy.reflectAction}
      </Button>
      {error && (
        <p className="text-sm text-red-500">
          {error}{" "}
          <Link href="/consent" className="underline underline-offset-4">
            {copy.openConsent}
          </Link>
        </p>
      )}
    </div>
  );
}
