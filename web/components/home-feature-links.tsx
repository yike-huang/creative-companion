import Link from "next/link";

const features = [
  {
    title: "Daily emotional reflection",
    introHref: "/features/daily-emotional-reflection",
  },
  {
    title: "Emotion analysis",
    introHref: "/features/emotion-analysis",
  },
  {
    title: "Personalized art-inspired coping activities",
    introHref: "/features/art-inspired-coping-activities",
  },
  {
    title: "Personal art gallery",
    introHref: "/features/personal-art-gallery",
  },
  {
    title: "Consent-centered AI support",
    introHref: "/features/consent-centered-ai-support",
  },
];

export function HomeFeatureLinks() {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {features.map((feature) => (
        <Link
          key={feature.introHref}
          href={feature.introHref}
          className="rounded-md border p-4 text-sm transition-colors hover:bg-accent"
        >
          {feature.title}
        </Link>
      ))}
    </div>
  );
}
