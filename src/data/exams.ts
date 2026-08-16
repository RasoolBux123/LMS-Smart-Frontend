import type { Coursework, CourseworkSeed } from "@/types";

/** Exams — populate from your API. */
const seed: CourseworkSeed[] = [];

export const exams: Coursework[] = seed.map((item) => ({
  ...item,
  kind: "exam",
}));

export function findExam(id: string) {
  return exams.find((item) => item.id === id);
}
