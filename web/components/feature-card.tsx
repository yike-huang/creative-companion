import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FeatureCardProps = {
  href: string;
  title: string;
  description: string;
};

export function FeatureCard({ href, title, description }: FeatureCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-colors hover:bg-accent">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">Open</p>
        </CardContent>
      </Card>
    </Link>
  );
}
