"use client";

import { useEffect, useRef, useState } from "react";
import { listCourses, type Course } from "@/lib/api/courses";
import { getStudentGrading } from "@/lib/api/grading";
import {
  getStudentInsight,
  triggerInsightGeneration,
  buildGradeDataFromReport,
  type StudentInsightView,
} from "@/lib/api/aiInsights";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Sparkles,
  Loader2,
  Target,
  CalendarCheck,
  BookOpen,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const HEADLINES: Record<string, string> = {
  Quiz: "Quizzes are holding your score back",
  Exam: "Exams are holding your score back",
  Assignment: "Assignments are holding your score back",
  Project: "Your project work needs attention",
};

function splitTopic(raw: string): { title: string; detail: string } {
  const bracket = raw.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (bracket) return { title: bracket[1].trim(), detail: bracket[2].trim() };

  const parts = raw.split(/\s[—–-]\s|:\s/);
  if (parts.length > 1) {
    return { title: parts[0].trim(), detail: parts.slice(1).join(" ").trim() };
  }
  return { title: raw.trim(), detail: "" };
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <p className="mt-2 truncate text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

export default function StudentAIInsightsPage() {
  const { user } = useCurrentUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [insight, setInsight] = useState<StudentInsightView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const lastGenerated = useRef<string>("");

  useEffect(() => {
    listCourses()
      .then((res) => {
        const list = res.data ?? [];
        setCourses(list);
        if (list.length) setCourseId(list[0].id);
      })
      .catch(() => toast.error("Could not load courses."))
      .finally(() => setLoading(false));
  }, []);

  const load = async (opts?: { force?: boolean }) => {
    if (!courseId || !user?.email) return;

    try {
      const res = await getStudentGrading(user.email, courseId);
      const report = res.data;
      if (report) {
        const gradeData = buildGradeDataFromReport(report, user.email, courseId);
        const signature = JSON.stringify(gradeData);
        if (opts?.force || lastGenerated.current !== signature) {
          lastGenerated.current = signature;
          await triggerInsightGeneration(gradeData);
        }
      }
    } catch (err) {
      console.error("Insight refresh failed:", err);
    }

    try {
      const data = await getStudentInsight(courseId, user.email);
      setInsight(data);
    } catch {
      toast.error("Could not load AI insight.");
    }
  };

  useEffect(() => {
    if (!courseId || !user?.email) return;
    let cancelled = false;
    setLoadingInsight(true);
    load().finally(() => {
      if (!cancelled) setLoadingInsight(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user?.email]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load({ force: true });
    setRefreshing(false);
    toast.success("Insight updated");
  };

  const courseTitle = courses.find((c) => c.id === courseId)?.title ?? "Your course";
  const topics = (insight?.suggested_topics ?? []).slice(0, 3).map(splitTopic);
  const headline =
    (insight?.focus_topic && HEADLINES[insight.focus_topic]) ||
    "Here's where to put your time";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              AI Insights
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Personalized feedback based on your grades and attendance
            </p>
          </div>
        </div>

        <Select value={courseId || undefined} onValueChange={setCourseId}>
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadingInsight ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your insight…
        </div>
      ) : !insight ? (
        <EmptyState
          icon={Sparkles}
          title="No insight available yet"
          description="Your instructor hasn't reviewed your grades for this course yet."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="space-y-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {courseTitle}
                </p>
                <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  AI analysis
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </span>
                <h2 className="text-2xl font-bold leading-snug tracking-tight">
                  {headline}
                </h2>
              </div>

              <div className="rounded-xl bg-muted/50 p-5">
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {insight.student_message}
                </p>
              </div>

              {topics.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">You should focus on</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {topics.length} topics
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {topics.map((t, i) => (
                      <div
                        key={t.title}
                        className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{t.title}</p>
                          {t.detail && (
                            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                              {t.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <StatCard
              icon={Target}
              label="Focus area"
              value={insight.focus_topic ?? "—"}
            />
            <StatCard
              icon={CalendarCheck}
              label="Attendance"
              value={
                insight.attendance_pct != null
                  ? `${insight.attendance_pct}%`
                  : "Not recorded"
              }
            />

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Updating…" : "Refresh insight"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}