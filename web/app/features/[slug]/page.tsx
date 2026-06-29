import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";

const featurePages = {
  "daily-emotional-reflection": {
    copyKey: "daily",
    appHref: "/diary",
  },
  "emotion-analysis": {
    copyKey: "analysis",
    appHref: "/diary",
  },
  "art-inspired-coping-activities": {
    copyKey: "activities",
    appHref: "/recommendations",
  },
  "personal-art-gallery": {
    copyKey: "gallery",
    appHref: "/artworks",
  },
  "consent-centered-ai-support": {
    copyKey: "consent",
    appHref: "/consent",
  },
} as const;

type FeatureSlug = keyof typeof featurePages;

export function generateStaticParams() {
  return Object.keys(featurePages).map((slug) => ({ slug }));
}

async function FeatureContent({
  slug,
}: {
  slug: FeatureSlug;
}) {
  const feature = featurePages[slug];
  const cookieStore = await cookies();
  const t = getDictionary(
    normalizeLanguage(cookieStore.get("creative_companion_language")?.value),
  );
  const copy = t.publicPages;
  const featureCopy = copy.features[feature.copyKey];

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-4xl flex-1 p-5">
        <nav className="flex flex-col gap-4 py-4 text-sm md:flex-row md:items-center md:justify-between">
          <Link href="/" className="font-semibold">
            {copy.brand}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/crisis"
              className="text-muted-foreground hover:text-foreground"
            >
              {copy.crisisResources}
            </Link>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <section className="grid gap-8 py-12">
          <div className="grid gap-4">
            <p className="text-sm font-medium text-muted-foreground">
              {copy.featureOverview}
            </p>
            <h1 className="text-4xl font-bold">{featureCopy.title}</h1>
            <p className="text-lg text-muted-foreground">
              {featureCopy.description}
            </p>
          </div>

          <div className="grid gap-3">
            {featureCopy.details.map((detail) => (
              <div key={detail} className="rounded-md border p-4 text-sm">
                {detail}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/auth/sign-up">{featureCopy.cta}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/login">{copy.signInToTry}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">{copy.backHome}</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = featurePages[slug as FeatureSlug];

  if (!feature) {
    notFound();
  }

  return (
    <Suspense>
      <FeatureContent slug={slug as FeatureSlug} />
    </Suspense>
  );
}
