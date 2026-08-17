"use client";

import { useEffect, useState } from "react";
import { listCourses, type Course } from "@/lib/api/courses";
import {
  getAdminInsights,
  getCourseInsightsList,
  type AdminInsightStats,
  type AIInsight,
} from "@/lib/api/aiInsights";
import { AdminRiskOverview } from "@/components/ai/AdminRiskOverview";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const badgeColor: Record<string, string> = {
  top: "bg-green-100 text-green-700",
  on_track: "bg-blue-100 text-blue-700",
  at_risk: "bg-orange-100 text-orange-700",
  failure_risk: "bg-red-100 text-red-700",
  incomplete_data: "bg-gray-100 text-gray-700",
};

const riskLabel: Record<string, string> = {
  top: "Top Performer",
  on_track: "On Track",
  at_risk: "At Risk",
  failure_risk: "Failure Risk",
  incomplete_data: "Incomplete Data",
};

export default function InstructorAIInsightsPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [stats, setStats] = useState<AdminInsightStats | null>(null);
  const [studentInsights, setStudentInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);

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
    setLoadingList(true);
    Promise.all([getAdminInsights(courseId), getCourseInsightsList(courseId)])
      .then(([statsRes, listRes]) => {
        setStats(statsRes);
        setStudentInsights(listRes);
      })
      .catch(() => toast.error("Could not load AI insights."))
      .finally(() => setLoadingList(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-generated risk analysis and recommendations across your students.
          </p>
        </div>

        <Select value={courseId || undefined} onValueChange={setCourseId}>
          <SelectTrigger className="w-full sm:w-56">
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

      {loadingList ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading insights…
        </div>
      ) : !stats || stats.total_students === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No AI insights yet"
          description="Insights are generated automatically when you view a student's grading report."
        />
      ) : (
        <>
          <AdminRiskOverview courseId={courseId} />

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Insight</th>
                    <th className="px-4 py-3">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {studentInsights.map((insight) => (
                    <tr
                      key={insight.student_id}
                      className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-secondary/30"
                      onClick={() =>
                        router.push(
                          `/instructor/grading?courseId=${courseId}&studentEmail=${encodeURIComponent(
                            insight.student_id
                          )}`
                        )
                      }
                    >
                      <td className="px-4 py-3 font-medium">{insight.student_id}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor[insight.risk_category]}`}
                        >
                          {riskLabel[insight.risk_category]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-md truncate">
                        {insight.instructor_insight}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {insight.attendance_pct !== null ? `${insight.attendance_pct}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}