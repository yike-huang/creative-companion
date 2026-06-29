import { cookies } from "next/headers";
import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";

async function LoginContent() {
  const cookieStore = await cookies();
  const t = getDictionary(
    normalizeLanguage(cookieStore.get("creative_companion_language")?.value),
  );

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm copy={t.auth} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
