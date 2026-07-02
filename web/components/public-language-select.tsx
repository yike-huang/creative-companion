"use client";

import { useRouter } from "next/navigation";

import { normalizeLanguage, supportedLanguages } from "@/lib/i18n";

export function PublicLanguageSelect({
  currentLanguage,
}: {
  currentLanguage: string | null | undefined;
}) {
  const router = useRouter();
  const selectedLanguage = normalizeLanguage(currentLanguage);

  function handleLanguageChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLanguage = normalizeLanguage(event.target.value);

    document.cookie = `creative_companion_language=${nextLanguage}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLanguage;
    router.refresh();
  }

  return (
    <select
      aria-label="Language"
      value={selectedLanguage}
      onChange={handleLanguageChange}
      className="h-9 rounded-full border border-border/70 bg-card/85 px-3 text-sm text-foreground shadow-sm transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {supportedLanguages.map((language) => (
        <option key={language.code} value={language.code}>
          {language.label}
        </option>
      ))}
    </select>
  );
}
