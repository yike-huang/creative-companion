import { AppShell } from "@/components/app-shell";
import { FeatureCard } from "@/components/feature-card";

const features = [
  {
    href: "/profile",
    title: "Profile",
    description:
      "You can update the limited background information used for personalization.",
  },
  {
    href: "/diary",
    title: "Emotion diary",
    description:
      "You can record emotions and private reflections in a protected space.",
  },
  {
    href: "/recommendations",
    title: "Personalized art-inspired coping activities",
    description:
      "You can explore activity suggestions and create while keeping the guidance visible.",
  },
  {
    href: "/artworks",
    title: "Independent artwork space",
    description:
      "You can draw or upload artwork that is not tied to a specific recommendation.",
  },
  {
    href: "/consent",
    title: "Consent settings",
    description:
      "You can control AI reflection, data storage, and optional safety preferences.",
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <div className="grid gap-3">
          <h1 className="text-3xl font-bold">Your companion space</h1>
          <p className="max-w-2xl text-muted-foreground">
            Here you can choose what feels useful today. Each area will keep
            growing as the diary, consent, recommendation, and artwork features
            become more complete.
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
