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
import { ArtworkUploadForm } from "@/components/artwork-upload-form";
import { Button } from "@/components/ui/button";
import type { dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type RecommendationCopyKey = keyof (typeof dictionary)["en"]["recommendations"];
type RecommendationCopy = Record<RecommendationCopyKey, string>;
type ArtworkCopyKey = keyof (typeof dictionary)["en"]["artworks"];
type ArtworkCopy = Record<ArtworkCopyKey, string>;

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
    sourceType?: string | null;
  }[];
  researchSources: {
    title: string;
    sourceName: string;
    url: string | null;
    sourceType?: string | null;
  }[];
};

function getResearchSources(recommendation: Recommendation) {
  return recommendation.researchSources ?? [];
}

function isConnectionResource(source: {
  sourceType?: string | null;
  sourceName: string;
}) {
  const sourceType = source.sourceType?.toLowerCase() ?? "";
  const sourceName = source.sourceName.toLowerCase();

  return (
    sourceType.includes("support_resource") ||
    sourceType.includes("support") ||
    sourceName.includes("imerman angels") ||
    sourceName.includes("cancer support community")
  );
}

function getReadingSources(recommendation: Recommendation) {
  return recommendation.sources.filter((source) => !isConnectionResource(source));
}

function getConnectionSources(recommendation: Recommendation) {
  return recommendation.sources.filter(isConnectionResource);
}

function SourceLink({
  source,
}: {
  source: { title: string; sourceName: string; url: string | null };
}) {
  return (
    <>
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
    </>
  );
}

type RecommendationResponse = {
  recommendations?: Recommendation[];
  error?: string;
  requiresCrisisAcknowledgement?: boolean;
};

type EnergyPreference = "surprise_me" | "low" | "medium";
type MediumPreference = "surprise_me" | "digital" | "paper";
type DirectionPreference =
  | "surprise_me"
  | "gently_engage"
  | "take_a_pause";
type CreationMode = "digital" | "paper";

type PreferenceOption<T extends string> = {
  value: T;
  labelKey: RecommendationCopyKey;
  icon: React.ComponentType<{ className?: string }>;
};

const energyOptions: PreferenceOption<EnergyPreference>[] = [
  { value: "surprise_me", labelKey: "openToAnything", icon: Shuffle },
  { value: "low", labelKey: "lowEnergy", icon: BatteryLow },
  { value: "medium", labelKey: "someEnergy", icon: BatteryMedium },
];

const mediumOptions: PreferenceOption<MediumPreference>[] = [
  { value: "surprise_me", labelKey: "either", icon: Shuffle },
  { value: "digital", labelKey: "digital", icon: Laptop },
  { value: "paper", labelKey: "paper", icon: Pencil },
];

const directionOptions: PreferenceOption<DirectionPreference>[] = [
  { value: "surprise_me", labelKey: "openToAnything", icon: Shuffle },
  {
    value: "gently_engage",
    labelKey: "expressFeeling",
    icon: Blend,
  },
  {
    value: "take_a_pause",
    labelKey: "focusElsewhere",
    icon: Sparkles,
  },
];

