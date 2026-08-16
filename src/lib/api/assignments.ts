import { apiFetch, type ApiEnvelope } from "./client";
import type {
  Assignment as AssignmentEntity,
  AssignmentAttachment,
  AssignmentListItem,
  AssignmentPayload,
  AssignmentStatus,
} from "@/types/assignment";
import type { CourseOption } from "@/types/course";

export interface AssignmentListParams {
  search?: string;
  status?: AssignmentStatus | "all";
}

export function getAssignments(params: AssignmentListParams = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") qs.set("status", params.status);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<AssignmentListItem[]>(`/assignments${suffix}`);
}

export function getAssignment(id: string) {
  return apiFetch<AssignmentEntity>(`/assignments/${id}`);
}

export function createAssignment(payload: AssignmentPayload) {
  return apiFetch<AssignmentEntity>("/assignments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAssignment(
  id: string,
  payload: Partial<AssignmentPayload>,
) {
  return apiFetch<AssignmentEntity>(`/assignments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateAssignmentStatus(id: string, status: AssignmentStatus) {
  return apiFetch<AssignmentEntity>(`/assignments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function duplicateAssignment(id: string) {
  return apiFetch<AssignmentListItem>(`/assignments/${id}/duplicate`, {
    method: "POST",
  });
}

export function deleteAssignment(id: string) {
  return apiFetch<void>(`/assignments/${id}`, { method: "DELETE" });
}

/**
 * The attachment is sent in a separate request, after the assignment exists.
 * If the backend ever wants the whole form in one multipart request,
 * create/update will need to move to FormData — they use JSON today.
 */
export function uploadAssignmentAttachment(id: string, file: File) {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<AssignmentAttachment>(`/assignments/${id}/attachments`, {
    method: "POST",
    body: form,
  });
}

export function deleteAssignmentAttachment(id: string, attachmentId: string) {
  return apiFetch<void>(`/assignments/${id}/attachments/${attachmentId}`, {
    method: "DELETE",
  });
}

/** Powers the course dropdown in the form. */
export async function getCourseOptions() {
  const res = await apiFetch<{ data: CourseOption[] }>("/courses");
  return res.data;
}

/* ================================================================
   Legacy API — the gradebook and grades pages were written against these.
   These return a `{ data }` envelope, while the newer endpoints above
   return a raw object. Both can coexist.
   ================================================================ */

/**
 * Legacy shapes — the gradebook and grades pages are written against these
 * (`type`, `maxScore`, `score`, `content`). Newer modules use the `@/types/assignment`
 * canonical types.
 */
export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  type?: "assignment" | "quiz" | "exam" | "project";
  dueAt?: string | null;
  maxScore: number;
  createdAt?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  content?: string | null;
  fileUrl?: string | null;
  score?: number | null;
  feedback?: string | null;
  submittedAt?: string | null;
  status?: string;
}

type AssignmentModel = Assignment;
type SubmissionModel = Submission;

/** Every assignment on a single course. */
export function listAssignmentsForCourse(courseId: string) {
  return apiFetch<ApiEnvelope<AssignmentModel[]>>(
    `/assignments?courseId=${encodeURIComponent(courseId)}`,
  );
}

/** All submissions received for one assignment (instructor view). */
export function listSubmissions(assignmentId: string) {
  return apiFetch<ApiEnvelope<SubmissionModel[]>>(
    `/assignments/${assignmentId}/submissions`,
  );
}

/** Awards marks and feedback to a submission. */
export function gradeSubmission(
  submissionId: string,
  score: number,
  feedback = "",
  passFail?: "pass" | "fail",
  hideMarks = false,
) {
  return apiFetch<ApiEnvelope<SubmissionModel>>(
    `/submissions/${submissionId}/grade`,
    {
      method: "PATCH",
      body: JSON.stringify({
        marksAwarded: score,
        score,
        feedback,
        passFail: passFail ?? undefined,
        hideMarks,
      }),
    },
  );
}


/** Awards marks and feedback to a submission. */

// export function gradeSubmission(
//   submissionId: string,
//   score: number,
//   feedback = "",
// ) {
//   return apiFetch<ApiEnvelope<SubmissionModel>>(
//     `/submissions/${submissionId}/grade`,
//     {
//       method: "PATCH",
//       body: JSON.stringify({ marksAwarded: score, feedback }),
//     },
//   );
// }

/** The signed-in student’s own grades for a single course. */
export function myGrades(courseId: string) {
  return apiFetch<ApiEnvelope<SubmissionModel[]>>(
    `/submissions/me?courseId=${encodeURIComponent(courseId)}`,
  );
}

/** Uploads a student submission (file or text). */
export function submitAssignment(assignmentId: string, form: FormData) {
  return apiFetch<ApiEnvelope<SubmissionModel>>(
    `/assignments/${assignmentId}/submissions`,
    { method: "POST", body: form },
  );
}







// import { apiFetch, type ApiEnvelope } from "./client";
// import type {
//   Assignment as AssignmentEntity,
//   AssignmentAttachment,
//   AssignmentListItem,
//   AssignmentPayload,
//   AssignmentStatus,
// } from "@/types/assignment";
// import type { CourseOption } from "@/types/course";

// export interface AssignmentListParams {
//   search?: string;
//   status?: AssignmentStatus | "all";
// }

// export function getAssignments(params: AssignmentListParams = {}) {
//   const qs = new URLSearchParams();
//   if (params.search) qs.set("search", params.search);
//   if (params.status && params.status !== "all") qs.set("status", params.status);

//   const suffix = qs.toString() ? `?${qs.toString()}` : "";
//   return apiFetch<AssignmentListItem[]>(`/assignments${suffix}`);
// }

// export function getAssignment(id: string) {
//   return apiFetch<AssignmentEntity>(`/assignments/${id}`);
// }

// export function createAssignment(payload: AssignmentPayload) {
//   return apiFetch<AssignmentEntity>("/assignments", {
//     method: "POST",
//     body: JSON.stringify(payload),
//   });
// }

// export function updateAssignment(
//   id: string,
//   payload: Partial<AssignmentPayload>,
// ) {
//   return apiFetch<AssignmentEntity>(`/assignments/${id}`, {
//     method: "PATCH",
//     body: JSON.stringify(payload),
//   });
// }

// export function updateAssignmentStatus(id: string, status: AssignmentStatus) {
//   return apiFetch<AssignmentEntity>(`/assignments/${id}/status`, {
//     method: "PATCH",
//     body: JSON.stringify({ status }),
//   });
// }

// export function duplicateAssignment(id: string) {
//   return apiFetch<AssignmentListItem>(`/assignments/${id}/duplicate`, {
//     method: "POST",
//   });
// }

// export function deleteAssignment(id: string) {
//   return apiFetch<void>(`/assignments/${id}`, { method: "DELETE" });
// }

// /**
//  * The attachment is sent in a separate request, after the assignment exists.
//  * If the backend ever wants the whole form in one multipart request,
//  * create/update will need to move to FormData — they use JSON today.
//  */
// export function uploadAssignmentAttachment(id: string, file: File) {
//   const form = new FormData();
//   form.append("file", file);

//   return apiFetch<AssignmentAttachment>(`/assignments/${id}/attachments`, {
//     method: "POST",
//     body: form,
//   });
// }

// export function deleteAssignmentAttachment(id: string, attachmentId: string) {
//   return apiFetch<void>(`/assignments/${id}/attachments/${attachmentId}`, {
//     method: "DELETE",
//   });
// }

// /** Powers the course dropdown in the form. */
// export async function getCourseOptions() {
//   const res = await apiFetch<{ data: CourseOption[] }>("/courses");
//   return res.data;
// }

// /* ================================================================
//    Legacy API — the gradebook and grades pages were written against these.
//    These return a `{ data }` envelope, while the newer endpoints above
//    return a raw object. Both can coexist.
//    ================================================================ */

// /**
//  * Legacy shapes — the gradebook and grades pages are written against these
//  * (`type`, `maxScore`, `score`, `content`). Newer modules use the `@/types/assignment`
//  * canonical types.
//  */
// export interface Assignment {
//   id: string;
//   courseId: string;
//   title: string;
//   description?: string;
//   type?: "assignment" | "quiz" | "exam" | "project";
//   dueAt?: string | null;
//   maxScore: number;
//   createdAt?: string;
// }

// export interface Submission {
//   id: string;
//   assignmentId: string;
//   studentId: string;
//   studentName?: string;
//   content?: string | null;
//   fileUrl?: string | null;
//   score?: number | null;
//   feedback?: string | null;
//   submittedAt?: string | null;
//   status?: string;
// }

// type AssignmentModel = Assignment;
// type SubmissionModel = Submission;

// /** Every assignment on a single course. */
// export function listAssignmentsForCourse(courseId: string) {
//   return apiFetch<ApiEnvelope<AssignmentModel[]>>(
//     `/assignments?courseId=${encodeURIComponent(courseId)}`,
//   );
// }

// /** All submissions received for one assignment (instructor view). */
// export function listSubmissions(assignmentId: string) {
//   return apiFetch<ApiEnvelope<SubmissionModel[]>>(
//     `/assignments/${assignmentId}/submissions`,
//   );
// }

// /** Awards marks and feedback to a submission. */
// export function gradeSubmission(
//   submissionId: string,
//   score: number,
//   feedback = "",
//   passFail?: "pass" | "fail",
// ) {
//   return apiFetch<ApiEnvelope<SubmissionModel>>(
//     `/submissions/${submissionId}/grade`,
//     {
//       method: "PATCH",
//       body: JSON.stringify({
//         marksAwarded: score,
//         score,
//         feedback,
//         passFail: passFail ?? undefined,
//       }),
//     },
//   );
// }


// /** Awards marks and feedback to a submission. */

// // export function gradeSubmission(
// //   submissionId: string,
// //   score: number,
// //   feedback = "",
// // ) {
// //   return apiFetch<ApiEnvelope<SubmissionModel>>(
// //     `/submissions/${submissionId}/grade`,
// //     {
// //       method: "PATCH",
// //       body: JSON.stringify({ marksAwarded: score, feedback }),
// //     },
// //   );
// // }

// /** The signed-in student’s own grades for a single course. */
// export function myGrades(courseId: string) {
//   return apiFetch<ApiEnvelope<SubmissionModel[]>>(
//     `/submissions/me?courseId=${encodeURIComponent(courseId)}`,
//   );
// }

// /** Uploads a student submission (file or text). */
// export function submitAssignment(assignmentId: string, form: FormData) {
//   return apiFetch<ApiEnvelope<SubmissionModel>>(
//     `/assignments/${assignmentId}/submissions`,
//     { method: "POST", body: form },
//   );
// }
