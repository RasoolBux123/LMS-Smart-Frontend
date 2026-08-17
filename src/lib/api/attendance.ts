import { apiFetch, type ApiEnvelope } from "./client";

export type AttendanceStatus = "present" | "absent" | "leave";

export interface AttendanceRecord {
    studentId: string;
    studentEmail?: string;
    studentName?: string;
    status: AttendanceStatus;
}

export interface AttendanceSession {
    id: string;
    courseId: string;
    date: string;
    records: AttendanceRecord[];
}

export interface StudentAttendanceSummary {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    percentage: number;
    history: {
        date: string;
        courseId: string;
        status: AttendanceStatus;
    }[];
}

/** Instructor/Admin: mark attendance */
export async function markAttendance(payload: {
    courseId: string;
    date: string;
    attendance: { studentId: string; status: AttendanceStatus }[];
}) {
    return apiFetch<{ success: boolean; message: string }>("/attendance", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/** Instructor/Admin: all attendance for a course */
export async function getCourseAttendance(courseId: string) {
    return apiFetch<ApiEnvelope<any[]>>(`/attendance/course/${courseId}`);
}

/** Student: own attendance (correct endpoint) */
export async function getMyAttendance() {
    return apiFetch<ApiEnvelope<any[]>>("/attendance/my");
}

/** Instructor/Admin: one student by ID */
export async function getStudentAttendanceById(studentId: string) {
    return apiFetch<ApiEnvelope<any[]>>(`/attendance/student/${studentId}`);
}

/**
 * Legacy helper — student page ab bhi isko import karti hai.
 * Student ke liye /attendance/my use hota hai.
 * Agar email pass ho to bhi same my-attendance call.
 */
export async function getStudentAttendance(
    _email?: string,
    _courseId?: string,
) {
    return getMyAttendance();
}
// import { apiFetch, type ApiEnvelope } from "./client";

// export type AttendanceStatus = "present" | "absent" | "leave";

// export interface AttendanceRecord {
//     studentEmail: string;
//     studentName?: string;
//     status: AttendanceStatus;
// }

// export interface AttendanceSession {
//     id: string;
//     courseId: string;
//     date: string;
//     records: AttendanceRecord[];
// }

// export interface StudentAttendanceSummary {
//     totalSessions: number;
//     presentCount: number;
//     absentCount: number;
//     percentage: number;
//     history: { date: string; courseId: string; status: AttendanceStatus }[];
// }

// export async function markAttendance(payload: {
//     courseId: string;
//     instructorEmail: string;
//     date: string;
//     records: AttendanceRecord[];
// }) {
//     return apiFetch<{ message: string }>("/attendance/mark", {
//         method: "POST",
//         body: JSON.stringify(payload),
//     });
// }

// export async function getCourseAttendance(courseId: string) {
//     return apiFetch<ApiEnvelope<AttendanceSession[]>>(
//         `/attendance/course/${courseId}`,
//     );
// }

// export async function getStudentAttendance(email: string, courseId?: string) {
//     const qs = courseId ? `?courseId=${courseId}` : "";
//     return apiFetch<ApiEnvelope<StudentAttendanceSummary>>(
//         `/attendance/student/${email}${qs}`,
//     );
// }