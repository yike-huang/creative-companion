import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";
import { cookies } from "next/headers";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
  copy,
}: {
  searchParams: Promise<{ error: string }>;
  copy: {
    authErrorCode: string;
    authErrorFallback: string;
  };
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm text-muted-foreground">
          {copy.authErrorCode}: {params.error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {copy.authErrorFallback}
        </p>
      )}
    </>
  );
}

async function AuthErrorPageContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
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
                {copy.authErrorTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorContent searchParams={searchParams} copy={copy} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <Suspense>
      <AuthErrorPageContent searchParams={searchParams} />
    </Suspense>
  );
}
