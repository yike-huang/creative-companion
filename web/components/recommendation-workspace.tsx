"use client";

import { useState } from "react";

import { ArtworkDrawingCanvas } from "@/components/artwork-drawing-canvas";
import { Button } from "@/components/ui/button";

const starterRecommendations = [
  {
    id: "color-weather",
    title: "Color weather map",
    reason:
      "Use color and simple shapes to notice how your emotions feel today without needing to explain everything in words.",
    steps: [
      "Choose up to three colors that match how you feel right now.",
      "Draw a simple weather map using lines, clouds, sun, rain, or abstract shapes.",
      "Add one small mark that represents what you need next.",
      "Write a short reflection about what changed while drawing.",
    ],
    safetyNote:
      "If the activity feels overwhelming, pause, breathe, and choose a smaller mark or a calmer color.",
  },
  {
    id: "comfort-shape",
    title: "Comfort shape study",
    reason:
      "A repeated shape can create a gentle structure when emotions feel scattered or hard to name.",
    steps: [
      "Pick one shape that feels steady today.",
      "Repeat it across the page with different sizes or colors.",
      "Let one shape be different from the rest.",
      "Write what the repeated shape and the different shape might represent.",
    ],
    safetyNote:
      "This is a reflective creative exercise, not a clinical intervention.",
  },
];

type Recommendation = (typeof starterRecommendations)[number];

export function RecommendationWorkspace({ userId }: { userId: string }) {
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<Recommendation | null>(null);

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
          </aside>

          <ArtworkDrawingCanvas userId={userId} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {starterRecommendations.map((recommendation) => (
        <article key={recommendation.id} className="grid gap-4 rounded-md border p-5">
          <div className="grid gap-2">
            <h2 className="text-xl font-semibold">{recommendation.title}</h2>
            <p className="text-sm text-muted-foreground">
              {recommendation.reason}
            </p>
          </div>
          <ol className="grid list-decimal gap-2 pl-5 text-sm">
            {recommendation.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Button
            type="button"
            className="w-fit"
            onClick={() => setSelectedRecommendation(recommendation)}
          >
            I want to create with this recommendation
          </Button>
        </article>
      ))}
    </div>
  );
}
