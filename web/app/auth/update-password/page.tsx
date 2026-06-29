import { cookies } from "next/headers";
import { Suspense } from "react";

import { UpdatePasswordForm } from "@/components/update-password-form";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";

async function UpdatePasswordContent() {
  const cookieStore = await cookies();
  const t = getDictionary(
    normalizeLanguage(cookieStore.get("creative_companion_language")?.value),
  );

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm copy={t.auth} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <UpdatePasswordContent />
    </Suspense>
  );
}
