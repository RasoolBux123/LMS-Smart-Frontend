// components/InstructorInsightCard.tsx
"use client";
import { useEffect, useState } from "react";
import { getInstructorInsight, AIInsight } from "../../lib/api/aiInsights";

const badgeColor: Record<string, string> = {
  top: "bg-green-100 text-green-700",
  on_track: "bg-blue-100 text-blue-700",
  at_risk: "bg-orange-100 text-orange-700",
  failure_risk: "bg-red-100 text-red-700",
  incomplete_data: "bg-gray-100 text-gray-700",
};

export function InstructorInsightCard({
  studentId,
  courseId,
}: {
  studentId: string;
  courseId: string;
}) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!studentId || !courseId) return;
  setLoading(true);
  getInstructorInsight(studentId, courseId)
    .then(setInsight)
    .finally(() => setLoading(false));
}, [studentId, courseId]);
  if (loading) return <div className="text-sm text-gray-400 mt-4">Loading AI insight...</div>;
  if (!insight) return null;

  return (
    <div className="rounded-xl border p-4 mt-4 bg-white">
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor[insight.risk_category]}`}>
          {insight.risk_category.replace("_", " ")}
        </span>
        {insight.attendance_pct !== null && (
          <span className="text-xs text-gray-500">Attendance: {insight.attendance_pct}%</span>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-700">{insight.instructor_insight}</p>
      {insight.focus_topic && (
        <p className="mt-1 text-xs text-purple-600">📌 Suggested focus: {insight.focus_topic}</p>
      )}
    </div>
  );
}