"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Layers } from "lucide-react";
import { getProgram } from "@/lib/api/programs";
import { ProgramForm } from "@/features/programs/program-form";
import { EmptyState } from "@/components/shared/empty-state";
import type { Program } from "@/types/program";

export default function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getProgram(id)
      .then((res) => {
        if (!cancelled) setProgram(res.data);
      })
      .catch(() => {
        if (!cancelled) setProgram(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to programs
      </Link>

      {loading ? (
        <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading program…
        </div>
      ) : !program ? (
        <EmptyState
          icon={Layers}
          title="Program not found"
          description="This program may have already been deleted."
        />
      ) : (
        <>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Edit program
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Update the details for{" "}
              <span className="font-medium text-foreground">
                {program.title}
              </span>
              .
            </p>
          </div>

          <ProgramForm mode="edit" program={program} />
        </>
      )}
    </div>
  );
}
