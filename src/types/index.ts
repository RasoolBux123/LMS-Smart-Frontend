// Assignment and Course types now live in their own files.
// This index still re-exports them so existing `@/types` imports keep working.
export * from "./course";
export * from "./assignment";

import type {
  AssignmentAttachment,
  AssignmentStatus,
  FileKind,
  Submission,
  SubmissionStatus,
} from "./assignment";

export type Role = "admin" | "instructor" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  title?: string;
  rollNumber?: string;
  department?: string;
}

export type CourseworkKind = "assignment" | "quiz" | "exam" | "project";

export type CourseworkStatus = AssignmentStatus;

export type AssignmentStatusMeta = CourseworkStatus;

export type CourseworkAttachment = AssignmentAttachment;

export interface Coursework {
  id: string;
  kind: CourseworkKind;
  title: string;
  description: string;
  objectives: string[];
  instructions: string;
  courseId: string;
  instructorId: string;
  createdAt: string;
  deadline: string;
  totalMarks: number;
  allowedFileTypes: FileKind[];
  maxFileSizeMb: number;
  resubmissionAllowed: boolean;
  maxAttempts: number;
  attachments: CourseworkAttachment[];
  status: CourseworkStatus;
}

export type CourseworkSeed = Omit<Coursework, "kind">;

export type NotificationKind = "deadline" | "grade" | "submission" | "system";

export interface Notification {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  createdAt: string;
  read: boolean;
  link?: string | null;
  courseworkId?: string;
  courseworkKind?: string;
  courseId?: string;
}

// export type NotificationKind = "deadline" | "grade" | "submission" | "system";

// export interface Notification {
//   id: string;
//   title: string;
//   body: string;
//   kind: NotificationKind;
//   createdAt: string;
//   read: boolean;
// }

export interface DerivedCourseworkRow extends Coursework {
  courseTitle: string;
  courseCode: string;
  instructorName: string;
  submission: Submission | null;
  studentStatus: SubmissionStatus;
}

export type DerivedAssignmentRow = DerivedCourseworkRow;
