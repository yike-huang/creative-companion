import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/diary", label: "Diary" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/artworks", label: "Artworks" },
  { href: "/consent", label: "Consent" },
  { href: "/crisis", label: "Crisis Resources" },
];

async function AppShellContent({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

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
                    {item.label}
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
          <p>Creative Companion is a non-clinical support tool.</p>
          <Link href="/crisis" className="font-medium hover:underline">
            Crisis Resources
          </Link>
          <ThemeSwitcher />
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
