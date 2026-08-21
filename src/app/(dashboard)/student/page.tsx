"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { DeadlineRing } from "@/components/shared/deadline-ring";
import { SubmissionStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { courseworkLabels } from "@/features/student/coursework-config";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  deriveStudentStatus,
  useStudentCoursework,
} from "@/hooks/useStudentCoursework";
import type { CourseworkKind, DerivedCourseworkRow } from "@/types";
import { listCourses, type Course } from "@/lib/api/courses";
import { getStudentInsight, type StudentInsightView } from "@/lib/api/aiInsights";

const KINDS: CourseworkKind[] = ["assignment", "quiz", "exam", "project"];

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const name = user?.name?.split(" ")[0] || "Student";

  // Load all four kinds in parallel via the shared hook pattern
  const a = useStudentCoursework("assignment");
  const q = useStudentCoursework("quiz");
  const e = useStudentCoursework("exam");
  const p = useStudentCoursework("project");

  const loading = a.loading || q.loading || e.loading || p.loading;
  const rows = useMemo(() => {
    const all = [...a.rows, ...q.rows, ...e.rows, ...p.rows];
    all.sort(
      (x, y) =>
        new Date(x.deadline).getTime() - new Date(y.deadline).getTime(),
    );
    return all;
  }, [a.rows, q.rows, e.rows, p.rows]);

  const stats = useMemo(() => {
    const total = rows.length;
    const submitted = rows.filter(
      (r) =>
        r.studentStatus === "submitted" || r.studentStatus === "graded",
    ).length;
    const pending = rows.filter((r) => r.studentStatus === "pending").length;
    const late = rows.filter((r) => r.studentStatus === "late").length;
    return { total, submitted, pending, late };
  }, [rows]);

  const upcoming = rows
    .filter((r) => r.studentStatus === "pending")
    .slice(0, 5);
  const recent = rows.slice(0, 6);

  // ---- AI Insight banner data ----
  const [insight, setInsight] = useState<StudentInsightView | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;

    async function loadInsight() {
      setInsightLoading(true);
      try {
        const coursesRes = await listCourses();
        const courses: Course[] = coursesRes.data ?? [];
        if (courses.length === 0) {
          if (!cancelled) setInsight(null);
          return;
        }

        // check each enrolled course, use the first one with real insight data
        for (const c of courses) {
          const res = await getStudentInsight(c.id, user!.email);
          if (res) {
            if (!cancelled) setInsight(res);
            return;
          }
        }
        if (!cancelled) setInsight(null);
      } catch {
        if (!cancelled) setInsight(null);
      } finally {
        if (!cancelled) setInsightLoading(false);
      }
    }

    loadInsight();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold">
          Welcome back, {name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&rsquo;s where things stand across your courses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total tasks"
          value={stats.total}
          icon={FileText}
          tone="primary"
          index={0}
        />
        <StatCard
          label="Submitted"
          value={stats.submitted}
          icon={CheckCircle2}
          tone="success"
          index={1}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          tone="warning"
          index={2}
        />
        <StatCard
          label="Late"
          value={stats.late}
          icon={AlertTriangle}
          tone="danger"
          index={3}
        />
      </div>

      {/* AI Insight banner */}
      {!insightLoading && insight && (
        <Card className="border-primary/20 bg-primary-soft/40">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-display text-sm font-semibold">
                    Your AI Insight
                  </p>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    AI
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {insight.student_message}
                </p>
                {insight.focus_topic && (
                  <p className="mt-1 text-xs text-primary">
                    📌 Focus on: {insight.focus_topic}
                  </p>
                )}
              </div>
            </div>

            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/student/insights">
                View insights <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Upcoming deadlines</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Assignments, quizzes, exams and projects due soon.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/assignments">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="You're all caught up"
                description="No pending deadlines right now. When your instructor publishes work, it will show up here."
              />
            ) : (
              upcoming.map((row) => (
                <Link
                  key={`${row.kind}-${row.id}`}
                  href={`${courseworkLabels[row.kind].basePath}/${row.id}`}
                  className="flex items-center gap-4 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-secondary/60"
                >
                  <DeadlineRing
                    createdAt={row.createdAt}
                    deadline={row.deadline}
                    showLabel={false}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.title}</p>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                      {row.kind} · {row.courseCode} · Due{" "}
                      {formatDate(row.deadline)}
                    </p>
                  </div>
                  <Badge variant="outline">{row.totalMarks} pts</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing here yet. Published coursework from your enrolled
                courses will appear once your instructor creates it.
              </p>
            )}
            {recent.map((row) => (
              <div
                key={`${row.kind}-${row.id}`}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.title}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {row.kind} · {row.courseCode}
                  </p>
                </div>
                <SubmissionStatusBadge status={row.studentStatus} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}