function PreferenceControl<T extends string>({
  label,
  value,
  options,
  copy,
  onChange,
}: {
  label: string;
  value: T;
  options: PreferenceOption<T>[];
  copy: RecommendationCopy;
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
              className={cn(
                "h-auto min-h-9 rounded-lg px-3 py-2",
                value !== option.value && "bg-background/70",
              )}
              onClick={() => onChange(option.value)}
              aria-pressed={value === option.value}
            >
              <Icon className="size-4" />
              {copy[option.labelKey]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function RecommendationWorkspace({
  userId,
  copy,
  artworkCopy,
  canStoreArtwork,
}: {
  userId: string;
  copy: RecommendationCopy;
  artworkCopy: ArtworkCopy;
  canStoreArtwork: boolean;
}) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<Recommendation | null>(null);
  const [creationMode, setCreationMode] = useState<CreationMode | null>(null);
  const [expandedRecommendationId, setExpandedRecommendationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [crisisWarning, setCrisisWarning] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [energyPreference, setEnergyPreference] =
    useState<EnergyPreference>("surprise_me");
  const [mediumPreference, setMediumPreference] =
    useState<MediumPreference>("surprise_me");
  const [directionPreference, setDirectionPreference] =
    useState<DirectionPreference>("surprise_me");

  function skipPreferences() {
    setEnergyPreference("surprise_me");
    setMediumPreference("surprise_me");
    setDirectionPreference("surprise_me");
  }

  async function handleGenerate(crisisAcknowledged = false) {
    setIsGenerating(true);
    setError(null);
    if (!crisisAcknowledged) {
      setCrisisWarning(null);
    }

    let response: Response;

    try {
      response = await fetch("/api/recommend-activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          crisisAcknowledged,
          preferences: {
            energy: energyPreference,
            medium: mediumPreference,
            direction: directionPreference,
          },
        }),
      });
    } catch {
      setError(copy.fetchError);
      setIsGenerating(false);
      return;
    }

    const responseText = await response.text();
    let result: RecommendationResponse = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = {
        error: responseText || copy.unexpectedResponse,
      };
    }

    if (!response.ok) {
      if (result.requiresCrisisAcknowledgement) {
        setCrisisWarning(
          result.error ?? copy.crisisDefaultWarning,
        );
        setError(null);
        setIsGenerating(false);
        return;
      }
      setError(result.error ?? copy.generationFailed);
      setIsGenerating(false);
      return;
    }

    setCrisisWarning(null);
    setRecommendations(result.recommendations ?? []);
    setSelectedRecommendation(null);
    setCreationMode(null);
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
          onClick={() => {
            setSelectedRecommendation(null);
            setCreationMode(null);
          }}
        >
          {copy.backToRecommendations}
        </Button>

        <div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
          <aside className="grid content-start gap-4 rounded-3xl border border-border/70 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted))_100%)] p-5 shadow-sm">
            <div className="grid gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                {copy.selectedActivity}
              </p>
              <h2
                className="line-clamp-2 text-2xl leading-tight"
                title={selectedRecommendation.title}
              >
                {selectedRecommendation.title}
              </h2>
              <p className="line-clamp-3 leading-7 text-muted-foreground">
                {selectedRecommendation.reason}
              </p>
              <p className="text-sm text-muted-foreground">
                {copy.oneCreativeOption}
              </p>
            </div>

            <details className="rounded-2xl border bg-background/75 p-4">
              <summary className="cursor-pointer font-semibold">
                {copy.whyThisMightFit}
              </summary>
              <p className="mt-3 leading-7 text-muted-foreground">
                {selectedRecommendation.whyThisFits}
              </p>
            </details>

            {creationMode !== "paper" && (
              <details className="rounded-2xl border bg-background/75 p-4">
                <summary className="cursor-pointer font-semibold">
                  {copy.steps}
                </summary>
                <ol className="mt-3 grid list-decimal gap-2 pl-5 leading-7">
                  {selectedRecommendation.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </details>
            )}

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100">
              {selectedRecommendation.safetyNote}
            </div>

            {(getReadingSources(selectedRecommendation).length > 0 ||
              getConnectionSources(selectedRecommendation).length > 0) && (
              <div className="grid gap-2 text-sm text-muted-foreground">
                {getReadingSources(selectedRecommendation).length > 0 && (
                  <div className="grid gap-1">
                    <h3 className="font-semibold text-foreground">
                      {copy.gentleBackground}
                    </h3>
                    <ul className="grid list-disc gap-1 pl-5">
                      {getReadingSources(selectedRecommendation).map(
                        (source) => (
                          <li key={`${source.sourceName}-${source.title}`}>
                            <SourceLink source={source} />
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
                {getConnectionSources(selectedRecommendation).length > 0 && (
                  <div className="grid gap-1">
                    <h3 className="font-semibold text-foreground">
                      {copy.connectionResources}
                    </h3>
                    <p>{copy.connectionResourcesDescription}</p>
                    <ul className="grid list-disc gap-1 pl-5">
                      {getConnectionSources(selectedRecommendation).map(
                        (source) => (
                          <li key={`${source.sourceName}-${source.title}`}>
                            <SourceLink source={source} />
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </aside>

          <section className="grid content-start gap-4 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm">
            <div className="grid gap-3">
              <h2 className="text-3xl leading-tight">{copy.chooseHowToCreate}</h2>
              <p className="max-w-3xl leading-7 text-muted-foreground">
                {copy.chooseHowToCreateDescription}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant={creationMode === "digital" ? "default" : "outline"}
                  className="rounded-2xl"
                  onClick={() => setCreationMode("digital")}
                >
                  <Laptop />
                  {copy.drawOnline}
                </Button>
                <Button
                  type="button"
                  variant={creationMode === "paper" ? "default" : "outline"}
                  className="rounded-2xl"
                  onClick={() => setCreationMode("paper")}
                >
                  <Pencil />
                  {copy.usePaper}
                </Button>
              </div>
            </div>

            {creationMode === "digital" && (
              <ArtworkDrawingCanvas userId={userId} copy={artworkCopy} />
            )}

            {creationMode === "paper" && (
              <div className="grid gap-5">
                <div className="grid gap-5 rounded-3xl border border-border/70 bg-background/75 p-5">
                  <div className="grid gap-2">
                    <h3 className="text-2xl leading-tight">
                      {copy.paperModeTitle}
                    </h3>
                    <p className="leading-7 text-muted-foreground">
                      {copy.paperModeDescription}
                    </p>
                  </div>
                  <ol className="grid list-decimal gap-3 pl-5 leading-7">
                    {selectedRecommendation.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit rounded-2xl"
                    onClick={() => setCreationMode("digital")}
                  >
                    {copy.switchToDigital}
                  </Button>
                </div>
                {canStoreArtwork ? (
                  <ArtworkUploadForm userId={userId} copy={artworkCopy} />
                ) : (
                  <div className="grid gap-3 rounded-3xl border border-border/70 bg-background/75 p-5">
                    <h3 className="text-xl leading-tight">
                      {artworkCopy.storageOffTitle}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {artworkCopy.storageOffDescription}
                    </p>
                    <Button asChild className="w-fit rounded-2xl" variant="outline">
                      <Link href="/consent">{artworkCopy.openConsent}</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-5 rounded-lg border border-border/70 bg-card p-5 shadow-sm">
        <div className="grid gap-2 border-b border-border/70 pb-4">
          <h2 className="text-xl font-semibold">{copy.workspaceTitle}</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {copy.workspaceDescription}
          </p>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {copy.workspaceBoundary}
          </p>
        </div>
        <div className="grid gap-4 rounded-lg border border-border/70 bg-muted/35 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {copy.preferencesDescription}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={skipPreferences}
            >
              {copy.skipPreferences}
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <PreferenceControl
              label={copy.energyLabel}
              value={energyPreference}
              options={energyOptions}
              copy={copy}
              onChange={setEnergyPreference}
            />
            <PreferenceControl
              label={copy.mediumLabel}
              value={mediumPreference}
              options={mediumOptions}
              copy={copy}
              onChange={setMediumPreference}
            />
            <PreferenceControl
              label={copy.directionLabel}
              value={directionPreference}
              options={directionOptions}
              copy={copy}
              onChange={setDirectionPreference}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className="w-fit"
            onClick={() => handleGenerate()}
            disabled={isGenerating}
          >
            {isGenerating ? copy.creating : copy.findActivityIdeas}
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/diary">{copy.reviewDiary}</Link>
          </Button>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/crisis">{copy.crisisResources}</Link>
          </Button>
          {recommendations.length > 0 && (
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => handleGenerate()}
              disabled={isGenerating}
            >
              {isGenerating ? copy.creating : copy.findDifferentIdeas}
            </Button>
          )}
        </div>
        {crisisWarning && (
          <div className="grid gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <div className="grid gap-1">
              <p className="font-medium">{copy.supportNoteCameUp}</p>
              <p>{crisisWarning}</p>
              <p>{copy.urgentSupportPrompt}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="w-fit">
                <Link href="/crisis">{copy.reviewCrisisResources}</Link>
              </Button>
              <Button
                type="button"
                className="w-fit"
                onClick={() => handleGenerate(true)}
                disabled={isGenerating}
              >
                {isGenerating ? copy.creating : copy.feelSafeContinue}
              </Button>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </section>

      {recommendations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.map((recommendation, index) => (
            <article
              key={recommendation.id}
              className={cn(
                "grid gap-4 rounded-lg border border-border/70 bg-card p-5 shadow-sm",
                index === 0
                  ? "border-l-4 border-l-rose-200 dark:border-l-rose-900/70"
                  : "border-l-4 border-l-emerald-200 dark:border-l-emerald-900/70",
              )}
            >
              <div className="grid gap-2">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-1 size-3 shrink-0 rounded-full",
                      index === 0
                        ? "bg-rose-300 dark:bg-rose-700"
                        : "bg-emerald-300 dark:bg-emerald-700",
                    )}
                    aria-hidden="true"
                  />
                  <h2 className="text-xl font-semibold leading-tight">
                    {recommendation.title}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {recommendation.reason}
                </p>
              </div>
              <ol className="grid list-decimal gap-2 rounded-lg bg-muted/35 p-4 pl-8 text-sm">
                {recommendation.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100">
                {recommendation.safetyNote}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  className="w-fit"
                  onClick={() => {
                    setSelectedRecommendation(recommendation);
                    setCreationMode(null);
                  }}
                >
                  {copy.createWithThisIdea}
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
                    ? copy.hideDetails
                    : copy.learnMore}
                </Button>
              </div>
              {expandedRecommendationId === recommendation.id && (
                <div className="grid gap-3 rounded-lg border bg-muted/25 p-3 text-sm">
                  <div className="grid gap-1">
                    <p className="font-medium">{copy.whyThisMightFit}</p>
                    <p className="text-muted-foreground">
                      {recommendation.whyThisFits}
                    </p>
                    <p className="text-muted-foreground">
                      {copy.possibleFitNote}
                    </p>
                  </div>
                  {(getReadingSources(recommendation).length > 0 ||
                    getConnectionSources(recommendation).length > 0) && (
                    <div className="grid gap-1 text-muted-foreground">
                      {getReadingSources(recommendation).length > 0 && (
                        <div className="grid gap-1">
                          <p className="font-medium text-foreground">
                            {copy.gentleBackground}
                          </p>
                          <p>{copy.optionalBackgroundIntro}</p>
                          <ul className="grid list-disc gap-1 pl-5">
                            {getReadingSources(recommendation).map((source) => (
                              <li key={`${source.sourceName}-${source.title}`}>
                                <SourceLink source={source} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {getConnectionSources(recommendation).length > 0 && (
                        <div className="grid gap-1">
                          <p className="font-medium text-foreground">
                            {copy.connectionResources}
                          </p>
                          <p>{copy.connectionResourcesIntro}</p>
                          <ul className="grid list-disc gap-1 pl-5">
                            {getConnectionSources(recommendation).map(
                              (source) => (
                                <li
                                  key={`${source.sourceName}-${source.title}`}
                                >
                                  <SourceLink source={source} />
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  <details className="rounded-lg border bg-background/70 p-3 text-muted-foreground">
                    <summary className="cursor-pointer font-medium text-foreground">
                      {copy.evidenceNotes}
                    </summary>
                    <div className="mt-2 grid gap-2">
                      <p>{copy.evidenceNotesDescription}</p>
                      {getResearchSources(recommendation).length > 0 && (
                        <div className="grid gap-1">
                          <p className="font-medium text-foreground">
                            {copy.optionalResearchLinks}
                          </p>
                          <p>{copy.researchLinksDescription}</p>
                          <ul className="grid list-disc gap-1 pl-5">
                            {getResearchSources(recommendation).map((source) => (
                              <li key={`${source.sourceName}-${source.title}`}>
                                <SourceLink source={source} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p>{copy.researchLinksNote}</p>
                      <p>{copy.sourceLimitNote}</p>
                    </div>
                  </details>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
