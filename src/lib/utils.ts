import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Returns { label, urgent, overdue } describing remaining time until an ISO deadline. */
export function remainingTime(deadline: string, referenceDate = new Date()) {
  const due = new Date(deadline).getTime();
  const now = referenceDate.getTime();
  const diffMs = due - now;
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);

  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let label: string;
  if (days >= 1) {
    label = `${days}d ${hours}h`;
  } else if (hours >= 1) {
    label = `${hours}h`;
  } else {
    const mins = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
    label = `${mins}m`;
  }

  return {
    label: overdue ? `${label} overdue` : `${label} left`,
    overdue,
    urgent: !overdue && diffMs < 1000 * 60 * 60 * 24, // < 24h
    percentElapsed: null as number | null,
  };
}

/** Percent of the assignment window elapsed, clamped 0-100, for progress rings. */
export function windowElapsedPercent(
  createdAt: string,
  deadline: string,
  referenceDate = new Date(),
) {
  const start = new Date(createdAt).getTime();
  const end = new Date(deadline).getTime();
  const now = referenceDate.getTime();
  if (end <= start) return 100;
  const pct = ((now - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, pct));
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Turns an unknown thrown value into a readable message (for catch blocks). */
export function errorMessage(err: unknown, fallback = "Something went wrong") {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}
