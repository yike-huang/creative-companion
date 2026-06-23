"use client";

import {
  BatteryLow,
  BatteryMedium,
  Blend,
  Laptop,
  Pencil,
  Shuffle,
  Sparkles,
} from "lucide-react";
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

type EnergyPreference = "surprise_me" | "low" | "medium";
type MediumPreference = "surprise_me" | "digital" | "paper";
type DirectionPreference =
  | "surprise_me"
  | "gently_engage"
  | "take_a_pause";

type PreferenceOption<T extends string> = {
  value: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const energyOptions: PreferenceOption<EnergyPreference>[] = [
  { value: "surprise_me", label: "No preference", icon: Shuffle },
  { value: "low", label: "Low energy", icon: BatteryLow },
  { value: "medium", label: "Some energy", icon: BatteryMedium },
];

const mediumOptions: PreferenceOption<MediumPreference>[] = [
  { value: "surprise_me", label: "Either", icon: Shuffle },
  { value: "digital", label: "Digital", icon: Laptop },
  { value: "paper", label: "Paper", icon: Pencil },
];

const directionOptions: PreferenceOption<DirectionPreference>[] = [
  { value: "surprise_me", label: "No preference", icon: Shuffle },
  {
    value: "gently_engage",
    label: "Express what I’m feeling",
    icon: Blend,
  },
  {
    value: "take_a_pause",
    label: "Focus on something else",
    icon: Sparkles,
  },
];

function PreferenceControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: PreferenceOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const Icon = option.icon;

          return (
            <Button
              key={option.value}
              type="button"
              variant={value === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(option.value)}
              aria-pressed={value === option.value}
            >
              <Icon className="size-4" />
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function RecommendationWorkspace({ userId }: { userId: string }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<Recommendation | null>(null);
  const [expandedRecommendationId, setExpandedRecommendationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [energyPreference, setEnergyPreference] =
    useState<EnergyPreference>("surprise_me");
  const [mediumPreference, setMediumPreference] =
    useState<MediumPreference>("surprise_me");
  const [directionPreference, setDirectionPreference] =
    useState<DirectionPreference>("surprise_me");

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    let response: Response;

    try {
      response = await fetch("/api/recommend-activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: {
            energy: energyPreference,
            medium: mediumPreference,
            direction: directionPreference,
          },
        }),
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
              <p className="text-xs text-muted-foreground">
                This is one creative option, not a prescribed match for a
                feeling. Change it, pause, or choose something else at any
                point.
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
          <p className="text-sm text-muted-foreground">
            Feelings do not map to one “right” art exercise. These suggestions
            combine your reflection with curated research and support resources
            to offer different possibilities. You can choose, change, or skip
            either one.
          </p>
        </div>
        <div className="grid gap-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Optional for this moment only. These choices are not a wellbeing
            assessment and are not saved to your profile.
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            <PreferenceControl
              label="How much energy feels available?"
              value={energyPreference}
              options={energyOptions}
              onChange={setEnergyPreference}
            />
            <PreferenceControl
              label="What would you like to use?"
              value={mediumPreference}
              options={mediumOptions}
              onChange={setMediumPreference}
            />
            <PreferenceControl
              label="What would feel most helpful right now?"
              value={directionPreference}
              options={directionOptions}
              onChange={setDirectionPreference}
            />
          </div>
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
                    <p className="text-muted-foreground">
                      This explanation is a tentative connection, not proof that
                      this activity will have a particular effect for you.
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
