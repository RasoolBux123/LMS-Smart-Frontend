"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Search, Layers, Pencil, Trash2, Loader2 } from "lucide-react";
import { listPrograms, deleteProgram } from "@/lib/api/programs";
import { ProgramCard } from "@/features/programs/program-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage, cn } from "@/lib/utils";
import { PROGRAM_STATUSES, type Program } from "@/types/program";

type StatusFilter = "all" | Program["status"];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...PROGRAM_STATUSES,
];

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listPrograms()
      .then((res) => {
        if (!cancelled) setPrograms(res.data);
      })
      .catch((err) => {
        if (!cancelled)
          toast.error(errorMessage(err, "Could not load programs."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    /* Guards against a state update after the admin navigates away mid-fetch. */
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return programs.filter((program) => {
      if (status !== "all" && program.status !== status) return false;
      if (!term) return true;
      return `${program.title} ${program.code} ${program.description}`
        .toLowerCase()
        .includes(term);
    });
  }, [programs, search, status]);

  async function confirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    try {
      await deleteProgram(pendingDelete.id);
      setPrograms((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      toast.success(`Program "${pendingDelete.title}" deleted.`);
      setPendingDelete(null);
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not delete the program."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header — title and CTA stack on phones */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Programs
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Create and manage the degree and diploma tracks that group your
            courses.
          </p>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/programs/create">
            <Plus className="h-4 w-4" />
            New program
          </Link>
        </Button>
      </header>

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

        <div
          className="scrollbar-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:pb-0"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              aria-pressed={status === option.value}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                status === option.value
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
            search || status !== "all"
              ? "No programs match your filters"
              : "No programs yet"
          }
          description={
            search || status !== "all"
              ? "Try a different search term or clear the status filter."
              : "Create your first program to start grouping courses into a track."
          }
          action={
            !search && status === "all" ? (
              <Button asChild>
                <Link href="/admin/programs/create">
                  <Plus className="h-4 w-4" />
                  New program
                </Link>
              </Button>
            ) : undefined
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
                href={`/admin/programs/${program.id}`}
                actions={
                  <>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/programs/${program.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete(program)}
                      className="text-danger hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this program?"
        description={`"${pendingDelete?.title ?? "This program"}" will be permanently removed. Courses inside it are not deleted, but they will no longer belong to a program. This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting…" : "Delete program"}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
