import { assignments } from "@/data/assignments";
import { courseworkOfKind } from "@/data/coursework";
import { courses, findCourse } from "@/data/courses";
import { instructor, findUser } from "@/data/users";
import { submissionFor, submissionsFor, submissions } from "@/data/submissions";
import type {
  CourseworkKind,
  DerivedCourseworkRow,
  SubmissionStatus,
} from "@/types";

export function deriveStudentStatus(
  deadline: string,
  submission: ReturnType<typeof submissionFor>,
): SubmissionStatus {
  if (submission && submission.status !== "pending") {
    return submission.status;
  }

  const overdue = new Date(deadline).getTime() < Date.now();

  return overdue ? "late" : "pending";
}

function enrolledCourseIds(studentId: string) {
  return new Set(
    courses.filter((c) => c.studentIds.includes(studentId)).map((c) => c.id),
  );
}

/** Every published item of one kind that a student can see, joined with course, instructor and submission info. */
export function courseworkForStudent(
  studentId: string,
  kind: CourseworkKind,
): DerivedCourseworkRow[] {
  const enrolled = enrolledCourseIds(studentId);

  return courseworkOfKind(kind)
    .filter(
      (item) => item.status === "published" && enrolled.has(item.courseId),
    )
    .map((item) => {
      const course = findCourse(item.courseId)!;
      const submission = submissionFor(item.id, studentId);

      return {
        ...item,
        courseTitle: course.title,
        courseCode: course.code,
        instructorName: instructor.name,
        submission,
        studentStatus: deriveStudentStatus(item.deadline, submission),
      };
    })
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    );
}

export function studentCourseworkDetail(
  studentId: string,
  kind: CourseworkKind,
  id: string,
) {
  return courseworkForStudent(studentId, kind).find((r) => r.id === id) ?? null;
}

/** Everything a student has across all four kinds, sorted by deadline. */
export function allCourseworkForStudent(
  studentId: string,
): DerivedCourseworkRow[] {
  const kinds: CourseworkKind[] = ["assignment", "quiz", "exam", "project"];

  return kinds
    .flatMap((kind) => courseworkForStudent(studentId, kind))
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    );
}

export function assignmentsForStudent(studentId: string) {
  return courseworkForStudent(studentId, "assignment");
}

export function studentAssignmentDetail(studentId: string, id: string) {
  return studentCourseworkDetail(studentId, "assignment", id);
}

export function studentStats(studentId: string) {
  const rows = allCourseworkForStudent(studentId);

  const total = rows.length;

  const submitted = rows.filter(
    (r) => r.studentStatus === "submitted" || r.studentStatus === "graded",
  ).length;

  const pending = rows.filter((r) => r.studentStatus === "pending").length;

  const late = rows.filter((r) => r.studentStatus === "late").length;

  const upcoming = rows.filter((r) => {
    const diff = new Date(r.deadline).getTime() - Date.now();
    return (
      diff > 0 &&
      diff < 1000 * 60 * 60 * 24 * 7 &&
      r.studentStatus === "pending"
    );
  });

  return { total, submitted, pending, late, upcoming };
}

/** All assignments an instructor owns, with course and submission counts. */
export function assignmentsForInstructor(instructorId: string) {
  return assignments
    .filter((a) => a.instructorId === instructorId)
    .map((a) => {
      const course = findCourse(a.courseId)!;
      const subs = submissionsFor(a.id);

      const enrolled = course.studentIds.length;

      const submittedCount = subs.filter(
        (s) => s.status !== "pending" && s.status !== "draft",
      ).length;

      const gradedCount = subs.filter((s) => s.marksAwarded !== null).length;

      const lateCount = subs.filter((s) => s.status === "late").length;

      return { ...a, course, enrolled, submittedCount, gradedCount, lateCount };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function instructorStats(instructorId: string) {
  const rows = assignmentsForInstructor(instructorId);

  const totalAssignments = rows.length;

  const published = rows.filter((r) => r.status === "published").length;

  const pendingReview = rows.reduce(
    (acc, r) => acc + (r.submittedCount - r.gradedCount),
    0,
  );

  const lateSubmissions = rows.reduce((acc, r) => acc + r.lateCount, 0);

  const totalStudents = new Set(rows.flatMap((r) => r.course.studentIds)).size;

  return {
    totalAssignments,
    published,
    pendingReview,
    lateSubmissions,
    totalStudents,
  };
}

export function submissionRowsForAssignment(assignmentId: string) {
  const assignment = assignments.find((a) => a.id === assignmentId);

  if (!assignment) return [];

  const course = findCourse(assignment.courseId)!;

  return course.studentIds.map((studentId) => {
    const student = findUser(studentId)!;
    const submission = submissionFor(assignmentId, studentId);

    return {
      student,
      submission,
      status: deriveStudentStatus(assignment.deadline, submission),
    };
  });
}

/** Submissions grouped into the last 6 weeks, for the dashboard bar chart. */
export function weeklySubmissionTrend() {
  if (submissions.length === 0) return [];

  const weekMs = 1000 * 60 * 60 * 24 * 7;
  const now = Date.now();

  return Array.from({ length: 6 }, (_, i) => {
    const weeksAgo = 5 - i;
    const start = now - (weeksAgo + 1) * weekMs;
    const end = now - weeksAgo * weekMs;

    const inWeek = submissions.filter((s) => {
      if (!s.submittedAt) return false;
      const at = new Date(s.submittedAt).getTime();
      return at >= start && at < end;
    });

    return {
      week: `Wk ${i + 1}`,
      submitted: inWeek.filter((s) => s.status !== "late").length,
      late: inWeek.filter((s) => s.status === "late").length,
    };
  });
}

/** Submission counts per status, for the dashboard donut chart. */
export function submissionStatusBreakdown() {
  const count = (status: SubmissionStatus) =>
    submissions.filter((s) => s.status === status).length;

  return [
    { name: "Graded", value: count("graded"), color: "var(--info)" },
    { name: "Submitted", value: count("submitted"), color: "var(--success)" },
    { name: "Pending", value: count("pending"), color: "var(--warning)" },
    { name: "Late", value: count("late"), color: "var(--danger)" },
  ];
}
