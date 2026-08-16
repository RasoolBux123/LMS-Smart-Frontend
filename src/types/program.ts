/**
 * A Program is a degree / diploma track (e.g. "Web Development",
 * "Artificial Intelligence") that groups a set of courses together.
 * Hierarchy: Program -> Course -> Module -> Material.
 */
export type ProgramLevel =
  | "certificate"
  | "diploma"
  | "undergraduate"
  | "graduate";

export type ProgramStatus = "active" | "draft" | "archived";

export interface Program {
  id: string;
  /** Short unique code shown in tables and badges, e.g. "WEB", "AI". */
  code: string;
  title: string;
  description: string;
  level: ProgramLevel;
  status: ProgramStatus;
  /** Total duration in months. */
  durationMonths: number;
  /** Total credit hours across all courses. */
  totalCredits: number;
  /** Name of the person accountable for the program. */
  coordinator?: string;
  /** Company / Institute running this program (e.g. "Mari Energies", "FFC", "OGDCL"). */
  company?: string;
  /** Course ids that belong to this program. */
  courseIds: string[];
  /** Denormalised counts sent by the API so lists avoid an N+1 fetch. */
  courseCount?: number;
  studentCount?: number;
  /** Hex accent used for the card header. Falls back to the theme primary. */
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgramPayload {
  code: string;
  title: string;
  description: string;
  level: ProgramLevel;
  status: ProgramStatus;
  durationMonths: number;
  totalCredits: number;
  coordinator?: string;
  /** Company / Institute running this program. */
  company?: string;
  courseIds?: string[];
  color?: string;
}

export const PROGRAM_LEVELS: { value: ProgramLevel; label: string }[] = [
  { value: "certificate", label: "Certificate" },
  { value: "diploma", label: "Diploma" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" },
];

export const PROGRAM_STATUSES: { value: ProgramStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export const PROGRAM_LEVEL_LABEL: Record<ProgramLevel, string> = {
  certificate: "Certificate",
  diploma: "Diploma",
  undergraduate: "Undergraduate",
  graduate: "Graduate",
};










// /**
//  * A Program is a degree / diploma track (e.g. "Web Development",
//  * "Artificial Intelligence") that groups a set of courses together.
//  * Hierarchy: Program -> Course -> Module -> Material.
//  */
// export type ProgramLevel =
//   | "certificate"
//   | "diploma"
//   | "undergraduate"
//   | "graduate";

// export type ProgramStatus = "active" | "draft" | "archived";

// export interface Program {
//   id: string;
//   /** Short unique code shown in tables and badges, e.g. "WEB", "AI". */
//   code: string;
//   title: string;
//   description: string;
//   level: ProgramLevel;
//   status: ProgramStatus;
//   /** Total duration in months. */
//   durationMonths: number;
//   /** Total credit hours across all courses. */
//   totalCredits: number;
//   /** Name of the person accountable for the program. */
//   coordinator?: string;
//   /** Course ids that belong to this program. */
//   courseIds: string[];
//   /** Denormalised counts sent by the API so lists avoid an N+1 fetch. */
//   courseCount?: number;
//   studentCount?: number;
//   /** Hex accent used for the card header. Falls back to the theme primary. */
//   color?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface ProgramPayload {
//   code: string;
//   title: string;
//   description: string;
//   level: ProgramLevel;
//   status: ProgramStatus;
//   durationMonths: number;
//   totalCredits: number;
//   coordinator?: string;
//   courseIds?: string[];
//   color?: string;
// }

// export const PROGRAM_LEVELS: { value: ProgramLevel; label: string }[] = [
//   { value: "certificate", label: "Certificate" },
//   { value: "diploma", label: "Diploma" },
//   { value: "undergraduate", label: "Undergraduate" },
//   { value: "graduate", label: "Graduate" },
// ];

// export const PROGRAM_STATUSES: { value: ProgramStatus; label: string }[] = [
//   { value: "active", label: "Active" },
//   { value: "draft", label: "Draft" },
//   { value: "archived", label: "Archived" },
// ];

// export const PROGRAM_LEVEL_LABEL: Record<ProgramLevel, string> = {
//   certificate: "Certificate",
//   diploma: "Diploma",
//   undergraduate: "Undergraduate",
//   graduate: "Graduate",
// };
