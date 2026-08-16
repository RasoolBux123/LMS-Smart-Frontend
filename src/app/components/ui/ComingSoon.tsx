"use client";

import { Sparkles } from "lucide-react";

export default function ComingSoon({
  title = "Coming soon",
  description = "This module is planned for a later sprint (analytics, AI, or automation).",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-border bg-card px-8 py-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Sparkles size={22} />
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
