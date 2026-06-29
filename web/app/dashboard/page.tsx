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
    },
    {
      href: "/diary",
      title: t.dashboard.diaryTitle,
      description: t.dashboard.diaryDescription,
    },
    {
      href: "/recommendations",
      title: t.dashboard.recommendationsTitle,
      description: t.dashboard.recommendationsDescription,
    },
    {
      href: "/artworks",
      title: t.dashboard.artworksTitle,
      description: t.dashboard.artworksDescription,
    },
    {
      href: "/consent",
      title: t.dashboard.consentTitle,
      description: t.dashboard.consentDescription,
    },
  ];

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <h1 className="text-3xl font-bold">{t.dashboard.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{t.dashboard.intro}</p>
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
