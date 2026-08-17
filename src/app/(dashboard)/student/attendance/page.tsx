"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceRing } from "@/components/shared/attendance-ring";
import { EmptyState } from "@/components/shared/empty-state";
import { getMyAttendance } from "@/lib/api/attendance";
import {
    CalendarDays,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
} from "lucide-react";

type HistoryItem = {
    date: string;
    courseId?: string;
    status: "present" | "absent" | "leave" | string;
};

type Summary = {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    leaveCount: number;
    percentage: number;
    history: HistoryItem[];
};

function buildSummary(rows: any[]): Summary {
    const history: HistoryItem[] = (rows ?? []).map((item) => ({
        date:
            typeof item.date === "string"
                ? item.date.slice(0, 10)
                : String(item.date ?? ""),
        courseId: item.courseId,
        status: item.status ?? "absent",
    }));

    // newest first
    history.sort((a, b) => (a.date < b.date ? 1 : -1));

    const totalSessions = history.length;
    const presentCount = history.filter((h) => h.status === "present").length;
    const leaveCount = history.filter((h) => h.status === "leave").length;
    const absentCount = history.filter((h) => h.status === "absent").length;
    const percentage =
        totalSessions > 0
            ? Math.round((presentCount / totalSessions) * 100)
            : 0;

    return {
        totalSessions,
        presentCount,
        absentCount,
        leaveCount,
        percentage,
        history,
    };
}

function StatusIcon({ status }: { status: string }) {
    if (status === "present") {
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }
    if (status === "leave") {
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
}

function StatusBadge({ status }: { status: string }) {
    if (status === "present") {
        return (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 capitalize border-0">
                Present
            </Badge>
        );
    }
    if (status === "leave") {
        return (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 capitalize border-0">
                Leave
            </Badge>
        );
    }
    return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 capitalize border-0">
            Absent
        </Badge>
    );
}

