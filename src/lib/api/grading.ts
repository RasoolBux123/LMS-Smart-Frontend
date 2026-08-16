import { apiFetch, type ApiEnvelope } from "./client";

export type GradeStatus = "submitted" | "pending" | "not_submitted" | "not_graded_yet";

export interface GradeRow {
    id: string;
    name: string;
    totalMarks: number;
    obtainedMarks: number | null;
    remarks: string;
    status: GradeStatus;
    submissionId?: string | null;
    marksHidden?: boolean;
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

export async function getStudentGrading(email: string, courseId: string) {
    return apiFetch<ApiEnvelope<StudentGradingReport>>(
        `/grading/student/${email}?courseId=${courseId}`,
    );
}

export async function getCourseStudentsForGrading(courseId: string) {
    const { listCourseEnrollments } = await import("./enrollments");
    return listCourseEnrollments(courseId);
}





// import { apiFetch, type ApiEnvelope } from "./client";

// export type GradeStatus = "submitted" | "pending" | "not_submitted";

// export interface GradeRow {
//     id: string;
//     name: string;
//     totalMarks: number;
//     obtainedMarks: number | null;
//     remarks: string;
//     status: GradeStatus;
// }

// export interface PerformanceComponent {
//     component: string;
//     weightagePercent: number;
//     totalMarks: number;
//     obtainedMarks: number;
//     weightedScorePercent: number;
// }

// export interface StudentGradingReport {
//     courseId: string;
//     courseTitle: string;
//     instructorName: string;
//     assignments: GradeRow[];
//     quizzes: GradeRow[];
//     projects: GradeRow[];
//     exams: GradeRow[];
//     performance: PerformanceComponent[];
//     totalWeightagePercent: number;
//     totalMarks: number;
//     totalObtainedMarks: number;
//     overallWeightedScorePercent: number;
// }

// export async function getStudentGrading(email: string, courseId: string) {
//     return apiFetch<ApiEnvelope<StudentGradingReport>>(
//         `/grading/student/${email}?courseId=${courseId}`,
//     );
// }

// export async function getCourseStudentsForGrading(courseId: string) {
//     const { listCourseEnrollments } = await import("./enrollments");
//     return listCourseEnrollments(courseId);
// }
