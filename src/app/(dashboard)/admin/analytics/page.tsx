"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, TrendingUp, UserCheck, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { AdminHeader, ErrorNote } from "@/features/admin/parts";
import { listUsers, type ManagedUser } from "@/lib/api/users";
import { listCourses, type Course } from "@/lib/api/courses";
import { errorMessage } from "@/lib/utils";

const COLORS = ["var(--primary)", "var(--accent)", "var(--warning)", "var(--info)"];

export default function AdminAnalyticsPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [u, c] = await Promise.all([listUsers(), listCourses()]);
      setUsers(u.data);
      setCourses(c.data);
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not load analytics data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleData = useMemo(
    () => [
      { name: "Students", value: users.filter((u) => u.role === "student").length },
      { name: "Instructors", value: users.filter((u) => u.role === "instructor").length },
      { name: "Admins", value: users.filter((u) => u.role === "admin").length },
    ],
    [users],
  );

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    courses.forEach((c) => map.set(String(c.status), (map.get(String(c.status)) ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [courses]);

  const topCourses = useMemo(
    () =>
      [...courses]
        .sort((a, b) => (b.studentCount ?? 0) - (a.studentCount ?? 0))
        .slice(0, 6)
        .map((c) => ({
          name: c.title.length > 18 ? `${c.title.slice(0, 18)}…` : c.title,
          students: c.studentCount ?? 0,
        })),
    [courses],
  );

  const totalEnrollments = courses.reduce((s, c) => s + (c.studentCount ?? 0), 0);
  const studentCount = roleData[0].value;
  const activeRate =
    users.length === 0
      ? 0
      : Math.round((users.filter((u) => u.status !== "suspended").length / users.length) * 100);
  const avgPerCourse = courses.length === 0 ? 0 : Math.round(totalEnrollments / courses.length);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminHeader title="Analytics" description="Platform ke numbers ek nazar me." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader title="Analytics" />

      {error && <ErrorNote message={error} onRetry={load} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={users.length} icon={UserCheck} tone="primary" index={0} />
        <StatCard label="Total enrollments" value={totalEnrollments} icon={Layers} tone="accent" index={1} />
        <StatCard
          label="Avg students / course"
          value={avgPerCourse}
          icon={TrendingUp}
          tone="info"
          index={2}
        />
        <StatCard
          label="Active accounts"
          value={`${activeRate}%`}
          icon={BarChart3}
          tone="success"
          delta={`${studentCount} students`}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users by role</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData}>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--surface-muted)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Courses by status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {statusData.length === 0 ? (
              <p className="pt-20 text-center text-sm text-muted-foreground">
                No courses yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top courses by enrollment</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {topCourses.length === 0 ? (
            <p className="pt-24 text-center text-sm text-muted-foreground">
              No enrolment data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCourses} layout="vertical" margin={{ left: 24 }}>
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--surface-muted)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                  }}
                />
                <Bar dataKey="students" fill="var(--primary)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}






// "use client";

// import ComingSoon from "@/app/components/ui/ComingSoon";

// export default function AdminAnalyticsPage() {
//   return (
//     <ComingSoon
//       title="Analytics coming in Week 3"
//       description="Platform KPIs, risk indicators, and AI-backed insights will land with the analytics module."
//     />
//   );
// }
