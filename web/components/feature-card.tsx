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
};

export function FeatureCard({
  href,
  title,
  description,
  openLabel,
  icon: Icon,
  accentClassName,
}: FeatureCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full overflow-hidden rounded-lg border-border/70 shadow-sm transition-colors hover:bg-accent/60">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            {Icon && (
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-lg border",
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
          <p className="text-sm font-medium text-foreground">{openLabel}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
