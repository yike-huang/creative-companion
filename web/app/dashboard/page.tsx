import { AppShell } from "@/components/app-shell";
import { FeatureCard } from "@/components/feature-card";

const features = [
  {
    href: "/profile",
    title: "Profile",
    description:
      "Update the limited background information used for personalization.",
  },
  {
    href: "/diary",
    title: "Emotion diary",
    description:
      "Record daily emotions and private reflections in a protected space.",
  },
  {
    href: "/recommendations",
    title: "Recommendations",
    description:
      "Review art-inspired coping suggestions generated from your reflections.",
  },
  {
    href: "/artworks",
    title: "Artwork space",
    description:
      "Upload artwork photos and keep notes about your creative process.",
  },
  {
    href: "/consent",
    title: "Consent settings",
    description:
      "Control AI analysis, data storage, and optional safety preferences.",
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <div className="grid gap-3">
          <h1 className="text-3xl font-bold">Your companion space</h1>
          <p className="max-w-2xl text-muted-foreground">
            Choose what you would like to work with today. Each area will grow
            gradually as we add diary, consent, recommendation, and artwork
            features.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <FeatureCard key={feature.href} {...feature} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
