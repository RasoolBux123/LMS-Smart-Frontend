// lib/aiInsights.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ---- Types matching backend schemas ----
export type ComponentType = "Assignment" | "Quiz" | "Project" | "Exam";
export type SubmissionStatus = "Submitted" | "Pending" | "Not Submitted";
export type RiskCategory = "top" | "on_track" | "at_risk" | "failure_risk" | "incomplete_data";

export interface GradedItem {
  name: string;
  total: number;
  obtained: number;
  status: SubmissionStatus;
  remarks?: string;
}

export interface ComponentSummary {
  type: ComponentType;
  weightage: number;
  items: GradedItem[];
}

export interface AttendanceSummary {
  total_classes: number;
  attended: number;
  late?: number;
  absent?: number;
  recent_trend?: ("Present" | "Absent" | "Late")[];
}

export interface StudentGradeData {
  student_id: string;
  student_name: string;
  course_id: string;
  course_name: string;
  components: ComponentSummary[];
  attendance?: AttendanceSummary;
}

export interface AIInsight {
  student_id: string;
  course_id: string;
  risk_category: RiskCategory;
  instructor_insight: string;
  student_message: string;
  focus_topic: string | null;
  attendance_pct: number | null;
  generated_at: string;
}

export interface AdminInsightStats {
  course_id: string;
  total_students: number;
  risk_counts: Record<RiskCategory, number>;
  risk_percentages: Record<RiskCategory, number>;
}

export interface StudentInsightView {
  student_message: string;
  focus_topic: string | null;
  suggested_topics: string[];   // ✅ new
  attendance_pct: number | null;
}

// add to src/lib/api/aiInsights.ts

import type { StudentGradingReport } from "@/lib/api/grading";


// add to src/lib/api/aiInsights.ts

export async function getCourseInsightsList(courseId: string): Promise<AIInsight[]> {
  const res = await fetch(`${BASE_URL}/api/ai-insights/course/${encodeURIComponent(courseId)}/list`);
  if (!res.ok) return [];
  return res.json();
}
export function buildGradeDataFromReport(
  report: StudentGradingReport,
  studentEmail: string,
  courseId: string
): StudentGradeData {
  const toItems = (rows: any[]): GradedItem[] =>
    (rows ?? []).map((r) => ({
      name: r.name ?? r.title ?? "Untitled",
      total: r.totalMarks ?? r.total ?? 0,
      obtained: r.obtainedMarks ?? r.obtained ?? 0,
      status: r.status ?? "Not Submitted",
      remarks: r.remarks ?? undefined,
    }));

  const weightageFor = (type: ComponentType) =>
    report.performance.find((p) => p.component === type)?.weightagePercent ?? 0;

  return {
    student_id: studentEmail,
    student_name: (report as any).studentName ?? studentEmail,
    course_id: courseId,
    course_name: report.courseTitle,
    components: [
      { type: "Assignment", weightage: weightageFor("Assignment" as ComponentType), items: toItems(report.assignments) },
      { type: "Quiz", weightage: weightageFor("Quiz" as ComponentType), items: toItems(report.quizzes) },
      { type: "Project", weightage: weightageFor("Project" as ComponentType), items: toItems(report.projects) },
      { type: "Exam", weightage: weightageFor("Exam" as ComponentType), items: toItems(report.exams) },
    ],
  };
}

// ---- API calls ----

export async function triggerInsightGeneration(data: StudentGradeData) {
  const res = await fetch(`${BASE_URL}/api/ai-insights/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to generate insight");
  return res.json();
}

export async function getInstructorInsight(
  studentId: string,
  courseId: string
): Promise<AIInsight | null> {
  const res = await fetch(
    `${BASE_URL}/api/ai-insights/instructor/${studentId}?course_id=${courseId}`
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getAdminInsights(courseId: string): Promise<AdminInsightStats | null> {
  const res = await fetch(`${BASE_URL}/api/ai-insights/admin?course_id=${courseId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getStudentInsight(courseId: string, studentId: string) {
  const res = await fetch(
    `${BASE_URL}/api/ai-insights/student?course_id=${courseId}&student_id=${studentId}`,
    { credentials: "include" }
  );
  if (!res.ok) return null;
  return res.json();
}