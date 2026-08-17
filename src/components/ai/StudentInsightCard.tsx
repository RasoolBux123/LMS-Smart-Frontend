// components/StudentInsightCard.tsx
"use client";
import { useEffect, useState } from "react";
import { getStudentInsight, type StudentInsightView } from "@/lib/api/aiInsights";

export function StudentInsightCard({
  courseId,
  studentId,
}: {
  courseId: string;
  studentId: string; // eventually replace with value pulled from your auth/session context
}) {
  const [insight, setInsight] = useState<StudentInsightView | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStudentInsight(courseId, studentId)
      .then((data) => {
        if (!cancelled) setInsight(data);
      })
      .catch(() => {
        if (!cancelled) setInsight(null);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, studentId]);

  if (!insight) return null;

  const topics = insight.suggested_topics ?? [];

  return (
    <div className="rounded-xl border p-4 bg-purple-50">
      <p className="text-sm text-gray-800">{insight.student_message}</p>

      {insight.focus_topic && (
        <p className="text-xs text-purple-600 mt-2">📌 Focus on: {insight.focus_topic}</p>
      )}

      {insight.attendance_pct != null && (
        <p className="text-xs text-gray-500 mt-1">Attendance: {insight.attendance_pct}%</p>
      )}

      {topics.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-600 mb-1.5">
            Suggested topics to review:
          </p>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}