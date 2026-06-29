import Link from "next/link";

const features = [
  {
    key: "daily",
    introHref: "/features/daily-emotional-reflection",
  },
  {
    key: "analysis",
    introHref: "/features/emotion-analysis",
  },
  {
    key: "activities",
    introHref: "/features/art-inspired-coping-activities",
  },
  {
    key: "gallery",
    introHref: "/features/personal-art-gallery",
  },
  {
    key: "consent",
    introHref: "/features/consent-centered-ai-support",
  },
] as const;

type HomeFeatureCopy = Record<
  (typeof features)[number]["key"],
  { title: string }
>;

export function HomeFeatureLinks({ copy }: { copy: HomeFeatureCopy }) {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {features.map((feature) => (
        <Link
          key={feature.introHref}
          href={feature.introHref}
          className="rounded-md border p-4 text-sm transition-colors hover:bg-accent"
        >
          {copy[feature.key].title}
        </Link>
      ))}
    </div>
  );
}
