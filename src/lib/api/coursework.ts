import { apiFetch, type ApiEnvelope } from "./client";
import type {
  Assignment,
  AssignmentListItem,
  AssignmentPayload,
  AssignmentAttachment,
  AssignmentStatus,
} from "@/types/assignment";

/**
 * Quizzes, exams and projects share the assignment shape and lifecycle, so
 * they share one client too. The backend mirrors this — see
 * `backend/coursework.py`, which builds all four routers from one factory.
 */
export type CourseworkKind = "assignments" | "quizzes" | "exams" | "projects";

export type Coursework = Assignment;
export type CourseworkListItem = AssignmentListItem;
export type CourseworkPayload = AssignmentPayload;

export interface ListCourseworkParams {
  search?: string;
  status?: AssignmentStatus | "all";
  courseId?: string;
  instructorId?: string;
  studentId?: string;
}

/** Builds a typed client bound to one coursework kind. */
export function courseworkApi(kind: CourseworkKind) {
  const base = `/${kind}`;

  return {
    list(params: ListCourseworkParams = {}) {
      const qs = new URLSearchParams();
      if (params.search) qs.set("search", params.search);
      if (params.status && params.status !== "all") {
        qs.set("status", params.status);
      }
      if (params.courseId) qs.set("courseId", params.courseId);
      if (params.instructorId) qs.set("instructorId", params.instructorId);
      if (params.studentId) qs.set("studentId", params.studentId);

      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return apiFetch<CourseworkListItem[]>(`${base}${suffix}`);
    },

    get(id: string) {
      // The detail endpoint decorates the row (joined course + counts),
      // same as list — so it returns a list item, not a bare Coursework.
      return apiFetch<CourseworkListItem>(`${base}/${id}`);
    },

    create(payload: CourseworkPayload) {
      return apiFetch<Coursework>(base, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    update(id: string, payload: Partial<CourseworkPayload>) {
      return apiFetch<Coursework>(`${base}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    updateStatus(id: string, status: AssignmentStatus) {
      return apiFetch<Coursework>(`${base}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },

    duplicate(id: string) {
      return apiFetch<CourseworkListItem>(`${base}/${id}/duplicate`, {
        method: "POST",
      });
    },

    remove(id: string) {
      return apiFetch<ApiEnvelope<null>>(`${base}/${id}`, { method: "DELETE" });
    },

    uploadAttachment(id: string, file: File) {
      const form = new FormData();
      form.append("file", file);

      // Content-Type is deliberately not set — the browser adds the
      // multipart boundary itself.
      return apiFetch<AssignmentAttachment>(`${base}/${id}/attachments`, {
        method: "POST",
        body: form,
      });
    },

    deleteAttachment(id: string, attachmentId: string) {
      return apiFetch<ApiEnvelope<null>>(
        `${base}/${id}/attachments/${attachmentId}`,
        { method: "DELETE" },
      );
    },

    listSubmissions(id: string) {
      return apiFetch<ApiEnvelope<unknown[]>>(`${base}/${id}/submissions`);
    },

    /** Unhide marks for all students on this item */
    releaseMarks(id: string) {
      return apiFetch<ApiEnvelope<{ updated: number }>>(
        `${base}/${id}/submissions/release-marks`,
        { method: "POST" },
      );
    },
  };
}

export const assignmentsApi = courseworkApi("assignments");
export const quizzesApi = courseworkApi("quizzes");
export const examsApi = courseworkApi("exams");
export const projectsApi = courseworkApi("projects");




// import { apiFetch, type ApiEnvelope } from "./client";
// import type {
//   Assignment,
//   AssignmentListItem,
//   AssignmentPayload,
//   AssignmentAttachment,
//   AssignmentStatus,
// } from "@/types/assignment";

// /**
//  * Quizzes, exams and projects share the assignment shape and lifecycle, so
//  * they share one client too. The backend mirrors this — see
//  * `backend/coursework.py`, which builds all four routers from one factory.
//  */
// export type CourseworkKind = "assignments" | "quizzes" | "exams" | "projects";

// export type Coursework = Assignment;
// export type CourseworkListItem = AssignmentListItem;
// export type CourseworkPayload = AssignmentPayload;

// export interface ListCourseworkParams {
//   search?: string;
//   status?: AssignmentStatus | "all";
//   courseId?: string;
//   instructorId?: string;
//   studentId?: string;
// }

// /** Builds a typed client bound to one coursework kind. */
// export function courseworkApi(kind: CourseworkKind) {
//   const base = `/${kind}`;

//   return {
//     list(params: ListCourseworkParams = {}) {
//       const qs = new URLSearchParams();
//       if (params.search) qs.set("search", params.search);
//       if (params.status && params.status !== "all") {
//         qs.set("status", params.status);
//       }
//       if (params.courseId) qs.set("courseId", params.courseId);
//       if (params.instructorId) qs.set("instructorId", params.instructorId);
//       if (params.studentId) qs.set("studentId", params.studentId);

//       const suffix = qs.toString() ? `?${qs.toString()}` : "";
//       return apiFetch<CourseworkListItem[]>(`${base}${suffix}`);
//     },

//     get(id: string) {
//       // The detail endpoint decorates the row (joined course + counts),
//       // same as list — so it returns a list item, not a bare Coursework.
//       return apiFetch<CourseworkListItem>(`${base}/${id}`);
//     },

//     create(payload: CourseworkPayload) {
//       return apiFetch<Coursework>(base, {
//         method: "POST",
//         body: JSON.stringify(payload),
//       });
//     },

//     update(id: string, payload: Partial<CourseworkPayload>) {
//       return apiFetch<Coursework>(`${base}/${id}`, {
//         method: "PATCH",
//         body: JSON.stringify(payload),
//       });
//     },

//     updateStatus(id: string, status: AssignmentStatus) {
//       return apiFetch<Coursework>(`${base}/${id}/status`, {
//         method: "PATCH",
//         body: JSON.stringify({ status }),
//       });
//     },

//     duplicate(id: string) {
//       return apiFetch<CourseworkListItem>(`${base}/${id}/duplicate`, {
//         method: "POST",
//       });
//     },

//     remove(id: string) {
//       return apiFetch<ApiEnvelope<null>>(`${base}/${id}`, { method: "DELETE" });
//     },

//     uploadAttachment(id: string, file: File) {
//       const form = new FormData();
//       form.append("file", file);

//       // Content-Type is deliberately not set — the browser adds the
//       // multipart boundary itself.
//       return apiFetch<AssignmentAttachment>(`${base}/${id}/attachments`, {
//         method: "POST",
//         body: form,
//       });
//     },

//     deleteAttachment(id: string, attachmentId: string) {
//       return apiFetch<ApiEnvelope<null>>(
//         `${base}/${id}/attachments/${attachmentId}`,
//         { method: "DELETE" },
//       );
//     },

//     listSubmissions(id: string) {
//       return apiFetch<ApiEnvelope<unknown[]>>(`${base}/${id}/submissions`);
//     },
//   };
// }

// export const assignmentsApi = courseworkApi("assignments");
// export const quizzesApi = courseworkApi("quizzes");
// export const examsApi = courseworkApi("exams");
// export const projectsApi = courseworkApi("projects");