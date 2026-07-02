import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  href: string;
  title: string;
  description: string;
  openLabel: string;
  icon?: React.ComponentType<{ className?: string }>;
  accentClassName?: string;
  ribbonClassName?: string;
};

export function FeatureCard({
  href,
  title,
  description,
  openLabel,
  icon: Icon,
  accentClassName,
  ribbonClassName,
}: FeatureCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="creative-card-surface relative h-full overflow-hidden rounded-3xl border-border/70 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/20">
        <div
          className="pointer-events-none absolute right-5 top-5 flex gap-1.5"
          aria-hidden="true"
        >
          <span className="size-2.5 rounded-full bg-rose-200/85" />
          <span className="size-2.5 rounded-full bg-emerald-200/85" />
          <span className="size-2.5 rounded-full bg-sky-200/85" />
        </div>
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            {Icon && (
              <div
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
                  accentClassName ?? "bg-muted text-foreground",
                )}
              >
                <Icon className="size-6 transition-transform group-hover:-rotate-3 group-hover:scale-105" />
              </div>
            )}
            <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="grid gap-2">
            <CardTitle className="text-lg leading-tight">{title}</CardTitle>
            <CardDescription className="leading-relaxed">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {ribbonClassName && (
            <div className="mb-4" aria-hidden="true">
              <span className={cn("paint-ribbon block w-16", ribbonClassName)} />
            </div>
          )}
          <p className="text-sm font-medium text-foreground">{openLabel}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
