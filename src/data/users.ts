import type { User } from "@/types";

/**
 * Placeholder identities for the two roles. There is no auth layer yet, so the
 * app needs *something* to render in the navbar and profile page.
 * Replace these with the signed-in user once a backend exists.
 */
export const instructor: User = {
  id: "instructor",
  name: "Instructor",
  email: "",
  role: "instructor",
  avatarColor: "#4338CA",
  title: "",
  department: "",
};

export const currentStudent: User = {
  id: "student",
  name: "Student",
  email: "",
  role: "student",
  avatarColor: "#0D9488",
  rollNumber: "",
};

/** Enrolled students — populate from your API. */
export const students: User[] = [];

export function findUser(id: string): User | undefined {
  if (id === instructor.id) return instructor;
  if (id === currentStudent.id) return currentStudent;
  return students.find((s) => s.id === id);
}
