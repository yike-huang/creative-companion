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
    title: "Personalized art-inspired coping activities",
    description:
      "Review activity suggestions and create while keeping the guidance visible.",
  },
  {
    href: "/artworks",
    title: "Independent artwork space",
    description:
      "Draw or upload artwork that is not tied to a specific recommendation.",
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
