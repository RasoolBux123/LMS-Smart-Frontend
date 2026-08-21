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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/utils";

export default function LoginPage() {
  const { login } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      setError(errorMessage(err, "Unable to sign in. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-muted px-4 py-10">
      {/* Ambient wash — keeps the page from reading as a blank sheet */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="Toggle colour theme"
        className="tap-target absolute right-4 top-4 z-20 flex items-center justify-center rounded-xl border border-border bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground sm:right-6 sm:top-6"
      >
        <Sun className="h-[18px] w-[18px] dark:hidden" />
        <Moon className="hidden h-[18px] w-[18px] dark:block" />
      </button>

      <div className="relative w-full max-w-[25rem]">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="mt-4 font-display text-xl font-semibold tracking-tight text-foreground">
            SmartLMS
          </span>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-border bg-surface p-7 shadow-xl shadow-black/[0.04] sm:p-8">
          <header className="mb-6 text-center">
            <h1 className="font-display text-[1.5rem] font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Sign in and we&apos;ll take you to your workspace.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                  autoFocus
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
              className="tap-target mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-faint-foreground">
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
  );
} 