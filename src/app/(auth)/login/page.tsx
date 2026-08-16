"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Moon,
  Sun,
  ShieldCheck,
  Presentation,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage, cn } from "@/lib/utils";
import type { Role } from "@/types";

interface RoleTab {
  key: Role;
  label: string;
  icon: LucideIcon;
  blurb: string;
}

const ROLES: RoleTab[] = [
  {
    key: "student",
    label: "Student",
    icon: BookOpen,
    blurb: "Access your programs, coursework, grades and certificates.",
  },
  {
    key: "instructor",
    label: "Instructor",
    icon: Presentation,
    blurb: "Manage your courses, attendance, submissions and grading.",
  },
  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    blurb: "Oversee programs, courses, accounts and platform analytics.",
  },
];

const HIGHLIGHTS = [
  "Programs, courses and modules in one structured catalogue",
  "Attendance, assignments, quizzes, exams and projects",
  "Grading workflows with instructor feedback and analytics",
];

export default function LoginPage() {
  const { login } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activeRole = ROLES.find((r) => r.key === role)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password, role);
    } catch (err: unknown) {
      setError(errorMessage(err, "Unable to sign in. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Theme toggle — the login screen sits outside the dashboard shell,
          so it needs its own switch. */}
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="Toggle colour theme"
        className="tap-target absolute right-4 top-4 z-20 flex items-center justify-center rounded-xl border border-border bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground sm:right-6 sm:top-6"
      >
        <Sun className="h-[18px] w-[18px] dark:hidden" />
        <Moon className="hidden h-[18px] w-[18px] dark:block" />
      </button>

      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* ---------- Brand panel (desktop only) ---------- */}
        <aside className="relative hidden overflow-hidden bg-sidebar p-10 xl:p-14 lg:flex lg:flex-col lg:justify-between">
          <div className="hero-grid absolute inset-0 opacity-[0.07]" aria-hidden />
          <div
            className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-sidebar-accent/20 blur-3xl"
            aria-hidden
          />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sidebar-accent/20">
              <GraduationCap className="h-6 w-6 text-sidebar-accent" />
            </div>
            <span className="font-display text-lg font-semibold text-white">
              SmartLMS
            </span>
          </div>

          <div className="relative max-w-md">
            <h1 className="font-display text-3xl font-semibold leading-tight text-white xl:text-4xl">
              The learning platform your whole institute runs on.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-sidebar-foreground">
              One workspace for administrators, instructors and students —
              structured around programs, not scattered files.
            </p>

            <ul className="mt-8 space-y-3.5">
              {HIGHLIGHTS.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sidebar-accent"
                    aria-hidden
                  />
                  <span className="text-sm leading-relaxed text-sidebar-foreground">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-sidebar-foreground-dim">
            © {new Date().getFullYear()} SmartLMS. All rights reserved.
          </p>
        </aside>

        {/* ---------- Form panel ---------- */}
        <main className="flex items-center justify-center px-4 py-10 sm:px-8 sm:py-14">
          <div className="w-full max-w-[26rem]">
            {/* Compact brand for small screens */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft">
                <GraduationCap className="h-6 w-6 text-on-primary-soft" />
              </div>
              <span className="font-display text-lg font-semibold text-foreground">
                SmartLMS
              </span>
            </div>

            <header className="mb-7">
              <h2 className="font-display text-2xl font-semibold text-foreground sm:text-[1.75rem]">
                Sign in to your account
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Select your portal and enter the credentials issued to you.
              </p>
            </header>

            {/* Role selector */}
            <div
              role="tablist"
              aria-label="Select portal"
              className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-surface-muted p-1"
            >
              {ROLES.map((r) => {
                const Icon = r.icon;
                const selected = role === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setRole(r.key);
                      setError("");
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-xs font-semibold transition-colors sm:flex-row sm:gap-1.5 sm:text-sm",
                      selected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-2.5 min-h-[2.25rem] text-xs leading-relaxed text-faint-foreground">
              {activeRole.blurb}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-3"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <p className="text-sm leading-relaxed text-on-danger-soft">
                    {error}
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-foreground-soft"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground"
                    aria-hidden
                  />
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@institute.edu"
                    className="w-full rounded-xl border border-input bg-input-background py-3 pl-10 pr-3.5 text-foreground outline-none transition-colors placeholder:text-faint-foreground focus:border-primary focus:ring-2 focus:ring-ring/25"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground-soft"
                  >
                    Password
                  </label>
                  <Link
                    href="/login"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground"
                    aria-hidden
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-input bg-input-background py-3 pl-10 pr-11 text-foreground outline-none transition-colors placeholder:text-faint-foreground focus:border-primary focus:ring-2 focus:ring-ring/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-faint-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Signing in…" : `Sign in as ${activeRole.label}`}
              </button>
            </form>

            <div className="mt-7 border-t border-border pt-5">
              <p className="text-center text-xs leading-relaxed text-faint-foreground">
                Accounts are issued by your institute administrator.{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline"
                >
                  Need access?
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
