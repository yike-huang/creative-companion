import Link from "next/link";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";

const publicFeatures = [
  "Daily emotional reflection",
  "Art-inspired coping prompts",
  "Private artwork notes",
  "Consent-centered AI support",
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-6xl flex-1 p-5">
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

        <section className="grid min-h-[calc(100vh-9rem)] content-center gap-10 py-10">
          <div className="grid max-w-3xl gap-5">
            <h1 className="text-4xl font-bold md:text-6xl">
              A creative reflection space for cancer patients and survivors
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Creative Companion offers non-clinical, art-inspired emotional
              support through daily check-ins, private reflections, and careful
              AI-assisted recommendations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/auth/sign-up">Create an account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/crisis">Crisis resources</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {publicFeatures.map((feature) => (
              <div key={feature} className="rounded-md border p-4 text-sm">
                {feature}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
