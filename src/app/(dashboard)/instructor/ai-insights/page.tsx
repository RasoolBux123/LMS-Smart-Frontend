"use client";

import { useEffect, useMemo, useState } from "react";
import { listCourses, type Course } from "@/lib/api/courses";
import { generateRiskAlerts } from "@/lib/api/notifications";
import {
  getAdminInsights,
  getCourseInsightsList,
  type AIInsight,
  type AdminInsightStats,
  type RiskCategory,
} from "@/lib/api/aiInsights";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Sparkles, Loader2, ChevronDown, Bell } from "lucide-react";
import { toast } from "sonner";

const RISK_ORDER: RiskCategory[] = [
  "top",
  "on_track",
  "at_risk",
  "failure_risk",
  "incomplete_data",
];

const RISK_LABELS: Record<RiskCategory, string> = {
  top: "Top performer",
  on_track: "On track",
  at_risk: "At risk",
  failure_risk: "Failure risk",
  incomplete_data: "Incomplete data",
};

const RISK_BADGE: Record<RiskCategory, string> = {
  top: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-400/20",
  on_track:
    "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-400/20",
  at_risk:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-400/20",
  failure_risk:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300 dark:ring-red-400/20",
  incomplete_data:
    "bg-muted text-muted-foreground ring-border dark:bg-muted dark:text-muted-foreground",
};

const RISK_ACCENT: Record<RiskCategory, string> = {
  top: "bg-emerald-500",
  on_track: "bg-blue-500",
  at_risk: "bg-amber-500",
  failure_risk: "bg-red-500",
  incomplete_data: "bg-muted-foreground/40",
};

function RiskBadge({ risk }: { risk: RiskCategory }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${RISK_BADGE[risk]}`}
    >
      {RISK_LABELS[risk]}
    </span>
  );
}

export default function InstructorAIInsightsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [stats, setStats] = useState<AdminInsightStats | null>(null);
  const [rows, setRows] = useState<AIInsight[]>([]);
  const [filter, setFilter] = useState<RiskCategory | "all">("all");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [sendingAlerts, setSendingAlerts] = useState(false);

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

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoadingRows(true);
    setOpenRow(null);
    Promise.all([getAdminInsights(courseId), getCourseInsightsList(courseId)])
      .then(([s, list]) => {
        if (cancelled) return;
        setStats(s);
        setRows(list ?? []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load insights.");
      })
      .finally(() => {
        if (!cancelled) setLoadingRows(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.risk_category === filter)),
    [rows, filter]
  );

  async function handleSendRiskAlerts() {
    if (!courseId) return;
    setSendingAlerts(true);
    try {
      const res = await generateRiskAlerts(courseId);
      if (res.created > 0) {
        toast.success(
          `${res.created} new risk alert${res.created === 1 ? "" : "s"} sent to your notifications.`
        );
      } else {
        toast.info("No new risk alerts — you're already up to date.");
      }
    } catch {
      toast.error("Could not generate risk alerts.");
    } finally {
      setSendingAlerts(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-2">
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
              Risk analysis across your students
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendRiskAlerts}
            disabled={sendingAlerts || !courseId}
          >
            <Bell className={`h-4 w-4 mr-1.5 ${sendingAlerts ? "animate-pulse" : ""}`} />
            {sendingAlerts ? "Sending…" : "Notify me of risks"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {RISK_ORDER.map((risk) => {
          const count = stats?.risk_counts?.[risk] ?? 0;
          const pct = stats?.risk_percentages?.[risk] ?? 0;
          const active = filter === risk;
          return (
            <button
              key={risk}
              type="button"
              onClick={() => setFilter(active ? "all" : risk)}
              aria-pressed={active}
              className={`overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-colors ${
                active
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className={`h-1 ${RISK_ACCENT[risk]}`} />
              <div className="p-4">
                <p className="text-2xl font-bold tracking-tight">{count}</p>
                <p className="mt-1 text-sm font-medium">{RISK_LABELS[risk]}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{pct}%</p>
              </div>
            </button>
          );
        })}
      </div>

      {filter !== "all" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {visible.length} {RISK_LABELS[filter].toLowerCase()}
            {visible.length === 1 ? " student" : " students"}
          </span>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="font-medium text-primary hover:underline"
          >
            Show all
          </button>
        </div>
      )}

      {loadingRows ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading insights…
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={filter === "all" ? "No AI insights yet" : "No students in this band"}
          description={
            filter === "all"
              ? "Insights are generated automatically when you view a student's grading report."
              : "Try another status, or show all students."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[26%]">Student</TableHead>
                <TableHead className="w-[15%]">Status</TableHead>
                <TableHead className="w-[13%]">Focus area</TableHead>
                <TableHead>Insight</TableHead>
                <TableHead className="w-[12%] text-right">Attendance</TableHead>
                <TableHead className="w-[44px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => {
                const open = openRow === r.student_id;
                return (
                  <>
                    <TableRow
                      key={r.student_id}
                      onClick={() => setOpenRow(open ? null : r.student_id)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium">{r.student_id}</TableCell>
                      <TableCell>
                        <RiskBadge risk={r.risk_category} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.focus_topic ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-0 truncate text-muted-foreground">
                        {r.instructor_insight}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.attendance_pct != null ? `${r.attendance_pct}%` : "—"}
                      </TableCell>
                      <TableCell>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </TableCell>
                    </TableRow>

                    {open && (
                      <TableRow
                        key={`${r.student_id}-detail`}
                        className="bg-muted/40 hover:bg-muted/40"
                      >
                        <TableCell colSpan={6} className="p-6">
                          <div className="space-y-4">
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Full analysis
                              </p>
                              <p className="text-sm leading-relaxed">
                                {r.instructor_insight}
                              </p>
                            </div>

                            {(r.suggested_topics?.length ?? 0) > 0 && (
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Recommended for this student
                                </p>
                                <ul className="space-y-1.5">
                                  {r.suggested_topics.map((t) => (
                                    <li
                                      key={t}
                                      className="flex gap-2 text-sm text-muted-foreground"
                                    >
                                      <span className="text-primary">•</span>
                                      {t}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                              Generated{" "}
                              {new Date(r.generated_at).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}