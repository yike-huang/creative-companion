import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { getDictionary, normalizeLanguage } from "@/lib/i18n";

export async function AuthButton() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const cookieLanguage = cookieStore.get("creative_companion_language")?.value;
  const t = getDictionary(
    normalizeLanguage(profile?.preferred_language ?? cookieLanguage),
  );
  const copy = t.publicPages;

  return user ? (
    <div className="flex items-center gap-4">
      {copy.signedInGreeting} {user.email}
      <LogoutButton label={copy.logout} />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">{copy.signIn}</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">{copy.signUp}</Link>
      </Button>
    </div>
  );
}
