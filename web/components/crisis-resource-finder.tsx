"use client";

import { LocateFixed, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CrisisResourceFinderCopy = {
  findAHelpline: string;
  crisisFindLocalTitle: string;
  crisisFindLocalDescription: string;
  crisisManualLabel: string;
  crisisManualPlaceholder: string;
  crisisManualEmpty: string;
  crisisManualSearchFor: string;
  crisisUseLocationTitle: string;
  crisisUseLocationDescription: string;
  crisisUseLocation: string;
  crisisLocating: string;
  crisisLocationSuggestion: string;
  crisisLocationUSNote: string;
  crisisLocationDirectoryNote: string;
  crisisLocationDenied: string;
  crisisLocationUnavailable: string;
};

type LocationStatus = "idle" | "locating" | "found" | "unavailable" | "denied";

type CountryMatch = {
  name: string;
  isUnitedStates?: boolean;
};

function isBetween(value: number, min: number, max: number) {
  return value >= min && value <= max;
}

function inferCountryFromCoordinates(
  latitude: number,
  longitude: number,
): CountryMatch | null {
  const inContinentalUnitedStates =
    isBetween(latitude, 24, 50) && isBetween(longitude, -125, -66);
  const inAlaska =
    isBetween(latitude, 51, 72) && isBetween(longitude, -170, -129);
  const inHawaii =
    isBetween(latitude, 18, 23) && isBetween(longitude, -161, -154);

  if (inContinentalUnitedStates || inAlaska || inHawaii) {
    return { name: "United States", isUnitedStates: true };
  }

  if (isBetween(latitude, 41, 84) && isBetween(longitude, -141, -52)) {
    return { name: "Canada" };
  }

  if (isBetween(latitude, 49, 61) && isBetween(longitude, -8, 2)) {
    return { name: "United Kingdom" };
  }

  if (isBetween(latitude, 27, 44) && isBetween(longitude, -19, 5)) {
    return { name: "Spain" };
  }

  if (isBetween(latitude, -44, -10) && isBetween(longitude, 112, 154)) {
    return { name: "Australia" };
  }

  if (isBetween(latitude, 14, 33) && isBetween(longitude, -119, -86)) {
    return { name: "Mexico" };
  }

  if (isBetween(latitude, 18, 54) && isBetween(longitude, 73, 135)) {
    return { name: "China" };
  }

  return null;
}

export function CrisisResourceFinder({
  copy,
}: {
  copy: CrisisResourceFinderCopy;
}) {
  const [manualRegion, setManualRegion] = useState("");
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [countryMatch, setCountryMatch] = useState<CountryMatch | null>(null);

  const trimmedRegion = manualRegion.trim();
  const manualSearchDescription = useMemo(() => {
    if (!trimmedRegion) {
      return copy.crisisManualEmpty;
    }

    return copy.crisisManualSearchFor.replace("{region}", trimmedRegion);
  }, [copy, trimmedRegion]);

  function useLocationOnce() {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      setCountryMatch(null);
      return;
    }

    setStatus("locating");
    setCountryMatch(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const match = inferCountryFromCoordinates(
          position.coords.latitude,
          position.coords.longitude,
        );

        setCountryMatch(match);
        setStatus(match ? "found" : "unavailable");
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
        setCountryMatch(null);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 8000,
      },
    );
  }

  return (
    <div className="grid gap-5 rounded-3xl border border-border/70 bg-background/75 p-5 shadow-sm">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold">{copy.crisisFindLocalTitle}</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {copy.crisisFindLocalDescription}
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-muted/20 p-4">
        <label className="grid gap-2 text-sm font-medium">
          {copy.crisisManualLabel}
          <Input
            value={manualRegion}
            onChange={(event) => setManualRegion(event.target.value)}
            placeholder={copy.crisisManualPlaceholder}
          />
        </label>
        <p className="text-sm text-muted-foreground">
          {manualSearchDescription}
        </p>
        <Button asChild className="w-fit rounded-2xl" variant="outline">
          <a
            href="https://findahelpline.com/"
            target="_blank"
            rel="noreferrer"
          >
            <Search className="size-4" />
            {copy.findAHelpline}
          </a>
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-muted/20 p-4">
        <div className="grid gap-1">
          <h3 className="font-semibold">{copy.crisisUseLocationTitle}</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {copy.crisisUseLocationDescription}
          </p>
        </div>
        <Button
          type="button"
          className="w-fit rounded-2xl"
          variant="outline"
          onClick={useLocationOnce}
          disabled={status === "locating"}
        >
          <LocateFixed className="size-4" />
          {status === "locating"
            ? copy.crisisLocating
            : copy.crisisUseLocation}
        </Button>

        {status === "found" && countryMatch && (
          <div className="grid gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-950">
            <p className="font-medium">
              {copy.crisisLocationSuggestion.replace(
                "{country}",
                countryMatch.name,
              )}
            </p>
            {countryMatch.isUnitedStates ? (
              <p>{copy.crisisLocationUSNote}</p>
            ) : (
              <p>{copy.crisisLocationDirectoryNote}</p>
            )}
          </div>
        )}

        {status === "denied" && (
          <p className="text-sm text-muted-foreground">
            {copy.crisisLocationDenied}
          </p>
        )}

        {status === "unavailable" && (
          <p className="text-sm text-muted-foreground">
            {copy.crisisLocationUnavailable}
          </p>
        )}
      </div>
    </div>
  );
}
