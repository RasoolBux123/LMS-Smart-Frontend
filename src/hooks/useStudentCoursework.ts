"use client";

import { useEffect, useState } from "react";
import { apiFetch, type ApiEnvelope } from "@/lib/api/client";
import { courseworkApi } from "@/lib/api/coursework";
import { useAuth } from "@/hooks/useAuth";
import type {
  CourseworkKind,
  DerivedCourseworkRow,
  Submission,
  SubmissionStatus,
} from "@/types";

/**
 * Loads a student's coursework of one kind, joined with their own
 * submission for each item.
 *
 * The student pages used to read `@/data/coursework`, which is an empty
 * seed array — so nothing an instructor created ever appeared. This pulls
 * the real list instead.
 */

/** UI kind ("quiz") -> API collection ("quizzes"). */
const KIND_TO_PATH: Record<CourseworkKind, string> = {
  assignment: "assignments",
  quiz: "quizzes",
  exam: "exams",
  project: "projects",
};

/**
 * A submission's own status wins once it exists. Otherwise the row is
 * "pending", or "late" once the deadline has passed with nothing handed in.
 */
export function deriveStudentStatus(
  deadline: string,
  submission: Submission | null,
): SubmissionStatus {
  if (submission && submission.status !== "pending") {
    return submission.status;
  }

  const parsed = new Date(deadline).getTime();
  const overdue = !Number.isNaN(parsed) && parsed < Date.now();

  return overdue ? "late" : "pending";
}

/** The student's submissions across every kind, keyed by coursework id. */
async function fetchMySubmissions(studentId: string) {
  try {
    const res = await apiFetch<ApiEnvelope<Submission[]>>(
      `/submissions/me?studentId=${encodeURIComponent(studentId)}`,
    );

    return new Map(res.data.map((s) => [s.assignmentId, s]));
  } catch {
    /* Submissions are supplementary — an empty map still renders the list. */
    return new Map<string, Submission>();
  }
}

export function useStudentCoursework(kind: CourseworkKind) {
  const { user } = useAuth();
  const [rows, setRows] = useState<DerivedCourseworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    const studentId = user.id;

    async function load() {
      try {
        const api = courseworkApi(
          KIND_TO_PATH[kind] as Parameters<typeof courseworkApi>[0],
        );

        /* One list call plus one submissions call — not one per row. */
        const [rawItems, submissions] = await Promise.all([
          api.list({ status: "published", studentId }),
          fetchMySubmissions(studentId),
        ]);

        // Backend returns a raw array; tolerate a legacy { data } envelope too.
        const items = Array.isArray(rawItems)
          ? rawItems
          : Array.isArray((rawItems as { data?: unknown })?.data)
            ? ((rawItems as { data: typeof rawItems }).data as typeof rawItems)
            : [];

        if (cancelled) return;

        const derived: DerivedCourseworkRow[] = items.map((item) => {
          const submission = submissions.get(item.id) ?? null;

          return {
            ...item,
            kind,
            objectives: item.objectives ?? [],
            attachments: item.attachments ?? [],
            courseTitle: item.course?.title ?? "Unassigned",
            courseCode: item.course?.code || item.course?.title || "—",
            // The list endpoint joins the course but not the instructor;
            // the detail view fetches that separately when it is needed.
            instructorName: "",
            submission,
            studentStatus: deriveStudentStatus(item.deadline, submission),
          } as DerivedCourseworkRow;
        });

        derived.sort(
          (a, b) =>
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
        );

        setRows(derived);
      } catch {
        if (!cancelled) setError("Could not load your coursework.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [kind, user?.id, user?.email]);

  return { rows, loading, error };
}