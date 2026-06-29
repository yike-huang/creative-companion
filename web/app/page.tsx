import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { HomeFeatureLinks } from "@/components/home-feature-links";
import { Button } from "@/components/ui/button";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

async function getHomeCopy() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const { data: profile } = data.user
    ? await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", data.user.id)
        .maybeSingle()
    : { data: null };
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get("creative_companion_language")?.value;
  const t = getDictionary(
    normalizeLanguage(profile?.preferred_language ?? cookieLanguage),
  );

  return { copy: t.publicPages, isSignedIn: Boolean(data.user) };
}

function HomeActions({
  copy,
  isSignedIn,
}: {
  copy: Awaited<ReturnType<typeof getHomeCopy>>["copy"];
  isSignedIn: boolean;
}) {
  if (isSignedIn) {
    return (
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/dashboard">{copy.goToDashboard}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/recommendations">{copy.recommendations}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/artworks">{copy.artworkSpace}</Link>
        </Button>
      </div>
    );
  }

  return (
      <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href="/auth/sign-up">{copy.createAccount}</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/auth/login">{copy.signIn}</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/crisis">{copy.crisisResources}</Link>
      </Button>
    </div>
  );
}

async function HomeHero() {
  const { copy, isSignedIn } = await getHomeCopy();

  return (
    <>
      <div className="grid max-w-3xl gap-5">
        <h1 className="text-4xl font-bold md:text-6xl">{copy.homeTitle}</h1>
        <p className="text-lg text-muted-foreground md:text-xl">
          {copy.homeIntro}
        </p>
        <HomeActions copy={copy} isSignedIn={isSignedIn} />
      </div>

      <HomeFeatureLinks copy={copy.features} />
    </>
  );
}

async function HomeContent() {
  const { copy } = await getHomeCopy();

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-6xl flex-1 p-5">
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

        <section className="grid min-h-[calc(100vh-9rem)] content-center gap-10 py-10">
          <Suspense>
            <HomeHero />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
