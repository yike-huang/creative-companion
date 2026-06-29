import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";

async function CrisisContent() {
  const cookieStore = await cookies();
  const t = getDictionary(
    normalizeLanguage(cookieStore.get("creative_companion_language")?.value),
  );
  const copy = t.publicPages;

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-3xl p-5">
        <nav className="flex items-center justify-between py-4 text-sm">
          <Link href="/" className="font-semibold">
            {copy.brand}
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">{copy.dashboard}</Link>
          </Button>
        </nav>

        <section className="grid gap-6 py-10">
          <div className="grid gap-3">
            <h1 className="text-3xl font-bold">{copy.crisisTitle}</h1>
            <p className="text-muted-foreground">
              {copy.crisisIntro}
            </p>
          </div>

          <div className="grid gap-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">{copy.unitedStates}</h2>
            <p className="text-sm text-muted-foreground">
              {copy.usCrisisDescription}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a
                  href="tel:988"
                  aria-label="Call the 988 Suicide and Crisis Lifeline"
                >
                  {copy.call988}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="sms:988" aria-label="Text the 988 Lifeline">
                  {copy.text988}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href="https://988lifeline.org/"
                  target="_blank"
                  rel="noreferrer"
                >
                  988 Lifeline
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">{copy.outsideUS}</h2>
            <p className="text-sm text-muted-foreground">
              {copy.outsideUSDescription}
            </p>
            <Button asChild className="w-fit" variant="outline">
              <a
                href="https://findahelpline.com/"
                target="_blank"
                rel="noreferrer"
              >
                {copy.findAHelpline}
              </a>
            </Button>
          </div>

          <div className="rounded-md border p-5 text-sm text-muted-foreground">
            {copy.crisisFooter}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CrisisPage() {
  return (
    <Suspense>
      <CrisisContent />
    </Suspense>
  );
}
