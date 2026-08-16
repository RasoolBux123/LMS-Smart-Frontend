import type { Submission } from "@/types";

/** Submissions — populate from your API. */
export const submissions: Submission[] = [];

export function submissionsFor(courseworkId: string) {
  return submissions.filter((s) => s.assignmentId === courseworkId);
}

export function submissionFor(courseworkId: string, studentId: string) {
  return (
    submissions.find(
      (s) => s.assignmentId === courseworkId && s.studentId === studentId,
    ) ?? null
  );
}

export function submissionsByStudent(studentId: string) {
  return submissions.filter((s) => s.studentId === studentId);
}
