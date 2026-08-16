import type { Coursework, CourseworkSeed } from "@/types";

/** Quizzes — populate from your API. */
const seed: CourseworkSeed[] = [];

export const quizzes: Coursework[] = seed.map((item) => ({
  ...item,
  kind: "quiz",
}));

export function findQuiz(id: string) {
  return quizzes.find((item) => item.id === id);
}
