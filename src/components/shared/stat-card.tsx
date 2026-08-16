"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success" | "warning" | "danger" | "info";
  delta?: string;
  index?: number;
}

const toneMap = {
  primary: { bg: "bg-primary-soft", fg: "text-primary" },
  accent: { bg: "bg-accent-soft", fg: "text-accent" },
  success: { bg: "bg-success-soft", fg: "text-success" },
  warning: { bg: "bg-warning-soft", fg: "text-warning" },
  danger: { bg: "bg-danger-soft", fg: "text-danger" },
  info: { bg: "bg-info-soft", fg: "text-info" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  delta,
  index = 0,
}: StatCardProps) {
  const t = toneMap[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className="rounded-2xl border border-border bg-card p-6 card-shadow hover:card-shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
            {value}
          </p>
          {delta && (
            <p className="mt-1 text-xs text-muted-foreground">{delta}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            t.bg,
          )}
        >
          <Icon className={cn("h-5 w-5", t.fg)} />
        </div>
      </div>
    </motion.div>
  );
}
