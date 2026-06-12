import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CrisisPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-3xl p-5">
        <nav className="flex items-center justify-between py-4 text-sm">
          <Link href="/" className="font-semibold">
            Creative Companion
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </nav>

        <section className="grid gap-6 py-10">
          <div className="grid gap-3">
            <h1 className="text-3xl font-bold">Crisis resources</h1>
            <p className="text-muted-foreground">
              Creative Companion is not a crisis service. If you may harm
              yourself or someone else, or if you are in immediate danger,
              contact local emergency services now.
            </p>
          </div>

          <div className="grid gap-4 rounded-md border p-5">
            <h2 className="text-xl font-semibold">United States</h2>
            <p className="text-sm text-muted-foreground">
              Call or text 988 to reach the 988 Suicide & Crisis Lifeline. You
              can also use their online chat.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a
                  href="tel:988"
                  aria-label="Call the 988 Suicide and Crisis Lifeline"
                >
                  Call 988
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="sms:988" aria-label="Text the 988 Lifeline">
                  Text 988
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
            <h2 className="text-xl font-semibold">Outside the United States</h2>
            <p className="text-sm text-muted-foreground">
              Crisis and mental health resources vary by country and region.
              Find A Helpline can help locate available support where you are.
            </p>
            <Button asChild className="w-fit" variant="outline">
              <a
                href="https://findahelpline.com/"
                target="_blank"
                rel="noreferrer"
              >
                Find A Helpline
              </a>
            </Button>
          </div>

          <div className="rounded-md border p-5 text-sm text-muted-foreground">
            AI features in this project should never replace emergency care,
            local crisis services, clinicians, or trusted support people.
          </div>
        </section>
      </div>
    </main>
  );
}
