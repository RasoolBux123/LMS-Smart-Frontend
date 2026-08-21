import { apiFetch, type ApiEnvelope } from "./client";

export type GradeStatus =
  | "submitted"
  | "pending"
  | "not_submitted"
  | "not_graded_yet";

export interface GradeRow {
  id: string;
  name: string;
  totalMarks: number;
  obtainedMarks: number | null;
  remarks: string;
  status: GradeStatus;
  submissionId?: string | null;
  marksHidden?: boolean;
  // ✅ NEW: the item's actual content (title/description/instructions).
  // Needed so AI Insights can generate real "what to study next" topics
  // grounded in what the assignment/quiz/exam/project actually covered,
  // instead of guessing from the course name.
  description?: string;
}

export interface PerformanceComponent {
  component: string;
  weightagePercent: number;
  totalMarks: number;
  obtainedMarks: number;
  weightedScorePercent: number;
}

export interface StudentGradingReport {
  courseId: string;
  courseTitle: string;
  instructorName: string;
  assignments: GradeRow[];
  quizzes: GradeRow[];
  projects: GradeRow[];
  exams: GradeRow[];
  performance: PerformanceComponent[];
  totalWeightagePercent: number;
  totalMarks: number;
  totalObtainedMarks: number;
  overallWeightedScorePercent: number;
}

export type CourseWeights = {
  Assignment: number;
  Quiz: number;
  Project: number;
  Exam: number;
};

export async function getStudentGrading(email: string, courseId: string) {
  return apiFetch<ApiEnvelope<StudentGradingReport>>(
    `/grading/student/${encodeURIComponent(email)}?courseId=${courseId}`,
  );
}

export async function getCourseWeights(courseId: string) {
  return apiFetch<ApiEnvelope<CourseWeights>>(
    `/grading/weights/${courseId}`,
  );
}

export async function setCourseWeights(
  courseId: string,
  weights: CourseWeights,
) {
  return apiFetch<ApiEnvelope<CourseWeights>>(
    `/grading/weights/${courseId}`,
    {
      method: "PUT",
      body: JSON.stringify(weights),
    },
  );
}

export async function getCourseStudentsForGrading(courseId: string) {
  const { listCourseEnrollments } = await import("./enrollments");
  return listCourseEnrollments(courseId);
}
