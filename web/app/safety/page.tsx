import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function SafetyPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-3xl p-5">
        <nav className="flex items-center justify-between py-4 text-sm">
          <Link href="/" className="font-semibold">
            Creative Companion
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/sign-up">Back to sign up</Link>
          </Button>
        </nav>

        <section className="grid gap-6 py-10">
          <div className="grid gap-3">
            <h1 className="text-3xl font-bold">Safety and consent basics</h1>
            <p className="text-muted-foreground">
              Creative Companion is designed as a non-clinical reflection and
              creative coping support tool. It should complement, not replace,
              professional care.
            </p>
          </div>

          <div className="grid gap-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">What this app is not</h2>
            <p className="text-sm text-muted-foreground">
              Creative Companion is not a medical, diagnostic, psychotherapy,
              art therapy, emergency, or crisis intervention service. AI
              responses should not be treated as clinical advice.
            </p>
          </div>

          <div className="grid gap-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">AI and data choices</h2>
            <p className="text-sm text-muted-foreground">
              Some future features may use AI to summarize emotional patterns
              or suggest art-inspired coping activities. Detailed consent
              settings will let users manage AI analysis and data storage before
              diary or recommendation features are used.
            </p>
          </div>

          <div className="grid gap-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">If you need urgent help</h2>
            <p className="text-sm text-muted-foreground">
              If you may harm yourself or someone else, or if you are in
              immediate danger, contact local emergency services now. You can
              also review crisis resources.
            </p>
            <Button asChild className="w-fit" variant="outline">
              <Link href="/crisis">View crisis resources</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