export default function StudentAttendancePage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        getMyAttendance()
            .then((res) => {
                if (cancelled) return;
                const rows = Array.isArray(res?.data) ? res.data : [];
                setSummary(buildSummary(rows));
            })
            .catch((err) => {
                if (cancelled) return;
                console.error(err);
                setError(
                    err instanceof Error ? err.message : "Could not load attendance.",
                );
                setSummary({
                    totalSessions: 0,
                    presentCount: 0,
                    absentCount: 0,
                    leaveCount: 0,
                    percentage: 0,
                    history: [],
                });
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading attendance…
            </div>
        );
    }

    if (error) {
        return (
            <EmptyState
                icon={CalendarDays}
                title="Could not load attendance"
                description={error}
            />
        );
    }

    if (!summary || summary.totalSessions === 0) {
        return (
            <EmptyState
                icon={CalendarDays}
                title="No attendance records yet"
                description="Jab instructor attendance mark karega, wo yahan dikhegi."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                    My Attendance
                </h1>
                <p className="text-sm text-muted-foreground">
                    View your overall attendance and session-wise attendance history.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Overview Card */}
                <Card className="flex flex-col items-center justify-center gap-4 py-8 lg:col-span-1">
                    <AttendanceRing
                        percentage={summary.percentage}
                        size={140}
                        strokeWidth={10}
                        label="Overall Attendance"
                    />

                    <div className="flex flex-wrap justify-center gap-4 text-center text-sm">
                        <div>
                            <p className="font-display text-lg font-semibold text-emerald-600">
                                {summary.presentCount}
                            </p>
                            <Badge className="mt-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                                Present
                            </Badge>
                        </div>
                        <div>
                            <p className="font-display text-lg font-semibold text-red-600">
                                {summary.absentCount}
                            </p>
                            <Badge className="mt-1 bg-red-100 text-red-700 hover:bg-red-100 border-0">
                                Absent
                            </Badge>
                        </div>
                        <div>
                            <p className="font-display text-lg font-semibold text-amber-600">
                                {summary.leaveCount}
                            </p>
                            <Badge className="mt-1 bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
                                Leave
                            </Badge>
                        </div>
                    </div>
                </Card>

                {/* Session History */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Session History</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {summary.history.map((h, i) => (
                            <div
                                key={`${h.date}-${h.courseId ?? i}`}
                                className="flex items-center justify-between rounded-xl border border-border p-3"
                            >
                                <div className="flex items-center gap-2 text-sm">
                                    <StatusIcon status={h.status} />
                                    <span>{h.date}</span>
                                </div>
                                <StatusBadge status={h.status} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}




// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { AttendanceRing } from "@/components/shared/attendance-ring";
// import { EmptyState } from "@/components/shared/empty-state";
// import { getMyAttendance } from "@/lib/api/attendance";
// import { CalendarDays, CheckCircle2, XCircle, Loader2 } from "lucide-react";

// type HistoryItem = {
//     date: string;
//     courseId?: string;
//     status: "present" | "absent" | "leave" | string;
// };

// type Summary = {
//     totalSessions: number;
//     presentCount: number;
//     absentCount: number;
//     percentage: number;
//     history: HistoryItem[];
// };

// function buildSummary(rows: any[]): Summary {
//     const history: HistoryItem[] = (rows ?? []).map((item) => ({
//         date:
//             typeof item.date === "string"
//                 ? item.date.slice(0, 10)
//                 : String(item.date ?? ""),
//         courseId: item.courseId,
//         status: item.status ?? "absent",
//     }));

//     // newest first
//     history.sort((a, b) => (a.date < b.date ? 1 : -1));

//     const totalSessions = history.length;
//     const presentCount = history.filter((h) => h.status === "present").length;
//     const absentCount = totalSessions - presentCount;
//     const percentage =
//         totalSessions > 0
//             ? Math.round((presentCount / totalSessions) * 100)
//             : 0;

//     return {
//         totalSessions,
//         presentCount,
//         absentCount,
//         percentage,
//         history,
//     };
// }

// export default function StudentAttendancePage() {
//     const [summary, setSummary] = useState<Summary | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");

//     useEffect(() => {
//         let cancelled = false;

//         getMyAttendance()
//             .then((res) => {
//                 if (cancelled) return;
//                 const rows = Array.isArray(res?.data) ? res.data : [];
//                 setSummary(buildSummary(rows));
//             })
//             .catch((err) => {
//                 if (cancelled) return;
//                 console.error(err);
//                 setError(
//                     err instanceof Error
//                         ? err.message
//                         : "Could not load attendance.",
//                 );
//                 setSummary({
//                     totalSessions: 0,
//                     presentCount: 0,
//                     absentCount: 0,
//                     percentage: 0,
//                     history: [],
//                 });
//             })
//             .finally(() => {
//                 if (!cancelled) setLoading(false);
//             });

//         return () => {
//             cancelled = true;
//         };
//     }, []);

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
//                 <Loader2 className="h-5 w-5 animate-spin" />
//                 Loading attendance…
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <EmptyState
//                 icon={CalendarDays}
//                 title="Could not load attendance"
//                 description={error}
//             />
//         );
//     }

//     if (!summary || summary.totalSessions === 0) {
//         return (
//             <EmptyState
//                 icon={CalendarDays}
//                 title="No attendance records yet"
//                 description="Jab instructor attendance mark karega, wo yahan dikhegi."
//             />
//         );
//     }

//     return (
//         <div className="space-y-6">
//             <div>
//                 <h1 className="font-display text-2xl font-semibold tracking-tight">
//                     My Attendance
//                 </h1>
//                 <p className="text-sm text-muted-foreground">
//                     View your overall attendance and session-wise attendance
//                     history.
//                 </p>
//             </div>

//             <div className="grid gap-6 lg:grid-cols-3">
//                 <Card className="flex flex-col items-center justify-center gap-4 py-8 lg:col-span-1">
//                     <AttendanceRing
//                         percentage={summary.percentage}
//                         size={140}
//                         strokeWidth={10}
//                         label="Overall Attendance"
//                     />
//                     <div className="flex gap-6 text-center text-sm">
//                         <div>
//                             <p className="font-display text-lg font-semibold text-success">
//                                 {summary.presentCount}
//                             </p>
//                             <Badge variant="success" className="mt-1">
//                                 Present
//                             </Badge>
//                         </div>
//                         <div>
//                             <p className="font-display text-lg font-semibold text-danger">
//                                 {summary.absentCount}
//                             </p>
//                             <Badge variant="danger" className="mt-1">
//                                 Absent / Leave
//                             </Badge>
//                         </div>
//                     </div>
//                 </Card>

//                 <Card className="lg:col-span-2">
//                     <CardHeader>
//                         <CardTitle>Session History</CardTitle>
//                     </CardHeader>
//                     <CardContent className="space-y-2">
//                         {summary.history.map((h, i) => (
//                             <div
//                                 key={`${h.date}-${h.courseId ?? i}`}
//                                 className="flex items-center justify-between rounded-xl border border-border p-3"
//                             >
//                                 <div className="flex items-center gap-2 text-sm">
//                                     {h.status === "present" ? (
//                                         <CheckCircle2 className="h-4 w-4 text-success" />
//                                     ) : (
//                                         <XCircle className="h-4 w-4 text-danger" />
//                                     )}
//                                     <span>{h.date}</span>
//                                 </div>
//                                 <Badge
//                                     variant={
//                                         h.status === "present"
//                                             ? "success"
//                                             : "danger"
//                                     }
//                                     className="capitalize"
//                                 >
//                                     {h.status}
//                                 </Badge>
//                             </div>
//                         ))}
//                     </CardContent>
//                 </Card>
//             </div>
//         </div>
//     );
// }
