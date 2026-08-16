import type { Coursework, CourseworkSeed } from "@/types";

/** Assignments — populate from your API. */
const seed: CourseworkSeed[] = [];

export const assignments: Coursework[] = seed.map((item) => ({
  ...item,
  kind: "assignment",
}));

export function findAssignment(id: string) {
  return assignments.find((item) => item.id === id);
}
