import type { Course } from "@/types";

/** Courses — populate from your API. */
export const courses: Course[] = [];

export function findCourse(id: string) {
  return courses.find((c) => c.id === id);
}
