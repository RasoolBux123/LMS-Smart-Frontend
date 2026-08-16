import type { Coursework, CourseworkSeed } from "@/types";

/** Projects — populate from your API. */
const seed: CourseworkSeed[] = [];

export const projects: Coursework[] = seed.map((item) => ({
  ...item,
  kind: "project",
}));

export function findProject(id: string) {
  return projects.find((item) => item.id === id);
}
