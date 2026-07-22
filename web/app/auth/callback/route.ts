import { createClient } from "@/lib/supabase/server";
import { normalizeLanguage } from "@/lib/i18n";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");
  const next = nextParam?.startsWith("/") ? nextParam : "/dashboard";
  const redirectTo = requestUrl.origin + next;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          const preferredLanguage = normalizeLanguage(
            request.cookies.get("creative_companion_language")?.value,
          );
          const displayName =
            typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : (user.email?.split("@")[0] ?? "Creative Companion user");

          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email ?? "",
              display_name: displayName,
              preferred_language: preferredLanguage,
            });

          if (profileError) {
            const errorUrl = new URL("/auth/error", requestUrl.origin);
            errorUrl.searchParams.set("error", profileError.message);
            return NextResponse.redirect(errorUrl);
          }

          return NextResponse.redirect(`${requestUrl.origin}/profile`);
        }
      }

      return NextResponse.redirect(redirectTo);
    }

    const errorUrl = new URL("/auth/error", requestUrl.origin);
    errorUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(errorUrl);
  }

  const errorUrl = new URL("/auth/error", requestUrl.origin);
  errorUrl.searchParams.set("error", "Missing OAuth callback code");
  return NextResponse.redirect(errorUrl);
}
