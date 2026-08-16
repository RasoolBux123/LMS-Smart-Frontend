"use client";

import Link from "next/link";
import { GraduationCap, ArrowLeft, MailQuestion } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6">
      <div className="hero-grid absolute inset-0 opacity-40" aria-hidden />

      <div className="glass-card relative w-full max-w-md rounded-3xl p-7 text-center sm:p-9">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft">
          <GraduationCap className="h-6 w-6 text-on-primary-soft" />
        </div>

        <h1 className="font-display text-2xl font-semibold text-foreground">
          Registration is invite-only
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Instructor and student accounts are created by an administrator from
          the Users panel. Once your credentials have been issued, sign in from
          the login page.
        </p>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-surface-muted px-4 py-3.5 text-left">
          <MailQuestion className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Don&apos;t have credentials yet? Contact your institute
            administrator or programme coordinator to request access.
          </p>
        </div>

        <Link
          href="/login"
          className="tap-target mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
