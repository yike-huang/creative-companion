import { cookies } from "next/headers";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";

async function SignUpSuccessContent() {
  const cookieStore = await cookies();
  const t = getDictionary(
    normalizeLanguage(cookieStore.get("creative_companion_language")?.value),
  );
  const copy = t.auth;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {copy.signUpSuccessTitle}
              </CardTitle>
              <CardDescription>{copy.signUpSuccessDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {copy.signUpSuccessBody}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SignUpSuccessContent />
    </Suspense>
  );
}
