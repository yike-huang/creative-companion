"use client";

import Link from "next/link";
import { useState } from "react";

import { ArtworkDrawingCanvas } from "@/components/artwork-drawing-canvas";
import { Button } from "@/components/ui/button";

type Recommendation = {
  id: string;
  title: string;
  reason: string;
  whyThisFits: string;
  steps: string[];
  safetyNote: string;
  sources: {
    title: string;
    sourceName: string;
    url: string | null;
  }[];
};

type RecommendationResponse = {
  recommendations?: Recommendation[];
  error?: string;
};

export function RecommendationWorkspace({ userId }: { userId: string }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<Recommendation | null>(null);
  const [expandedRecommendationId, setExpandedRecommendationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    let response: Response;

    try {
      response = await fetch("/api/recommend-activities", {
        method: "POST",
      });
    } catch {
      setError("Unable to reach the recommendation service.");
      setIsGenerating(false);
      return;
    }

    const responseText = await response.text();
    let result: RecommendationResponse = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = {
        error:
          responseText ||
          "The recommendation service returned an unexpected response.",
      };
    }

    if (!response.ok) {
      setError(result.error ?? "Unable to generate recommendations.");
      setIsGenerating(false);
      return;
    }

    setRecommendations(result.recommendations ?? []);
    setSelectedRecommendation(null);
    setExpandedRecommendationId(null);
    setIsGenerating(false);
  }

  if (selectedRecommendation) {
    return (
      <div className="grid gap-5">
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={() => setSelectedRecommendation(null)}
        >
          Back to recommendations
        </Button>

        <div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
          <aside className="grid content-start gap-4 rounded-md border p-5">
            <div className="grid gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Selected activity
              </p>
              <h2 className="text-2xl font-semibold">
                {selectedRecommendation.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedRecommendation.reason}
              </p>
            </div>

            <div className="rounded-md border p-3 text-sm">
              <h3 className="font-semibold">Why this might fit</h3>
              <p className="mt-2 text-muted-foreground">
                {selectedRecommendation.whyThisFits}
              </p>
            </div>

            <div className="grid gap-3">
              <h3 className="font-semibold">Steps</h3>
              <ol className="grid list-decimal gap-2 pl-5 text-sm">
                {selectedRecommendation.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              {selectedRecommendation.safetyNote}
            </div>

            {selectedRecommendation.sources.length > 0 && (
              <div className="grid gap-2 text-sm text-muted-foreground">
                <h3 className="font-semibold text-foreground">
                  Gentle background
                </h3>
                <ul className="grid list-disc gap-1 pl-5">
                  {selectedRecommendation.sources.map((source) => (
                    <li key={`${source.sourceName}-${source.title}`}>
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-4"
                        >
                          {source.title}
                        </a>
                      ) : (
                        source.title
                      )}{" "}
                      <span>({source.sourceName})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <ArtworkDrawingCanvas userId={userId} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-md border p-5">
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold">
            A few creative ideas for right now
          </h2>
          <p className="text-sm text-muted-foreground">
            Create gentle art-inspired options from your latest reflection.
            These are creative prompts, not art therapy, medical care, or crisis
            support.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className="w-fit"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "Creating..." : "Create suggestions"}
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/diary">Review diary</Link>
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/crisis">Crisis resources</Link>
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {recommendations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.map((recommendation) => (
            <article
              key={recommendation.id}
              className="grid gap-4 rounded-md border p-5"
            >
              <div className="grid gap-2">
                <h2 className="text-xl font-semibold">
                  {recommendation.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {recommendation.reason}
                </p>
              </div>
              <ol className="grid list-decimal gap-2 pl-5 text-sm">
                {recommendation.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="text-sm text-muted-foreground">
                {recommendation.safetyNote}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  className="w-fit"
                  onClick={() => setSelectedRecommendation(recommendation)}
                >
                  Create with this idea
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  onClick={() =>
                    setExpandedRecommendationId((current) =>
                      current === recommendation.id ? null : recommendation.id,
                    )
                  }
                >
                  {expandedRecommendationId === recommendation.id
                    ? "Hide details"
                    : "Learn more"}
                </Button>
              </div>
              {expandedRecommendationId === recommendation.id && (
                <div className="grid gap-3 rounded-md border p-3 text-sm">
                  <div className="grid gap-1">
                    <p className="font-medium">Why this might fit</p>
                    <p className="text-muted-foreground">
                      {recommendation.whyThisFits}
                    </p>
                  </div>
                  {recommendation.sources.length > 0 && (
                    <div className="grid gap-1 text-muted-foreground">
                      <p className="font-medium text-foreground">
                        Gentle background
                      </p>
                      <p>
                        These links are optional starting points if you want to
                        understand the idea behind the suggestion.
                      </p>
                      <ul className="grid list-disc gap-1 pl-5">
                        {recommendation.sources.map((source) => (
                          <li key={`${source.sourceName}-${source.title}`}>
                            {source.url ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4"
                              >
                                {source.title}
                              </a>
                            ) : (
                              source.title
                            )}{" "}
                            <span>({source.sourceName})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
