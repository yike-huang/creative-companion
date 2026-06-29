import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/profile", labelKey: "profile" },
  { href: "/diary", labelKey: "diary" },
  { href: "/recommendations", labelKey: "recommendations" },
  { href: "/artworks", labelKey: "artworks" },
  { href: "/consent", labelKey: "consent" },
  { href: "/crisis", labelKey: "crisis" },
] as const;

async function AppShellContent({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", data.user.id)
    .single();
  const t = getDictionary(normalizeLanguage(profile?.preferred_language));

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10">
          <div className="w-full max-w-6xl flex flex-col gap-3 p-4 text-sm md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/dashboard" className="font-semibold">
                Creative Companion
              </Link>
              <div className="flex flex-wrap gap-3 text-muted-foreground">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hover:text-foreground"
                  >
                    {t.appShell.nav[item.labelKey]}
                  </Link>
                ))}
              </div>
            </div>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <div className="w-full max-w-6xl flex-1 p-5">{children}</div>

        <footer className="w-full flex items-center justify-center border-t text-center text-xs gap-8 py-10">
          <p>{t.appShell.footerNote}</p>
          <Link href="/crisis" className="font-medium hover:underline">
            {t.appShell.crisisResources}
          </Link>
          <ThemeSwitcher
            copy={{
              light: t.appShell.themeLight,
              dark: t.appShell.themeDark,
              system: t.appShell.themeSystem,
            }}
          />
        </footer>
      </div>
    </main>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<p className="p-5 text-sm text-muted-foreground">Loading...</p>}
    >
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
