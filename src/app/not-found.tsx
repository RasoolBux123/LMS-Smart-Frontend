import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
        <Compass className="h-7 w-7 text-primary" />
      </div>
      <h1 className="font-display text-4xl font-semibold">404</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We couldn&rsquo;t find the page you were looking for. It may have been
        moved, archived, or never existed.
      </p>
      <Button asChild>
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
