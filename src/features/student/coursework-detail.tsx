"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  ListChecks,
  Paperclip,
  Award,
  User,
  CalendarClock,
  Loader2,
  AlertCircle,
  FileX2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeadlineRing } from "@/components/shared/deadline-ring";
import { SubmissionStatusBadge } from "@/components/shared/status-badge";
import { FileTypeIcon } from "@/components/shared/file-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { SubmissionPanel } from "@/features/student/submission-panel";
import { courseworkLabels } from "@/features/student/coursework-config";
import { deriveStudentStatus } from "@/hooks/useStudentCoursework";
import { apiFetch, type ApiEnvelope } from "@/lib/api/client";
import { courseworkApi } from "@/lib/api/coursework";
import { useAuth } from "@/hooks/useAuth";
import { formatBytes, formatDate } from "@/lib/utils";
import type {
  CourseworkKind,
  DerivedCourseworkRow,
  Submission,
} from "@/types";

/** UI kind ("quiz") -> API collection ("quizzes"). */
const KIND_TO_PATH: Record<CourseworkKind, string> = {
  assignment: "assignments",
  quiz: "quizzes",
  exam: "exams",
  project: "projects",
};

/** Uploads are served from the API host, not the Next.js origin. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function attachmentHref(url: string | undefined) {
  if (!url) return "#";
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

export function CourseworkDetail({
  kind,
  id,
}: {
  kind: CourseworkKind;
  id: string;
}) {
  const labels = courseworkLabels[kind];
  const { user } = useAuth();

  /* Read the two fields up front: depending on `user` itself would make the
     loader rerun on every unrelated auth-context change. */
  const userId = user?.id;
  const userEmail = user?.email;

  /*
   * This used to call `studentCourseworkDetail(currentStudent.id, kind, id)`,
   * which read the empty `@/data/*` seed arrays — so every detail page hit
   * `notFound()`. The item and the student's own submission now come from
   * the API.
   */
  const [row, setRow] = useState<DerivedCourseworkRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  /* Bumping this refetches — the submission panel calls it after a
     successful upload so the header status and ring stay in step. */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    const studentId = userEmail || userId;
    const path = KIND_TO_PATH[kind];

    async function load() {
      try {
        const item = await courseworkApi(
          path as Parameters<typeof courseworkApi>[0],
        ).get(id);

        /* The submission is supplementary — a failure here should not blank
           out the whole page, so it degrades to "nothing handed in yet". */
        let submission: Submission | null = null;
        try {
          const res = await apiFetch<ApiEnvelope<Submission | null>>(
            `/${path}/${id}/submissions/me?studentId=${encodeURIComponent(studentId)}`,
          );
          submission = res.data;
        } catch {
          submission = null;
        }

        if (cancelled) return;

        setRow({
          ...item,
          kind,
          objectives: item.objectives ?? [],
          attachments: item.attachments ?? [],
          courseTitle: item.course?.title ?? "Unassigned",
          courseCode: item.course?.code || item.course?.title || "—",
          instructorName: item.course?.instructorName ?? "",
          submission,
          studentStatus: deriveStudentStatus(item.deadline, submission),
        } as DerivedCourseworkRow);
      } catch (err: unknown) {
        if (cancelled) return;

        /* A 404 is a missing item, which is a different message from a
           network or server failure — don't collapse them into one. */
        const status = (err as { status?: number })?.status;
        if (status === 404) setMissing(true);
        else setError(`Could not load this ${labels.singular}.`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, kind, userId, userEmail, labels.singular, reloadKey]);

  const backLink = (
    <Link
      href={labels.basePath}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to{" "}
      {labels.plural.toLowerCase()}
    </Link>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {backLink}
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-card py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading {labels.singular}…
        </div>
      </div>
    );
  }

  if (missing || (!row && !error)) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {backLink}
        <EmptyState
          icon={FileX2}
          title={`${labels.singular} not found`}
          description={`This ${labels.singular} may have been removed, or it is not available on your courses.`}
        />
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {backLink}
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3.5"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm leading-relaxed text-on-danger-soft">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {backLink}

      <div className="card-shadow flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{row.courseCode}</Badge>
            <SubmissionStatusBadge status={row.studentStatus} />
          </div>

          <h1 className="mt-3 font-display text-xl font-semibold leading-snug text-foreground sm:text-2xl">
            {row.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {row.instructorName && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {row.instructorName}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" /> Due{" "}
              {formatDate(row.deadline)}
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" /> {row.totalMarks} points
            </span>
          </div>
        </div>

        <DeadlineRing
          createdAt={row.createdAt}
          deadline={row.deadline}
          size={64}
          strokeWidth={5}
          submitted={
            row.studentStatus === "submitted" || row.studentStatus === "graded"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {row.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {row.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Objectives are optional on the API model, so an empty list
              renders nothing rather than an empty card. */}
          {row.objectives.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <Target className="h-4 w-4 text-primary" />
                <CardTitle>Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {row.objectives.map((objective, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {row.instructions && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <ListChecks className="h-4 w-4 text-primary" />
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {row.instructions}
                </p>
              </CardContent>
            </Card>
          )}

          {row.attachments.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <Paperclip className="h-4 w-4 text-primary" />
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {row.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-4 rounded-xl border border-border p-4"
                  >
                    <FileTypeIcon kind={attachment.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {attachment.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatBytes(attachment.size)}
                      </p>
                    </div>

                    {/* This was a dead <Button> that downloaded nothing. */}
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={attachmentHref(attachment.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        Download
                      </a>
                    </Button>
                  </div>
                ))}
            </CardContent>
            </Card>
          )}
      </div>

      <div className="lg:col-span-1">
        <SubmissionPanel row={row} onSubmitted={() => setReloadKey((k) => k + 1)} />
      </div>
    </div>
    </div >
  );
}