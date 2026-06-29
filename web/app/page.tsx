import Link from "next/link";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { HomeFeatureLinks } from "@/components/home-feature-links";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

async function HomeActions() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isSignedIn = Boolean(data.user);

  if (isSignedIn) {
    return (
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/recommendations">Recommendations</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/artworks">Artwork space</Link>
        </Button>
      </div>
    );
  }

  return (
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
  );
}

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
              Creative Companion offers a private, non-clinical place to check
              in with emotions, reflect through art, and explore gentle
              AI-assisted activity ideas when you choose.
            </p>
            <Suspense>
              <HomeActions />
            </Suspense>
          </div>

          <Suspense>
            <HomeFeatureLinks />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
