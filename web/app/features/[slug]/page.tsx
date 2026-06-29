import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";

const featurePages = {
  "daily-emotional-reflection": {
    title: "Daily emotional reflection",
    description:
      "A private diary space for naming emotions, choosing intensity, and writing what you want to remember about the day.",
    details: [
      "Choose up to three emotion labels to reduce the pressure of finding perfect words.",
      "Use a simple intensity slider to notice how strong the feeling is.",
      "Keep diary entries private and editable inside your account.",
    ],
    appHref: "/diary",
    cta: "Create an account to reflect",
  },
  "emotion-analysis": {
    title: "Emotion analysis",
    description:
      "Optional AI-assisted reflections can help you notice recent emotional patterns across diary entries.",
    details: [
      "This feature is optional and controlled by consent settings.",
      "Reflections are non-clinical and should not be treated as diagnosis or therapy.",
      "You can choose whether AI analysis and summary storage are allowed.",
    ],
    appHref: "/diary",
    cta: "Create an account to try reflection",
  },
  "art-inspired-coping-activities": {
    title: "Personalized art-inspired coping activities",
    description:
      "Creative Companion will suggest gentle, art-inspired activities that can be completed with digital tools or physical materials.",
    details: [
      "Recommendations are intended as non-clinical creative coping support.",
      "The workspace keeps activity steps visible while you create.",
      "Suggestions are grounded in curated resources when a fitting source is available.",
    ],
    appHref: "/recommendations",
    cta: "Create an account to view activities",
  },
  "personal-art-gallery": {
    title: "Personal art gallery",
    description:
      "A private space for saving digital drawings, uploading photos of physical artwork, and adding reflections.",
    details: [
      "Create directly on the digital canvas or upload a photo of paper artwork.",
      "Artwork storage is controlled by consent settings.",
      "Saved works are stored privately in your account.",
    ],
    appHref: "/artworks",
    cta: "Create an account to use the gallery",
  },
  "consent-centered-ai-support": {
    title: "Consent-centered AI support",
    description:
      "Sensitive features should stay under your control before diary, AI, or artwork storage is used.",
    details: [
      "Manage diary storage, AI analysis, emotion summary storage, and artwork storage.",
      "Emergency contact information is optional and should remain user-initiated.",
      "You can update consent settings after account creation.",
    ],
    appHref: "/consent",
    cta: "Create an account to manage consent",
  },
};

type FeatureSlug = keyof typeof featurePages;

export function generateStaticParams() {
  return Object.keys(featurePages).map((slug) => ({ slug }));
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
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-4xl flex-1 p-5">
        <nav className="flex flex-col gap-4 py-4 text-sm md:flex-row md:items-center md:justify-between">
          <Link href="/" className="font-semibold">
            Creative Companion
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/crisis"
              className="text-muted-foreground hover:text-foreground"
            >
              Crisis Resources
            </Link>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <section className="grid gap-8 py-12">
          <div className="grid gap-4">
            <p className="text-sm font-medium text-muted-foreground">
              Feature overview
            </p>
            <h1 className="text-4xl font-bold">{feature.title}</h1>
            <p className="text-lg text-muted-foreground">
              {feature.description}
            </p>
          </div>

          <div className="grid gap-3">
            {feature.details.map((detail) => (
              <div key={detail} className="rounded-md border p-4 text-sm">
                {detail}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/auth/sign-up">{feature.cta}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/login">Sign in to try this feature</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back home</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
