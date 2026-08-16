"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  FolderPlus,
  BarChart3,
  AlertTriangle,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AdminHeader,
  CourseStatusBadge,
  ErrorNote,
  RoleBadge,
  UserAvatar,
} from "@/features/admin/parts";
import { listUsers, type ManagedUser } from "@/lib/api/users";
import { listCourses, type Course } from "@/lib/api/courses";
import { listPrograms, type Program } from "@/lib/api/programs";
import { errorMessage, formatDate } from "@/lib/utils";

/** Makes a StatCard clickable — clicking opens the full page for that data. */
function StatLink({
  href,
  label,
  value,
  icon,
  tone,
  delta,
  index,
}: {
  href: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: "primary" | "accent" | "success" | "warning" | "danger" | "info";
  delta?: string;
  index: number;
}) {
  return (
    <Link
      href={href}
      aria-label={`${label} — view all`}
      className="block rounded-2xl transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <StatCard
        label={label}
        value={value}
        icon={icon}
        tone={tone}
        delta={delta}
        index={index}
      />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [u, c, p] = await Promise.all([
        listUsers(),
        listCourses(),
        listPrograms(),
      ]);
      setUsers(u.data);
      setCourses(c.data);
      setPrograms(p.data);
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not load dashboard data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === "admin");
    const instructors = users.filter((u) => u.role === "instructor");
    const students = users.filter((u) => u.role === "student");
    return {
      admins,
      instructors,
      students,
      suspended: users.filter((u) => u.status === "suspended"),
      unassigned: courses.filter((c) => !c.instructorId),
      assignedInstructors: new Set(
        courses.map((c) => c.instructorId).filter(Boolean),
      ).size,
      activePrograms: programs.filter((p) => p.status === "active").length,
    };
  }, [users, courses, programs]);

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 5),
    [users],
  );

  const recentCourses = useMemo(
    () =>
      [...courses]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 5),
    [courses],
  );

  return (
    <div className="space-y-6">
      <AdminHeader title="Platform overview">
        <Button asChild variant="outline">
          <Link href="/admin/analytics">
            <BarChart3 className="h-4 w-4" /> Analytics
          </Link>
        </Button>
        <Button asChild>
          <Link href="/admin/users">
            <UserPlus className="h-4 w-4" /> Manage users
          </Link>
        </Button>
      </AdminHeader>

      {error && <ErrorNote message={error} onRetry={load} />}

      {/* Stats: Admins → Instructors → Students → Courses → Programs */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatLink
            href="/admin/admins"
            label="Admins"
            value={stats.admins.length}
            icon={ShieldCheck}
            tone="warning"
            delta={`${stats.suspended.length} suspended accounts`}
            index={0}
          />
          <StatLink
            href="/admin/instructors"
            label="Instructors"
            value={stats.instructors.length}
            icon={GraduationCap}
            tone="primary"
            delta={`${stats.assignedInstructors} teaching a course`}
            index={1}
          />
          <StatLink
            href="/admin/students"
            label="Students"
            value={stats.students.length}
            icon={Users}
            tone="accent"
            delta={`${stats.students.filter((s) => s.status === "active").length} active`}
            index={2}
          />
          <StatLink
            href="/admin/courses"
            label="Courses"
            value={courses.length}
            icon={BookOpen}
            tone="info"
            delta={`${stats.unassigned.length} unassigned`}
            index={3}
          />
          <StatLink
            href="/admin/programs"
            label="Programs"
            value={programs.length}
            icon={Layers}
            tone="success"
            delta={`${stats.activePrograms} active`}
            index={4}
          />
        </div>
      )}

      {/* Attention needed */}
      {!loading && (stats.unassigned.length > 0 || stats.suspended.length > 0) && (
        <Card className="border-warning/30 bg-warning-soft">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-medium text-warning">Attention needed</p>
                <p className="text-sm text-warning/90">
                  {stats.unassigned.length > 0 &&
                    `${stats.unassigned.length} course(s) have no instructor assigned. `}
                  {stats.suspended.length > 0 &&
                    `${stats.suspended.length} account(s) are suspended.`}
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={stats.unassigned.length > 0 ? "/admin/courses" : "/admin/users"}>
                Review
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent users */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent accounts</CardTitle>
            <Link
              href="/admin/users"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : recentUsers.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title="No accounts"
                description="Add your first instructor or student."
                action={
                  <Button asChild size="sm">
                    <Link href="/admin/students">Add user</Link>
                  </Button>
                }
                className="py-10"
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <UserAvatar name={u.name} role={u.role} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <RoleBadge role={u.role} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent courses */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent courses</CardTitle>
            <Link
              href="/admin/courses"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : recentCourses.length === 0 ? (
              <EmptyState
                icon={FolderPlus}
                title="No courses"
                description="Create your first course and assign an instructor."
                action={
                  <Button asChild size="sm">
                    <Link href="/admin/courses">Create course</Link>
                  </Button>
                }
                className="py-10"
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentCourses.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.createdAt ? formatDate(c.createdAt) : "—"} ·{" "}
                        {c.studentCount ?? 0} students
                      </p>
                    </div>
                    <CourseStatusBadge status={String(c.status)} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}








// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";
// import Link from "next/link";
// import {
//   Users,
//   GraduationCap,
//   BookOpen,
//   ShieldCheck,
//   ArrowRight,
//   UserPlus,
//   FolderPlus,
//   BarChart3,
//   AlertTriangle,
//   type LucideIcon,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Skeleton } from "@/components/ui/skeleton";
// import { StatCard } from "@/components/shared/stat-card";
// import { EmptyState } from "@/components/shared/empty-state";
// import {
//   AdminHeader,
//   CourseStatusBadge,
//   ErrorNote,
//   RoleBadge,
//   UserAvatar,
// } from "@/features/admin/parts";
// import { listUsers, type ManagedUser } from "@/lib/api/users";
// import { listCourses, type Course } from "@/lib/api/courses";
// import { errorMessage, formatDate } from "@/lib/utils";

// /** Makes a StatCard clickable — clicking opens the full page for that data. */
// function StatLink({
//   href,
//   label,
//   value,
//   icon,
//   tone,
//   delta,
//   index,
// }: {
//   href: string;
//   label: string;
//   value: string | number;
//   icon: LucideIcon;
//   tone: "primary" | "accent" | "success" | "warning" | "danger" | "info";
//   delta?: string;
//   index: number;
// }) {
//   return (
//     <Link
//       href={href}
//       aria-label={`${label} — view all`}
//       className="block rounded-2xl transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
//     >
//       <StatCard
//         label={label}
//         value={value}
//         icon={icon}
//         tone={tone}
//         delta={delta}
//         index={index}
//       />
//     </Link>
//   );
// }

// export default function AdminDashboardPage() {
//   const [users, setUsers] = useState<ManagedUser[]>([]);
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const load = useCallback(async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const [u, c] = await Promise.all([listUsers(), listCourses()]);
//       setUsers(u.data);
//       setCourses(c.data);
//     } catch (err: unknown) {
//       setError(errorMessage(err, "Could not load dashboard data."));
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     load();
//   }, [load]);

//   const stats = useMemo(() => {
//     const admins = users.filter((u) => u.role === "admin");
//     const instructors = users.filter((u) => u.role === "instructor");
//     const students = users.filter((u) => u.role === "student");
//     return {
//       admins,
//       instructors,
//       students,
//       suspended: users.filter((u) => u.status === "suspended"),
//       unassigned: courses.filter((c) => !c.instructorId),
//       assignedInstructors: new Set(
//         courses.map((c) => c.instructorId).filter(Boolean),
//       ).size,
//     };
//   }, [users, courses]);

//   const recentUsers = useMemo(
//     () =>
//       [...users]
//         .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
//         .slice(0, 5),
//     [users],
//   );

//   const recentCourses = useMemo(
//     () =>
//       [...courses]
//         .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
//         .slice(0, 5),
//     [courses],
//   );

//   return (
//     <div className="space-y-6">
//       <AdminHeader
//         title="Platform overview"
//         // description="Users, courses aur platform ki sehat — sab ek jagah."
//       >
//         <Button asChild variant="outline">
//           <Link href="/admin/analytics">
//             <BarChart3 className="h-4 w-4" /> Analytics
//           </Link>
//         </Button>
//         <Button asChild>
//           <Link href="/admin/users">
//             <UserPlus className="h-4 w-4" /> Manage users
//           </Link>
//         </Button>
//       </AdminHeader>

//       {error && <ErrorNote message={error} onRetry={load} />}

//       {/* Order: Admins → Instructors → Students → Courses. Har card clickable. */}
//       {loading ? (
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//           {Array.from({ length: 4 }).map((_, i) => (
//             <Skeleton key={i} className="h-[116px] rounded-2xl" />
//           ))}
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//           <StatLink
//             href="/admin/admins"
//             label="Admins"
//             value={stats.admins.length}
//             icon={ShieldCheck}
//             tone="warning"
//             delta={`${stats.suspended.length} suspended accounts`}
//             index={0}
//           />
//           <StatLink
//             href="/admin/instructors"
//             label="Instructors"
//             value={stats.instructors.length}
//             icon={GraduationCap}
//             tone="primary"
//             delta={`${stats.assignedInstructors} teaching a course`}
//             index={1}
//           />
//           <StatLink
//             href="/admin/students"
//             label="Students"
//             value={stats.students.length}
//             icon={Users}
//             tone="accent"
//             delta={`${stats.students.filter((s) => s.status === "active").length} active`}
//             index={2}
//           />
//           <StatLink
//             href="/admin/courses"
//             label="Courses"
//             value={courses.length}
//             icon={BookOpen}
//             tone="info"
//             delta={`${stats.unassigned.length} unassigned`}
//             index={3}
//           />
//         </div>
//       )}

//       {/* Attention needed */}
//       {!loading && (stats.unassigned.length > 0 || stats.suspended.length > 0) && (
//         <Card className="border-warning/30 bg-warning-soft">
//           <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
//             <div className="flex items-start gap-3">
//               <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
//               <div>
//                 <p className="text-sm font-medium text-warning">Attention needed</p>
//                 <p className="text-sm text-warning/90">
//                   {stats.unassigned.length > 0 &&
//                     `${stats.unassigned.length} course(s) have no instructor assigned. `}
//                   {stats.suspended.length > 0 &&
//                     `${stats.suspended.length} account(s) are suspended.`}
//                 </p>
//               </div>
//             </div>
//             <Button asChild size="sm" variant="outline">
//               <Link href={stats.unassigned.length > 0 ? "/admin/courses" : "/admin/users"}>
//                 Review
//               </Link>
//             </Button>
//           </CardContent>
//         </Card>
//       )}

//       <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
//         {/* Recent users */}
//         <Card>
//           <CardHeader className="flex-row items-center justify-between">
//             <CardTitle>Recent accounts</CardTitle>
//             <Link
//               href="/admin/users"
//               className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
//             >
//               View all <ArrowRight className="h-3.5 w-3.5" />
//             </Link>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <div className="space-y-3">
//                 {Array.from({ length: 4 }).map((_, i) => (
//                   <Skeleton key={i} className="h-12 w-full rounded-xl" />
//                 ))}
//               </div>
//             ) : recentUsers.length === 0 ? (
//               <EmptyState
//                 icon={UserPlus}
//                 title="No accounts"
//                 description="Add your first instructor or student."
//                 action={
//                   <Button asChild size="sm">
//                     <Link href="/admin/students">Add user</Link>
//                   </Button>
//                 }
//                 className="py-10"
//               />
//             ) : (
//               <ul className="divide-y divide-border">
//                 {recentUsers.map((u) => (
//                   <li key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
//                     <UserAvatar name={u.name} role={u.role} />
//                     <div className="min-w-0 flex-1">
//                       <p className="truncate text-sm font-medium">{u.name}</p>
//                       <p className="truncate text-xs text-muted-foreground">{u.email}</p>
//                     </div>
//                     <RoleBadge role={u.role} />
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </CardContent>
//         </Card>

//         {/* Recent courses */}
//         <Card>
//           <CardHeader className="flex-row items-center justify-between">
//             <CardTitle>Recent courses</CardTitle>
//             <Link
//               href="/admin/courses"
//               className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
//             >
//               View all <ArrowRight className="h-3.5 w-3.5" />
//             </Link>
//           </CardHeader>
//           <CardContent>
//             {loading ? (
//               <div className="space-y-3">
//                 {Array.from({ length: 4 }).map((_, i) => (
//                   <Skeleton key={i} className="h-12 w-full rounded-xl" />
//                 ))}
//               </div>
//             ) : recentCourses.length === 0 ? (
//               <EmptyState
//                 icon={FolderPlus}
//                 title="No courses"
//                 description="Create your first course and assign an instructor."
//                 action={
//                   <Button asChild size="sm">
//                     <Link href="/admin/courses">Create course</Link>
//                   </Button>
//                 }
//                 className="py-10"
//               />
//             ) : (
//               <ul className="divide-y divide-border">
//                 {recentCourses.map((c) => (
//                   <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
//                     <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
//                       <BookOpen className="h-4 w-4 text-primary" />
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <p className="truncate text-sm font-medium">{c.title}</p>
//                       <p className="truncate text-xs text-muted-foreground">
//                         {c.createdAt ? formatDate(c.createdAt) : "—"} ·{" "}
//                         {c.studentCount ?? 0} students
//                       </p>
//                     </div>
//                     <CourseStatusBadge status={String(c.status)} />
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }


