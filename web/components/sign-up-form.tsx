"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export function SignUpForm({
  copy,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  copy: {
    signUpTitle: string;
    signUpDescription: string;
    email: string;
    password: string;
    repeatPassword: string;
    safetyTitle: string;
    safetyDescription: string;
    safetyLink: string;
    crisisLink: string;
    creatingAccount: string;
    signUp: string;
    alreadyAccount: string;
    loginAction: string;
    passwordMismatch: string;
    safetyRequired: string;
    fallbackError: string;
  };
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [acceptedSafetyTerms, setAcceptedSafetyTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError(copy.passwordMismatch);
      setIsLoading(false);
      return;
    }

    if (!acceptedSafetyTerms) {
      setError(copy.safetyRequired);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : copy.fallbackError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{copy.signUpTitle}</CardTitle>
          <CardDescription>{copy.signUpDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
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
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">
                    {copy.repeatPassword}
                  </Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              <div className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox
                  id="safety-acknowledgement"
                  checked={acceptedSafetyTerms}
                  onCheckedChange={(checked) =>
                    setAcceptedSafetyTerms(checked === true)
                  }
                  aria-describedby="safety-acknowledgement-description"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="safety-acknowledgement">
                    {copy.safetyTitle}
                  </Label>
                  <p
                    id="safety-acknowledgement-description"
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {copy.safetyDescription}{" "}
                    <Link
                      href="/safety"
                      className="font-medium underline underline-offset-4"
                    >
                      {copy.safetyLink}
                    </Link>{" "}
                    ·{" "}
                    <Link
                      href="/crisis"
                      className="font-medium underline underline-offset-4"
                    >
                      {copy.crisisLink}
                    </Link>
                  </p>
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? copy.creatingAccount : copy.signUp}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              {copy.alreadyAccount}{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                {copy.loginAction}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
