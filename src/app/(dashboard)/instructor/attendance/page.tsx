"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AttendanceRing } from "@/components/shared/attendance-ring";
import { EmptyState } from "@/components/shared/empty-state";
import { markAttendance, getCourseAttendance } from "@/lib/api/attendance";
import { listCourses, type Course } from "@/lib/api/courses";
import { listCourseEnrollments, enrollStudent } from "@/lib/api/enrollments";
import { listUsers } from "@/lib/api/users";
import {
    CalendarCheck2,
    Save,
    Users,
    UserPlus,
    Loader2,
    History,
    X,
} from "lucide-react";
import { toast } from "sonner";

type LocalStatus = "present" | "absent" | "leave";

interface StudentRow {
    id: string;
    email: string;
    name: string;
    status: LocalStatus;
}

interface StudentOption {
    id: string;
    name: string;
    email: string;
}

interface HistoryRecord {
    date: string;
    status: LocalStatus;
}

// Normalize any status string to LocalStatus
function normalizeStatus(raw: any): LocalStatus {
    const value = String(raw ?? "").toLowerCase().trim();
    if (value === "present") return "present";
    if (value === "leave" || value === "on_leave" || value === "on-leave") return "leave";
    return "absent";
}

export default function InstructorAttendancePage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseId, setCourseId] = useState<string>("");
    const [sessionDate, setSessionDate] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
    const [selectedToAdd, setSelectedToAdd] = useState("");
    const [saving, setSaving] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // History drawer state
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
    const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Load courses
    useEffect(() => {
        listCourses()
            .then((res) => {
                setCourses(res.data ?? []);
                if (res.data?.length) setCourseId(res.data[0].id);
            })
            .catch(() => toast.error("Could not load courses."));
    }, []);

    // Load all students for Add dropdown
    useEffect(() => {
        listUsers("student")
            .then((res) => setAllStudents(res.data ?? []))
            .catch(() => toast.error("Could not load the student list."));
    }, []);

    // Load enrolled + saved attendance for course + date
    const loadStudentsForDate = useCallback(
        async (id: string, date: string) => {
            if (!id) return;
            setLoadingStudents(true);
            try {
                const enrollRes = await listCourseEnrollments(id);
                const enrolled: StudentRow[] = (enrollRes?.data ?? [])
                    .filter((e: any) => e.student)
                    .map((e: any) => ({
                        id: e.student.id || e.studentId || e.student._id || "",
                        email: e.student.email,
                        name: e.student.name,
                        status: "present" as LocalStatus,
                    }))
                    .filter((s) => s.id);

                const savedByEmail: Record<string, LocalStatus> = {};
                const savedById: Record<string, LocalStatus> = {};

                try {
                    const attRes = await getCourseAttendance(id);
                    const rows = Array.isArray(attRes?.data) ? attRes.data : [];

                    for (const item of rows) {
                        const itemDate =
                            typeof item.date === "string"
                                ? item.date.slice(0, 10)
                                : item.date;

                        if (item.records && Array.isArray(item.records)) {
                            if (itemDate !== date) continue;
                            for (const r of item.records) {
                                const email = r.studentEmail || r.email;
                                const sid = r.studentId || r.student?.id;
                                const status = normalizeStatus(r.status);
                                if (email) savedByEmail[String(email).toLowerCase()] = status;
                                if (sid) savedById[String(sid)] = status;
                            }
                        } else {
                            if (itemDate !== date) continue;
                            const email =
                                item.studentEmail || item.student?.email || item.email;
                            const sid =
                                item.studentId || item.student?.id || item.student_id;
                            const status = normalizeStatus(item.status);
                            if (email) savedByEmail[String(email).toLowerCase()] = status;
                            if (sid) savedById[String(sid)] = status;
                        }
                    }
                } catch (err) {
                    console.warn("Could not load saved attendance:", err);
                }

                const merged = enrolled.map((s) => ({
                    ...s,
                    status:
                        savedById[s.id] ??
                        savedByEmail[s.email.toLowerCase()] ??
                        ("present" as LocalStatus),
                }));

                setStudents(merged);
            } catch {
                toast.error("Could not load enrolled students.");
                setStudents([]);
            } finally {
                setLoadingStudents(false);
            }
        },
        [],
    );

    useEffect(() => {
        if (!courseId) return;
        loadStudentsForDate(courseId, sessionDate);
    }, [courseId, sessionDate, loadStudentsForDate]);

    const setStatus = (studentId: string, status: LocalStatus) => {
        setStudents((prev) =>
            prev.map((s) => (s.id === studentId ? { ...s, status } : s)),
        );
    };

    const presentCount = students.filter((s) => s.status === "present").length;
    const leaveCount = students.filter((s) => s.status === "leave").length;
    const absentCount = students.filter((s) => s.status === "absent").length;
    const percentage = students.length
        ? Math.round((presentCount / students.length) * 100)
        : 0;

    const handleEnroll = async () => {
        if (!selectedToAdd || !courseId) return;
        try {
            await enrollStudent(courseId, selectedToAdd);
            toast.success("Student enrolled successfully");
            setSelectedToAdd("");
            await loadStudentsForDate(courseId, sessionDate);
        } catch {
            toast.error(
                "Could not enrol the student — they may already be enrolled.",
            );
        }
    };

    const handleSave = async () => {
        if (!courseId || students.length === 0) return;
        setSaving(true);
        try {
            await markAttendance({
                courseId,
                date: sessionDate,
                attendance: students.map((s) => ({
                    studentId: s.id,
                    status: s.status,
                })),
            });
            toast.success(`Attendance saved for ${sessionDate}`);
            await loadStudentsForDate(courseId, sessionDate);
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : "Could not save attendance.";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // Open History Drawer
    const openHistory = async (student: StudentRow) => {
        setSelectedStudent(student);
        setHistoryOpen(true);
        setLoadingHistory(true);
        setHistoryRecords([]);

        try {
            const attRes = await getCourseAttendance(courseId);
            const rows = Array.isArray(attRes?.data) ? attRes.data : [];
            const records: HistoryRecord[] = [];

            for (const item of rows) {
                const itemDate =
                    typeof item.date === "string" ? item.date.slice(0, 10) : item.date;

                if (item.records && Array.isArray(item.records)) {
                    for (const r of item.records) {
                        const email = r.studentEmail || r.email;
                        const sid = r.studentId || r.student?.id;
                        if (
                            (sid && sid === student.id) ||
                            (email && email.toLowerCase() === student.email.toLowerCase())
                        ) {
                            records.push({
                                date: itemDate,
                                status: normalizeStatus(r.status),
                            });
                        }
                    }
                } else {
                    const email =
                        item.studentEmail || item.student?.email || item.email;
                    const sid =
                        item.studentId || item.student?.id || item.student_id;
                    if (
                        (sid && sid === student.id) ||
                        (email && email.toLowerCase() === student.email.toLowerCase())
                    ) {
                        records.push({
                            date: itemDate,
                            status: normalizeStatus(item.status),
                        });
                    }
                }
            }

            // Sort by date descending
            records.sort((a, b) => (a.date < b.date ? 1 : -1));
            setHistoryRecords(records);
        } catch (err) {
            console.warn("Could not load history:", err);
            toast.error("Could not load attendance history.");
        } finally {
            setLoadingHistory(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-semibold tracking-tight">
                        Attendance
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Select a course, mark each student’s status, then save.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || !students.length || loadingStudents}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving…
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Attendance
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Students
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={courseId}
                                onChange={(e) => setCourseId(e.target.value)}
                                className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
                            >
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.title}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="date"
                                value={sessionDate}
                                onChange={(e) => setSessionDate(e.target.value)}
                                className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
                            />

                            <select
                                value={selectedToAdd}
                                onChange={(e) => setSelectedToAdd(e.target.value)}
                                className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
                            >
                                <option value="">Select a student</option>
                                {allStudents
                                    .filter((s) => !students.some((st) => st.email === s.email))
                                    .map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.email})
                                        </option>
                                    ))}
                            </select>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleEnroll}
                                disabled={!selectedToAdd}
                            >
                                <UserPlus className="h-4 w-4" />
                                Add
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-2">
                        {loadingStudents ? (
                            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading attendance…
                            </div>
                        ) : students.length === 0 ? (
                            <EmptyState
                                icon={CalendarCheck2}
                                title="No students found"
                                description="Select a student above and press Add, or this course has no enrolled students yet."
                            />
                        ) : (
                            students.map((s) => (
                                <div
                                    key={s.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{s.name}</p>
                                        <p className="text-xs text-muted-foreground">{s.email}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {(["present", "absent", "leave"] as LocalStatus[]).map(
                                            (opt) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setStatus(s.id, opt)}
                                                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${s.status === opt
                                                            ? opt === "present"
                                                                ? "bg-emerald-600 text-white"
                                                                : opt === "absent"
                                                                    ? "bg-red-600 text-white"
                                                                    : "bg-amber-500 text-white"
                                                            : "bg-secondary text-secondary-foreground hover:opacity-80"
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ),
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-1.5 text-xs border-slate-300 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                                            onClick={() => openHistory(s)}
                                        >
                                            <History className="h-3.5 w-3.5" />
                                            History
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Session Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Session Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <AttendanceRing percentage={percentage} label="Present Today" />

                        <div className="flex w-full flex-wrap justify-around gap-3 text-center text-sm">
                            <div>
                                <p className="font-display text-lg font-semibold text-emerald-600">
                                    {presentCount}
                                </p>
                                <Badge className="mt-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                                    Present
                                </Badge>
                            </div>
                            <div>
                                <p className="font-display text-lg font-semibold text-red-600">
                                    {absentCount}
                                </p>
                                <Badge className="mt-1 bg-red-100 text-red-700 hover:bg-red-100 border-0">
                                    Absent
                                </Badge>
                            </div>
                            <div>
                                <p className="font-display text-lg font-semibold text-amber-600">
                                    {leaveCount}
                                </p>
                                <Badge className="mt-1 bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
                                    Leave
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* History Drawer */}
            {historyOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setHistoryOpen(false)}
                    />

                    <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-background shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <div>
                                <h2 className="font-semibold">Attendance History</h2>
                                {selectedStudent && (
                                    <p className="text-sm text-muted-foreground">
                                        {selectedStudent.name}
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setHistoryOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {loadingHistory ? (
                                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading history…
                                </div>
                            ) : historyRecords.length === 0 ? (
                                <div className="py-16 text-center text-sm text-muted-foreground">
                                    No attendance records found for this student.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {historyRecords.map((record, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                                        >
                                            <span className="text-sm font-medium">
                                                {new Date(record.date).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </span>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${record.status === "present"
                                                        ? "bg-emerald-600 text-white"
                                                        : record.status === "absent"
                                                            ? "bg-red-600 text-white"
                                                            : "bg-amber-500 text-white"
                                                    }`}
                                            >
                                                {record.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { AttendanceRing } from "@/components/shared/attendance-ring";
// import { EmptyState } from "@/components/shared/empty-state";
// import { markAttendance, getCourseAttendance } from "@/lib/api/attendance";
// import { listCourses, type Course } from "@/lib/api/courses";
// import { listCourseEnrollments, enrollStudent } from "@/lib/api/enrollments";
// import { listUsers } from "@/lib/api/users";
// import {
//     CalendarCheck2,
//     Save,
//     Users,
//     UserPlus,
//     Loader2,
//     History,
//     X,
// } from "lucide-react";
// import { toast } from "sonner";

// type LocalStatus = "present" | "absent" | "leave";

// interface StudentRow {
//     id: string;
//     email: string;
//     name: string;
//     status: LocalStatus;
// }

// interface StudentOption {
//     id: string;
//     name: string;
//     email: string;
// }

// interface HistoryRecord {
//     date: string;
//     status: LocalStatus;
// }

// export default function InstructorAttendancePage() {
//     const [courses, setCourses] = useState<Course[]>([]);
//     const [courseId, setCourseId] = useState<string>("");
//     const [sessionDate, setSessionDate] = useState(
//         new Date().toISOString().slice(0, 10),
//     );
//     const [students, setStudents] = useState<StudentRow[]>([]);
//     const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
//     const [selectedToAdd, setSelectedToAdd] = useState("");
//     const [saving, setSaving] = useState(false);
//     const [loadingStudents, setLoadingStudents] = useState(false);

//     // History drawer state
//     const [historyOpen, setHistoryOpen] = useState(false);
//     const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
//     const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
//     const [loadingHistory, setLoadingHistory] = useState(false);

//     // Load courses
//     useEffect(() => {
//         listCourses()
//             .then((res) => {
//                 setCourses(res.data ?? []);
//                 if (res.data?.length) setCourseId(res.data[0].id);
//             })
//             .catch(() => toast.error("Could not load courses."));
//     }, []);

//     // Load all students for Add dropdown
//     useEffect(() => {
//         listUsers("student")
//             .then((res) => setAllStudents(res.data ?? []))
//             .catch(() => toast.error("Could not load the student list."));
//     }, []);

//     // Load enrolled + saved attendance for course + date
//     const loadStudentsForDate = useCallback(
//         async (id: string, date: string) => {
//             if (!id) return;
//             setLoadingStudents(true);
//             try {
//                 const enrollRes = await listCourseEnrollments(id);
//                 const enrolled: StudentRow[] = (enrollRes?.data ?? [])
//                     .filter((e: any) => e.student)
//                     .map((e: any) => ({
//                         id: e.student.id || e.studentId || e.student._id || "",
//                         email: e.student.email,
//                         name: e.student.name,
//                         status: "present" as LocalStatus,
//                     }))
//                     .filter((s) => s.id);

//                 const savedByEmail: Record<string, LocalStatus> = {};
//                 const savedById: Record<string, LocalStatus> = {};

//                 try {
//                     const attRes = await getCourseAttendance(id);
//                     const rows = Array.isArray(attRes?.data) ? attRes.data : [];

//                     for (const item of rows) {
//                         const itemDate =
//                             typeof item.date === "string"
//                                 ? item.date.slice(0, 10)
//                                 : item.date;

//                         if (item.records && Array.isArray(item.records)) {
//                             if (itemDate !== date) continue;
//                             for (const r of item.records) {
//                                 const email = r.studentEmail || r.email;
//                                 const sid = r.studentId || r.student?.id;
//                                 if (email && r.status) {
//                                     savedByEmail[String(email).toLowerCase()] =
//                                         r.status as LocalStatus;
//                                 }
//                                 if (sid && r.status) {
//                                     savedById[String(sid)] = r.status as LocalStatus;
//                                 }
//                             }
//                         } else {
//                             if (itemDate !== date) continue;
//                             const email =
//                                 item.studentEmail || item.student?.email || item.email;
//                             const sid =
//                                 item.studentId || item.student?.id || item.student_id;
//                             if (email && item.status) {
//                                 savedByEmail[String(email).toLowerCase()] =
//                                     item.status as LocalStatus;
//                             }
//                             if (sid && item.status) {
//                                 savedById[String(sid)] = item.status as LocalStatus;
//                             }
//                         }
//                     }
//                 } catch (err) {
//                     console.warn("Could not load saved attendance:", err);
//                 }

//                 const merged = enrolled.map((s) => ({
//                     ...s,
//                     status:
//                         savedById[s.id] ??
//                         savedByEmail[s.email.toLowerCase()] ??
//                         ("present" as LocalStatus),
//                 }));

//                 setStudents(merged);
//             } catch {
//                 toast.error("Could not load enrolled students.");
//                 setStudents([]);
//             } finally {
//                 setLoadingStudents(false);
//             }
//         },
//         [],
//     );

//     useEffect(() => {
//         if (!courseId) return;
//         loadStudentsForDate(courseId, sessionDate);
//     }, [courseId, sessionDate, loadStudentsForDate]);

//     const setStatus = (studentId: string, status: LocalStatus) => {
//         setStudents((prev) =>
//             prev.map((s) => (s.id === studentId ? { ...s, status } : s)),
//         );
//     };

//     const presentCount = students.filter((s) => s.status === "present").length;
//     const leaveCount = students.filter((s) => s.status === "leave").length;
//     const absentCount = students.filter((s) => s.status === "absent").length;
//     const percentage = students.length
//         ? Math.round((presentCount / students.length) * 100)
//         : 0;

//     const handleEnroll = async () => {
//         if (!selectedToAdd || !courseId) return;
//         try {
//             await enrollStudent(courseId, selectedToAdd);
//             toast.success("Student enrolled successfully");
//             setSelectedToAdd("");
//             await loadStudentsForDate(courseId, sessionDate);
//         } catch {
//             toast.error(
//                 "Could not enrol the student — they may already be enrolled.",
//             );
//         }
//     };

//     const handleSave = async () => {
//         if (!courseId || students.length === 0) return;
//         setSaving(true);
//         try {
//             await markAttendance({
//                 courseId,
//                 date: sessionDate,
//                 attendance: students.map((s) => ({
//                     studentId: s.id,
//                     status: s.status,
//                 })),
//             });
//             toast.success(`Attendance saved for ${sessionDate}`);
//             await loadStudentsForDate(courseId, sessionDate);
//         } catch (err: unknown) {
//             const msg =
//                 err instanceof Error ? err.message : "Could not save attendance.";
//             toast.error(msg);
//         } finally {
//             setSaving(false);
//         }
//     };

//     // Open History Drawer
//     const openHistory = async (student: StudentRow) => {
//         setSelectedStudent(student);
//         setHistoryOpen(true);
//         setLoadingHistory(true);
//         setHistoryRecords([]);

//         try {
//             const attRes = await getCourseAttendance(courseId);
//             const rows = Array.isArray(attRes?.data) ? attRes.data : [];
//             const records: HistoryRecord[] = [];

//             for (const item of rows) {
//                 const itemDate =
//                     typeof item.date === "string" ? item.date.slice(0, 10) : item.date;

//                 if (item.records && Array.isArray(item.records)) {
//                     for (const r of item.records) {
//                         const email = r.studentEmail || r.email;
//                         const sid = r.studentId || r.student?.id;
//                         if (
//                             (sid && sid === student.id) ||
//                             (email && email.toLowerCase() === student.email.toLowerCase())
//                         ) {
//                             if (r.status) {
//                                 records.push({
//                                     date: itemDate,
//                                     status: r.status as LocalStatus,
//                                 });
//                             }
//                         }
//                     }
//                 } else {
//                     const email =
//                         item.studentEmail || item.student?.email || item.email;
//                     const sid =
//                         item.studentId || item.student?.id || item.student_id;
//                     if (
//                         (sid && sid === student.id) ||
//                         (email && email.toLowerCase() === student.email.toLowerCase())
//                     ) {
//                         if (item.status) {
//                             records.push({
//                                 date: itemDate,
//                                 status: item.status as LocalStatus,
//                             });
//                         }
//                     }
//                 }
//             }

//             // Sort by date descending
//             records.sort((a, b) => (a.date < b.date ? 1 : -1));
//             setHistoryRecords(records);
//         } catch (err) {
//             console.warn("Could not load history:", err);
//             toast.error("Could not load attendance history.");
//         } finally {
//             setLoadingHistory(false);
//         }
//     };

//     return (
//         <div className="space-y-6">
//             <div className="flex flex-wrap items-center justify-between gap-4">
//                 <div>
//                     <h1 className="font-display text-2xl font-semibold tracking-tight">
//                         Attendance
//                     </h1>
//                     <p className="text-sm text-muted-foreground">
//                         Select a course, mark each student’s status, then save.
//                     </p>
//                 </div>
//                 <Button
//                     onClick={handleSave}
//                     disabled={saving || !students.length || loadingStudents}
//                     className="bg-emerald-600 hover:bg-emerald-700 text-white"
//                 >
//                     {saving ? (
//                         <>
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                             Saving…
//                         </>
//                     ) : (
//                         <>
//                             <Save className="mr-2 h-4 w-4" />
//                             Save Attendance
//                         </>
//                     )}
//                 </Button>
//             </div>

//             <div className="grid gap-6 lg:grid-cols-3">
//                 <Card className="lg:col-span-2">
//                     <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
//                         <CardTitle className="flex items-center gap-2">
//                             <Users className="h-4 w-4 text-primary" />
//                             Students
//                         </CardTitle>
//                         <div className="flex flex-wrap items-center gap-2">
//                             <select
//                                 value={courseId}
//                                 onChange={(e) => setCourseId(e.target.value)}
//                                 className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
//                             >
//                                 {courses.map((c) => (
//                                     <option key={c.id} value={c.id}>
//                                         {c.title}
//                                     </option>
//                                 ))}
//                             </select>

//                             <input
//                                 type="date"
//                                 value={sessionDate}
//                                 onChange={(e) => setSessionDate(e.target.value)}
//                                 className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
//                             />

//                             <select
//                                 value={selectedToAdd}
//                                 onChange={(e) => setSelectedToAdd(e.target.value)}
//                                 className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
//                             >
//                                 <option value="">Select a student</option>
//                                 {allStudents
//                                     .filter((s) => !students.some((st) => st.email === s.email))
//                                     .map((s) => (
//                                         <option key={s.id} value={s.id}>
//                                             {s.name} ({s.email})
//                                         </option>
//                                     ))}
//                             </select>

//                             <Button
//                                 size="sm"
//                                 variant="outline"
//                                 onClick={handleEnroll}
//                                 disabled={!selectedToAdd}
//                             >
//                                 <UserPlus className="h-4 w-4" />
//                                 Add
//                             </Button>
//                         </div>
//                     </CardHeader>

//                     <CardContent className="space-y-2">
//                         {loadingStudents ? (
//                             <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
//                                 <Loader2 className="h-4 w-4 animate-spin" />
//                                 Loading attendance…
//                             </div>
//                         ) : students.length === 0 ? (
//                             <EmptyState
//                                 icon={CalendarCheck2}
//                                 title="No students found"
//                                 description="Select a student above and press Add, or this course has no enrolled students yet."
//                             />
//                         ) : (
//                             students.map((s) => (
//                                 <div
//                                     key={s.id}
//                                     className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
//                                 >
//                                     <div>
//                                         <p className="text-sm font-medium">{s.name}</p>
//                                         <p className="text-xs text-muted-foreground">{s.email}</p>
//                                     </div>

//                                     <div className="flex flex-wrap items-center gap-2">
//                                         {(["present", "absent", "leave"] as LocalStatus[]).map(
//                                             (opt) => (
//                                                 <button
//                                                     key={opt}
//                                                     type="button"
//                                                     onClick={() => setStatus(s.id, opt)}
//                                                     className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${s.status === opt
//                                                             ? opt === "present"
//                                                                 ? "bg-emerald-600 text-white"
//                                                                 : opt === "absent"
//                                                                     ? "bg-red-600 text-white"
//                                                                     : "bg-amber-500 text-white" // Leave - Amber
//                                                             : "bg-secondary text-secondary-foreground hover:opacity-80"
//                                                         }`}
//                                                 >
//                                                     {opt}
//                                                 </button>
//                                             ),
//                                         )}

//                                         {/* History Button */}
//                                         <Button
//                                             variant="outline"
//                                             size="sm"
//                                             className="h-8 gap-1.5 text-xs border-slate-300 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
//                                             onClick={() => openHistory(s)}
//                                         >
//                                             <History className="h-3.5 w-3.5" />
//                                             History
//                                         </Button>
//                                     </div>
//                                 </div>
//                             ))
//                         )}
//                     </CardContent>
//                 </Card>

//                 {/* Session Overview */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Session Overview</CardTitle>
//                     </CardHeader>
//                     <CardContent className="flex flex-col items-center gap-4">
//                         <AttendanceRing percentage={percentage} label="Present Today" />

//                         <div className="flex w-full flex-wrap justify-around gap-3 text-center text-sm">
//                             <div>
//                                 <p className="font-display text-lg font-semibold text-emerald-600">
//                                     {presentCount}
//                                 </p>
//                                 <Badge className="mt-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
//                                     Present
//                                 </Badge>
//                             </div>
//                             <div>
//                                 <p className="font-display text-lg font-semibold text-red-600">
//                                     {absentCount}
//                                 </p>
//                                 <Badge className="mt-1 bg-red-100 text-red-700 hover:bg-red-100 border-0">
//                                     Absent
//                                 </Badge>
//                             </div>
//                             <div>
//                                 <p className="font-display text-lg font-semibold text-amber-600">
//                                     {leaveCount}
//                                 </p>
//                                 <Badge className="mt-1 bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
//                                     Leave
//                                 </Badge>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* History Drawer */}
//             {historyOpen && (
//                 <div className="fixed inset-0 z-50 flex justify-end">
//                     {/* Backdrop */}
//                     <div
//                         className="absolute inset-0 bg-black/40"
//                         onClick={() => setHistoryOpen(false)}
//                     />

//                     {/* Panel */}
//                     <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-background shadow-xl">
//                         <div className="flex items-center justify-between border-b px-5 py-4">
//                             <div>
//                                 <h2 className="font-semibold">Attendance History</h2>
//                                 {selectedStudent && (
//                                     <p className="text-sm text-muted-foreground">
//                                         {selectedStudent.name}
//                                     </p>
//                                 )}
//                             </div>
//                             <Button
//                                 variant="ghost"
//                                 size="icon"
//                                 onClick={() => setHistoryOpen(false)}
//                             >
//                                 <X className="h-4 w-4" />
//                             </Button>
//                         </div>

//                         <div className="flex-1 overflow-y-auto p-5">
//                             {loadingHistory ? (
//                                 <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
//                                     <Loader2 className="h-4 w-4 animate-spin" />
//                                     Loading history…
//                                 </div>
//                             ) : historyRecords.length === 0 ? (
//                                 <div className="py-16 text-center text-sm text-muted-foreground">
//                                     No attendance records found for this student.
//                                 </div>
//                             ) : (
//                                 <div className="space-y-3">
//                                     {historyRecords.map((record, idx) => (
//                                         <div
//                                             key={idx}
//                                             className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
//                                         >
//                                             <span className="text-sm font-medium">
//                                                 {new Date(record.date).toLocaleDateString("en-GB", {
//                                                     day: "2-digit",
//                                                     month: "short",
//                                                     year: "numeric",
//                                                 })}
//                                             </span>
//                                             <span
//                                                 className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${record.status === "present"
//                                                         ? "bg-emerald-600 text-white"
//                                                         : record.status === "absent"
//                                                             ? "bg-red-600 text-white"
//                                                             : "bg-amber-500 text-white" // Leave - Amber
//                                                     }`}
//                                             >
//                                                 {record.status}
//                                             </span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }





