import { cookies } from "next/headers";
import { Suspense } from "react";

import { PublicLanguageSelect } from "@/components/public-language-select";
import { SignUpForm } from "@/components/sign-up-form";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";

async function SignUpContent() {
  const cookieStore = await cookies();
  const currentLanguage = cookieStore.get("creative_companion_language")?.value;
  const t = getDictionary(normalizeLanguage(currentLanguage));

  return (
    <div className="grid min-h-svh w-full content-center gap-6 p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-md justify-end">
        <PublicLanguageSelect currentLanguage={currentLanguage} />
      </div>
      <div className="mx-auto w-full max-w-md">
        <SignUpForm copy={t.auth} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SignUpContent />
    </Suspense>
  );
}
