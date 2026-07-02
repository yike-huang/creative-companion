import Link from "next/link";
import {
  BookOpenText,
  Brain,
  HeartHandshake,
  Images,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

const features = [
  {
    key: "daily",
    introHref: "/features/daily-emotional-reflection",
    icon: BookOpenText,
    accentClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  {
    key: "analysis",
    introHref: "/features/emotion-analysis",
    icon: Brain,
    accentClassName:
      "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100",
  },
  {
    key: "activities",
    introHref: "/features/art-inspired-coping-activities",
    icon: Sparkles,
    accentClassName:
      "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100",
  },
  {
    key: "gallery",
    introHref: "/features/personal-art-gallery",
    icon: Images,
    accentClassName:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
  },
  {
    key: "consent",
    introHref: "/features/consent-centered-ai-support",
    icon: HeartHandshake,
    accentClassName:
      "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-100",
  },
] as const;

type HomeFeatureCopy = Record<
  (typeof features)[number]["key"],
  { title: string }
>;

export function HomeFeatureLinks({ copy }: { copy: HomeFeatureCopy }) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      {features.map((feature) => {
        const Icon = feature.icon;

        return (
          <Link
            key={feature.introHref}
            href={feature.introHref}
            className="group grid min-h-36 gap-4 rounded-3xl border border-border/70 bg-card/85 p-5 text-sm shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card"
          >
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-2xl border shadow-sm",
                feature.accentClassName,
              )}
            >
              <Icon className="size-7 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105" />
            </div>
            <span className="font-medium leading-snug text-foreground">
              {copy[feature.key].title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
