// lib/api/aiInsights.ts

import type {
  StudentGradingReport,
  GradeRow,
  GradeStatus,
} from "@/lib/api/grading";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
  // ✅ NEW: real content of the item (title/description/instructions), used
  // by the backend to generate grounded "what to study next" topics instead
  // of guessing from the course name.
  description?: string;
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
  suggested_topics: string[];
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
  suggested_topics: string[];
  attendance_pct: number | null;
}

// ---- Report -> backend payload ----

const STATUS_MAP: Record<GradeStatus, SubmissionStatus> = {
  submitted: "Submitted",
  not_graded_yet: "Submitted",
  pending: "Pending",
  not_submitted: "Not Submitted",
};

export function buildGradeDataFromReport(
  report: StudentGradingReport,
  studentEmail: string,
  courseId: string
): StudentGradeData {
  const toItems = (rows: GradeRow[]): GradedItem[] =>
    (rows ?? []).map((r) => ({
      name: r.name || "Untitled",
      total: Number(r.totalMarks ?? 0),
      obtained: Number(r.obtainedMarks ?? 0),
      status: STATUS_MAP[r.status] ?? "Not Submitted",
      remarks: r.remarks || undefined,
      // ✅ NEW: pass through the item's actual content so the AI can ground
      // suggested study topics in real assignment/quiz/exam/project content
      // instead of inferring from the course name.
      // NOTE: if `description` isn't on GradeRow yet, it needs to be added
      // wherever GradeRow / StudentGradingReport is built on the backend
      // (the grading report endpoint), pulling from the Assignment/Quiz/
      // Exam/Project document's `title` + `description` (and for quizzes,
      // optionally a short summary of question topics).
      description: (r as any).description || undefined,
    }));

  const weightageFor = (type: ComponentType) =>
    report.performance.find(
      (p) => p.component?.toLowerCase() === type.toLowerCase()
    )?.weightagePercent ?? 0;

  return {
    student_id: studentEmail,
    student_name: (report as any).studentName ?? studentEmail,
    course_id: courseId,
    course_name: report.courseTitle,
    components: [
      { type: "Assignment", weightage: weightageFor("Assignment"), items: toItems(report.assignments) },
      { type: "Quiz", weightage: weightageFor("Quiz"), items: toItems(report.quizzes) },
      { type: "Project", weightage: weightageFor("Project"), items: toItems(report.projects) },
      { type: "Exam", weightage: weightageFor("Exam"), items: toItems(report.exams) },
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
  if (!res.ok) {
    const detail = await res.text();
    console.error("generate insight failed", res.status, detail);
    throw new Error(`Failed to generate insight (${res.status})`);
  }
  return res.json();
}

export async function getInstructorInsight(
  studentId: string,
  courseId: string
): Promise<AIInsight | null> {
  const res = await fetch(
    `${BASE_URL}/api/ai-insights/instructor/${encodeURIComponent(studentId)}?course_id=${encodeURIComponent(courseId)}`
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getAdminInsights(courseId: string): Promise<AdminInsightStats | null> {
  const res = await fetch(
    `${BASE_URL}/api/ai-insights/admin?course_id=${encodeURIComponent(courseId)}`
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getCourseInsightsList(courseId: string): Promise<AIInsight[]> {
  const res = await fetch(
    `${BASE_URL}/api/ai-insights/course/${encodeURIComponent(courseId)}/list`
  );
  if (!res.ok) return [];
  return res.json();
}

export async function getStudentInsight(
  courseId: string,
  studentId: string
): Promise<StudentInsightView | null> {
  const res = await fetch(
    `${BASE_URL}/api/ai-insights/student?course_id=${encodeURIComponent(courseId)}&student_id=${encodeURIComponent(studentId)}`,
    { credentials: "include" }
  );
  if (!res.ok) return null;
  return res.json();
}


// ---- Dashboard aggregation ----

export async function getAggregatedRiskSummary(
  courseIds: string[]
): Promise<{ highRisk: number; needsAttention: number; safe: number }> {
  if (courseIds.length === 0) {
    return { highRisk: 0, needsAttention: 0, safe: 0 };
  }

  const results = await Promise.all(
    courseIds.map((id) => getAdminInsights(id).catch(() => null))
  );

  let highRisk = 0;
  let needsAttention = 0;
  let safe = 0;

  results.forEach((stats) => {
    if (!stats) return;
    highRisk += stats.risk_counts.failure_risk ?? 0;
    needsAttention += (stats.risk_counts.at_risk ?? 0) + (stats.risk_counts.incomplete_data ?? 0);
    safe += (stats.risk_counts.top ?? 0) + (stats.risk_counts.on_track ?? 0);
  });

  return { highRisk, needsAttention, safe };
}