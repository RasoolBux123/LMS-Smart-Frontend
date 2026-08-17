// components/AdminRiskOverview.tsx
"use client";
import { useEffect, useState } from "react";
import { getAdminInsights, AdminInsightStats } from "@/lib//api/aiInsights";

export function AdminRiskOverview({ courseId }: { courseId: string }) {
  const [stats, setStats] = useState<AdminInsightStats | null>(null);

  useEffect(() => {
    getAdminInsights(courseId).then(setStats);
  }, [courseId]);

  if (!stats) return null;

  const labels: Record<string, string> = {
    top: "Top Performers",
    on_track: "On Track",
    at_risk: "At Risk",
    failure_risk: "Failure Risk",
    incomplete_data: "Incomplete Data",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {Object.entries(stats.risk_counts).map(([key, val]) => (
        <div key={key} className="rounded-xl border p-4 bg-white">
          <div className="text-2xl font-semibold">{val}</div>
          <div className="text-sm text-gray-500">{labels[key] ?? key}</div>
          <div className="text-xs text-gray-400">{stats.risk_percentages[key]}%</div>
        </div>
      ))}
    </div>
  );
}