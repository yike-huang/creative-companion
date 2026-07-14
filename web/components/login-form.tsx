"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  copy,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  copy: {
    loginTitle: string;
    loginDescription: string;
    email: string;
    password: string;
    forgotPassword: string;
    loggingIn: string;
    loginAction: string;
    continueWithGoogle: string;
    orUseEmail: string;
    noAccount: string;
    signUp: string;
    fallbackError: string;
  };
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : copy.fallbackError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : copy.fallbackError);
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="rounded-3xl border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="gap-3">
          <div className="flex gap-2" aria-hidden="true">
            <span className="h-2.5 w-10 rounded-full bg-rose-200/80" />
            <span className="h-2.5 w-7 rounded-full bg-emerald-200/80" />
            <span className="h-2.5 w-9 rounded-full bg-sky-200/80" />
          </div>
          <CardTitle className="text-3xl leading-tight">
            {copy.loginTitle}
          </CardTitle>
          <CardDescription className="text-base leading-7">
            {copy.loginDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background font-sans text-sm font-semibold">
                G
              </span>
              {copy.continueWithGoogle}
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>{copy.orUseEmail}</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mt-6 flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">{copy.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{copy.password}</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {copy.forgotPassword}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full rounded-2xl"
                disabled={isLoading}
              >
                {isLoading ? copy.loggingIn : copy.loginAction}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              {copy.noAccount}{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                {copy.signUp}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
