export interface Course {
  id: string;
  code: string;
  title: string;
  instructorId: string;
  color: string;
  studentIds: string[];
}

/** Trimmed shape for course dropdowns — enough for the list endpoint to return. */
export type CourseOption = Pick<Course, "id" | "code" | "title"> & {
  instructorName?: string;
};