"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceRing } from "@/components/shared/attendance-ring";
import { EmptyState } from "@/components/shared/empty-state";
import {
    getStudentAttendance,
    type StudentAttendanceSummary,
} from "@/lib/api/attendance";
import { useCurrentUser } from "@/hooks/use-current-user";
import { CalendarDays, CheckCircle2, XCircle } from "lucide-react";
// import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

export default function StudentAttendancePage() {
    const { user } = useCurrentUser();
    const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.email) return;
        getStudentAttendance(user.email)
            .then((res) => setSummary(res.data))
            .finally(() => setLoading(false));
    }, [user?.email]);

    if (loading) return <LoadingSpinner />;

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
                <Card className="flex flex-col items-center justify-center py-8 lg:col-span-1">
                    <AttendanceRing
                        percentage={summary.percentage}
                        size={140}
                        strokeWidth={10}
                        label="Overall Attendance"
                    />
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Session History</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {summary.history.map((h, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between rounded-xl border border-border p-3"
                            >
                                <div className="flex items-center gap-2 text-sm">
                                    {h.status === "present" ? (
                                        <CheckCircle2 className="h-4 w-4 text-success" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-danger" />
                                    )}
                                    {h.date}
                                </div>
                                <Badge variant={h.status === "present" ? "success" : "danger"}>
                                    {h.status}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}