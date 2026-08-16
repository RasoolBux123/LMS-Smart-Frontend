import type { CourseOption } from "./course";

export type AssignmentStatus = "draft" | "published" | "archived";

export type FileKind = "pdf" | "docx" | "image" | "zip" | "other";

export interface AssignmentAttachment {
  id: string;
  name: string;
  kind: FileKind;
  size: number;
  /** Supplied by the API — the download link. */
  url?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  instructions: string;
  courseId: string;
  instructorId: string;
  createdAt: string;
  /** ISO string */
  deadline: string;
  totalMarks: number;
  allowedFileTypes: FileKind[];
  maxFileSizeMb: number;
  resubmissionAllowed: boolean;
  maxAttempts: number;
  attachments: AssignmentAttachment[];
  status: AssignmentStatus;
}

/** A list-page row: the backend joins the course and counts before sending. */
export interface AssignmentListItem extends Assignment {
  course: CourseOption;
  enrolled: number;
  submittedCount: number;
  gradedCount: number;
}

/**
 * Request body sent on create/update.
 *
 * `instructorId` is included as optional: the backend route has no auth
 * middleware yet, so it cannot derive the owner from a token itself — the
 * client has to pass it explicitly, or every quiz saves with no owner and
 * never appears back in the instructor's own list.
 *
 * TODO: once the create/update routes read the instructor from an auth
 * token, remove this field again and go back to omitting it entirely.
 */
export type AssignmentPayload = Omit<
  Assignment,
  "id" | "createdAt" | "instructorId" | "attachments"
> & {
  instructorId?: string;
};

export type SubmissionStatus =
  | "submitted"
  | "pending"
  | "late"
  | "draft"
  | "graded";

export type SubmissionFile = AssignmentAttachment;

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  files: SubmissionFile[];
  attemptNumber: number;
  marksAwarded: number | null;
  feedback: string | null;
  passFail: "pass" | "fail" | null;
  /** When true, student sees "Not graded yet" */
  marksHidden?: boolean;
}



// import type { CourseOption } from "./course";

// export type AssignmentStatus = "draft" | "published" | "archived";

// export type FileKind = "pdf" | "docx" | "image" | "zip" | "other";

// export interface AssignmentAttachment {
//   id: string;
//   name: string;
//   kind: FileKind;
//   size: number;
//   /** Supplied by the API — the download link. */
//   url?: string;
// }

// export interface Assignment {
//   id: string;
//   title: string;
//   description: string;
//   objectives: string[];
//   instructions: string;
//   courseId: string;
//   instructorId: string;
//   createdAt: string;
//   /** ISO string */
//   deadline: string;
//   totalMarks: number;
//   allowedFileTypes: FileKind[];
//   maxFileSizeMb: number;
//   resubmissionAllowed: boolean;
//   maxAttempts: number;
//   attachments: AssignmentAttachment[];
//   status: AssignmentStatus;
// }

// /** A list-page row: the backend joins the course and counts before sending. */
// export interface AssignmentListItem extends Assignment {
//   course: CourseOption;
//   enrolled: number;
//   submittedCount: number;
//   gradedCount: number;
// }

// /**
//  * Request body sent on create/update.
//  *
//  * `instructorId` is included as optional: the backend route has no auth
//  * middleware yet, so it cannot derive the owner from a token itself — the
//  * client has to pass it explicitly, or every quiz saves with no owner and
//  * never appears back in the instructor's own list.
//  *
//  * TODO: once the create/update routes read the instructor from an auth
//  * token, remove this field again and go back to omitting it entirely.
//  */
// export type AssignmentPayload = Omit<
//   Assignment,
//   "id" | "createdAt" | "instructorId" | "attachments"
// > & {
//   instructorId?: string;
// };

// export type SubmissionStatus =
//   | "submitted"
//   | "pending"
//   | "late"
//   | "draft"
//   | "graded";

// export type SubmissionFile = AssignmentAttachment;

// export interface Submission {
//   id: string;
//   assignmentId: string;
//   studentId: string;
//   status: SubmissionStatus;
//   submittedAt: string | null;
//   files: SubmissionFile[];
//   attemptNumber: number;
//   marksAwarded: number | null;
//   feedback: string | null;
//   passFail: "pass" | "fail" | null;
// }



