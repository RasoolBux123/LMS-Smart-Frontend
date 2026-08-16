"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Layers, Loader2 } from "lucide-react";
import { listPrograms } from "@/lib/api/programs";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  PROGRAM_LEVELS,
  type Program,
  type ProgramLevel,
} from "@/types/program";
import { ProgramCard } from "./program-card";

type LevelFilter = ProgramLevel | "all";

const LEVEL_FILTERS: { value: LevelFilter; label: string }[] = [
  { value: "all", label: "All levels" },
  ...PROGRAM_LEVELS,
];

interface ProgramCatalogProps {
  /** Base path for a program's detail page, e.g. "/student/programs". */
  basePath: string;
  title: string;
  description: string;
  /** Admins see drafts too; everyone else only browses active programs. */
  includeDrafts?: boolean;
}

/**
 * Read-only catalogue shared by the student and instructor portals — both
 * roles browse the same full list, so the view is defined once here rather
 * than duplicated across two nearly identical pages.
 */
export function ProgramCatalog({
  basePath,
  title,
  description,
  includeDrafts = false,
}: ProgramCatalogProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");

  useEffect(() => {
    let cancelled = false;

    listPrograms(includeDrafts ? {} : { status: "active" })
      .then((res) => {
        if (!cancelled) setPrograms(res.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [includeDrafts]);

  /* Filtering stays client-side — the catalogue is small and this keeps
     typing instant. Move to the API once it outgrows a few hundred rows. */
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return programs.filter((program) => {
      if (level !== "all" && program.level !== level) return false;
      if (!term) return true;

      return `${program.title} ${program.code} ${program.description}`
        .toLowerCase()
        .includes(term);
    });
  }, [programs, search, level]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </header>

      {/* Controls stack on phones, sit inline from `sm` up */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programs…"
            aria-label="Search programs"
            className="pl-9"
          />
        </div>

        {/* Horizontally scrollable chips — never squashes on a 320px screen */}
        <div
          className="scrollbar-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:pb-0"
          role="group"
          aria-label="Filter by level"
        >
          {LEVEL_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLevel(option.value)}
              aria-pressed={level === option.value}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                level === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading programs…
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={
            search || level !== "all"
              ? "No programs match your filters"
              : "No programs available yet"
          }
          description={
            search || level !== "all"
              ? "Try a different search term or clear the level filter."
              : "Programs will appear here once an administrator publishes them."
          }
        />
      ) : (
        <>
          <p className="text-xs text-faint-foreground">
            Showing {visible.length} of {programs.length} programs
          </p>
          <div className="auto-grid">
            {visible.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                href={`${basePath}/${program.id}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
