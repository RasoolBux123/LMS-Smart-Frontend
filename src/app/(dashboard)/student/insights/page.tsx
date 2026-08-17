"use client";

import { useEffect, useState } from "react";
import { listCourses, type Course } from "@/lib/api/courses";
import { getStudentInsight, type StudentInsightView } from "@/lib/api/aiInsights";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Sparkles, Loader2, Target, CalendarCheck } from "lucide-react";
import { toast } from "sonner";

export default function StudentAIInsightsPage() {
  const { user } = useCurrentUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [insight, setInsight] = useState<StudentInsightView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(false);

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
    if (!courseId || !user?.email) return;
    setLoadingInsight(true);
    getStudentInsight(courseId, user.email)
      .then(setInsight)
      .catch(() => toast.error("Could not load AI insight."))
      .finally(() => setLoadingInsight(false));
  }, [courseId, user?.email]);

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
            Personalized feedback based on your grades and attendance.
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
        <Card className="border-primary/20 bg-primary-soft/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Personalized Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base text-foreground leading-relaxed">
              {insight.student_message}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              {insight.focus_topic && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  <Target className="h-4 w-4 text-primary" />
                  <span>
                    Focus on: <strong>{insight.focus_topic}</strong>
                  </span>
                </div>
              )}
              {insight.attendance_pct !== null && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  <span>
                    Attendance: <strong>{insight.attendance_pct}%</strong>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}