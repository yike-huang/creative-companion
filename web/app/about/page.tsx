import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { PublicLanguageSelect } from "@/components/public-language-select";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

async function getAboutHeaderCopy() {
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

  return {
    copy: t.publicPages,
    currentLanguage: profile?.preferred_language ?? cookieLanguage,
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="paper-surface grid gap-4 rounded-3xl border border-border/70 p-6 shadow-sm md:p-8">
      <h2 className="text-2xl leading-tight md:text-3xl">{title}</h2>
      <div className="grid gap-4 text-base leading-8 text-muted-foreground md:text-lg">
        {children}
      </div>
    </section>
  );
}

async function AboutContent() {
  const { copy, currentLanguage } = await getAboutHeaderCopy();

  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full max-w-5xl flex-1 p-5">
        <nav className="flex flex-col gap-4 py-4 text-sm md:flex-row md:items-center md:justify-between">
          <Link href="/" className="font-semibold tracking-wide">
            {copy.brand}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <PublicLanguageSelect currentLanguage={currentLanguage} />
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground"
            >
              {copy.backHome}
            </Link>
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

        <div className="grid gap-7 py-10">
          <header className="relative grid gap-5 overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-7 shadow-sm md:p-10">
            <div
              className="pointer-events-none absolute -left-8 top-10 h-5 w-48 rotate-[-7deg] rounded-full bg-rose-200/50 blur-[1px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute right-10 top-16 h-4 w-40 rotate-[5deg] rounded-full bg-emerald-200/50 blur-[1px]"
              aria-hidden="true"
            />
            <p className="relative text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              About Creative Companion
            </p>
            <h1 className="relative max-w-3xl text-4xl leading-tight md:text-6xl">
              The stories behind Creative Companion
            </h1>
            <p className="relative max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
              A personal note on why this project exists, how AI is used here,
              and what Creative Companion is still learning to do better.
            </p>
          </header>

          <Section title="Hi, I’m Yike">
            <p>
              I’m the developer of Creative Companion. I’m an ordinary high
              school student, an art lover, and a childhood cancer survivor.
            </p>
          </Section>

          <Section title="Why create Creative Companion?">
            <p>
              During treatment, as someone who had loved art from a very young
              age, I naturally turned to creating when tough moments came. I
              doodled mindlessly for distraction after hearing my diagnosis. I
              painted feelings of confinement after chemotherapy sessions filled
              with vomiting. I even drew the snacks I longed for during
              transplant, because I am a huge foodie.
            </p>
            <p>
              The helpfulness of creating art went beyond what I expected.
              Through art, I could process emotions without being overwhelmed
              by them. I could express feelings that felt too personal to be
              fully understood by anyone other than myself while going through
              treatment.
            </p>
            <p>
              My original purpose in creating this website is to share the
              supportive power of art with more cancer patients and survivors,
              and to make art a more accessible channel for non-clinical
              emotional support.
            </p>
          </Section>

          <Section title="Why incorporate AI?">
            <p>
              A question I often get is: why is Creative Companion AI-powered?
              Here, the AI assistant helps users reflect on emotions and offers
              personalized art-inspired coping activity ideas. Its role is
              always assistant, never protagonist.
            </p>
            <p>
              Users remain the center of the emotional and creative process.
              They choose consent settings, what to write in diary entries,
              whether to use AI recommendations, and how to create. Creative
              Companion is against the idea that AI could replace human roles
              in emotional support or creative activity.
            </p>
            <p>
              Emotional needs vary from person to person. This can be especially
              important for cancer patients and survivors, because age,
              treatment phase, cancer type, personal life, and current context
              may shape very different emotional needs. With consent, AI
              recommendations are based on limited profile information, diary
              reflections, and curated reliable mental health and art-related
              sources.
            </p>
            <p>
              People also feel differently about creating art. Some may prefer
              drawing from their own ideas. Others may find step-by-step
              guidance less intimidating. Creative Companion includes both:
              AI-assisted activity ideas and an independent artwork space.
            </p>
          </Section>

          <Section title="What AI does not do here">
            <p>
              AI in Creative Companion is not meant to substitute for human
              care, clinical support, art therapy, psychotherapy, medical
              advice, crisis support, or emergency care. It should not diagnose
              users or claim that a specific creative activity will produce a
              guaranteed emotional result.
            </p>
            <p>
              The goal is to support emotional agency and each user’s unique
              creativity, while keeping choices visible and consent-centered.
            </p>
          </Section>

          <Section title="Safety, privacy, and reliable sources">
            <p>
              As someone who experienced mental health struggles during cancer
              treatment, I recognize the safety risks and ethical questions in
              this project, especially because it includes AI.
            </p>
            <p>
              Creative Companion is not a clinical support tool and can never
              replace licensed mental health professionals. The site includes
              crisis resources and high-risk emotion detection as safety
              supports, but these are not a replacement for urgent or
              professional help.
            </p>
            <p>
              To reduce the risk of AI hallucination, Creative Companion uses a
              retrieval-augmented generation approach. This means AI responses
              are guided by curated sources rather than being generated from
              the model alone. The site also collects only limited identifiable
              profile information, uses consent settings, and stores user data
              in Supabase.
            </p>
          </Section>

          <Section title="Limitations and next steps">
            <p>
              I also recognize the limitations of the current safety
              precautions. Creative Companion has not yet found perfect ways to
              address risks such as unhealthy reliance on the tool, lack of
              real-time feedback for urgent emotional needs, additional stress
              from inaccurate AI suggestions, or cybersecurity risks to the
              database.
            </p>
            <p>
              I will continue learning and developing, hoping to make Creative
              Companion safer and more helpful. Feedback and suggestions are
              deeply appreciated.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

export default function AboutPage() {
  return (
    <Suspense>
      <AboutContent />
    </Suspense>
  );
}
