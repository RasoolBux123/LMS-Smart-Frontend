import type { Coursework, CourseworkKind } from "@/types";
import { assignments } from "./assignments";
import { quizzes } from "./quizzes";
import { exams } from "./exams";
import { projects } from "./projects";

export const coursework: Coursework[] = [
  ...assignments,
  ...quizzes,
  ...exams,
  ...projects,
];

export function courseworkOfKind(kind: CourseworkKind) {
  return coursework.filter((item) => item.kind === kind);
}

export function findCoursework(id: string) {
  return coursework.find((item) => item.id === id);
}
