import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";

async function SafetyContent() {
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
            <Link href="/auth/sign-up">{copy.backToSignUp}</Link>
          </Button>
        </nav>

        <section className="grid gap-6 py-10">
          <div className="grid gap-3">
            <h1 className="text-3xl font-bold">{copy.safetyTitle}</h1>
            <p className="text-muted-foreground">
              {copy.safetyIntro}
            </p>
          </div>

          <div className="grid gap-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">{copy.notMedicalTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {copy.notMedicalDescription}
            </p>
          </div>

          <div className="grid gap-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">{copy.aiDataTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {copy.aiDataDescription}
            </p>
          </div>

          <div className="grid gap-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">{copy.urgentHelpTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {copy.urgentHelpDescription}
            </p>
            <Button asChild className="w-fit" variant="outline">
              <Link href="/crisis">{copy.viewCrisisResources}</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SafetyPage() {
  return (
    <Suspense>
      <SafetyContent />
    </Suspense>
  );
}
