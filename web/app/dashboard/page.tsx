import {
  BookOpenText,
  Brush,
  ClipboardCheck,
  Palette,
  Sparkles,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { FeatureCard } from "@/components/feature-card";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

async function DashboardContent() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const { data: profile } = authData.user
    ? await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", authData.user.id)
        .single()
    : { data: null };
  const t = getDictionary(normalizeLanguage(profile?.preferred_language));
  const features = [
    {
      href: "/profile",
      title: t.dashboard.profileTitle,
      description: t.dashboard.profileDescription,
      icon: ClipboardCheck,
      accentClassName:
        "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100",
    },
    {
      href: "/diary",
      title: t.dashboard.diaryTitle,
      description: t.dashboard.diaryDescription,
      icon: BookOpenText,
      accentClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100",
    },
    {
      href: "/recommendations",
      title: t.dashboard.recommendationsTitle,
      description: t.dashboard.recommendationsDescription,
      icon: Sparkles,
      accentClassName:
        "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100",
    },
    {
      href: "/artworks",
      title: t.dashboard.artworksTitle,
      description: t.dashboard.artworksDescription,
      icon: Palette,
      accentClassName:
        "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
    },
    {
      href: "/consent",
      title: t.dashboard.consentTitle,
      description: t.dashboard.consentDescription,
      icon: Brush,
      accentClassName:
        "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-100",
    },
  ];

  return (
    <div className="grid gap-8">
      <div className="paper-surface relative overflow-hidden rounded-3xl border border-border/70 p-6 shadow-sm md:p-8">
        <div className="absolute right-5 top-5 hidden gap-2 md:flex">
          <span className="size-4 rounded-full bg-rose-200/80" />
          <span className="size-4 rounded-full bg-emerald-200/80" />
          <span className="size-4 rounded-full bg-sky-200/80" />
        </div>
        <div className="grid max-w-3xl gap-3">
          <h1 className="text-3xl font-bold">{t.dashboard.title}</h1>
          <p className="text-base leading-7 text-muted-foreground">
            {t.dashboard.intro}
          </p>
          <div className="mt-2 flex gap-2" aria-hidden="true">
            <span className="paint-ribbon w-16 bg-rose-200/80" />
            <span className="paint-ribbon w-10 bg-emerald-200/80" />
            <span className="paint-ribbon w-14 bg-sky-200/80" />
            <span className="paint-ribbon w-8 bg-amber-200/80" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <FeatureCard
            key={feature.href}
            {...feature}
            openLabel={t.dashboard.open}
          />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
