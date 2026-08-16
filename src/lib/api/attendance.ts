import { apiFetch, type ApiEnvelope } from "./client";

export type AttendanceStatus = "present" | "absent" | "leave";

export interface AttendanceRecord {
    studentEmail: string;
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
    history: { date: string; courseId: string; status: AttendanceStatus }[];
}

export async function markAttendance(payload: {
    courseId: string;
    instructorEmail: string;
    date: string;
    records: AttendanceRecord[];
}) {
    return apiFetch<{ message: string }>("/attendance/mark", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getCourseAttendance(courseId: string) {
    return apiFetch<ApiEnvelope<AttendanceSession[]>>(
        `/attendance/course/${courseId}`,
    );
}

export async function getStudentAttendance(email: string, courseId?: string) {
    const qs = courseId ? `?courseId=${courseId}` : "";
    return apiFetch<ApiEnvelope<StudentAttendanceSummary>>(
        `/attendance/student/${email}${qs}`,
    );
}