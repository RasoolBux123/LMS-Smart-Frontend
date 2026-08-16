"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Shield,
  CalendarDays,
  BookOpen,
  X,
  UserCog,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AccountStatusBadge,
  RoleBadge,
  UserAvatar,
} from "@/features/admin/parts";
import type { ManagedUser } from "@/lib/api/users";
import { listUsers } from "@/lib/api/users";
import { listCourses, type Course } from "@/lib/api/courses";
import {
  enrollStudent,
  listUserEnrollments,
  unenrollStudent,
  type Enrollment,
} from "@/lib/api/enrollments";
import { cn, errorMessage, formatDate } from "@/lib/utils";

export function UserDetailDrawer({
  user,
  courses: ownedCourses,
  onClose,
  onEdit,
  onToggleStatus,
}: {
  user: ManagedUser | null;
  courses: Course[];
  onClose: () => void;
  onEdit: (user: ManagedUser) => void;
  onToggleStatus: (user: ManagedUser) => void;
}) {
  const open = Boolean(user);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<ManagedUser[]>([]);
  const [loadingEnroll, setLoadingEnroll] = useState(false);
  const [assignInstructorId, setAssignInstructorId] = useState("all");
  const [assignCourseId, setAssignCourseId] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "student") {
      setEnrollments([]);
      return;
    }
    let cancelled = false;
    setLoadingEnroll(true);
    Promise.all([
      listUserEnrollments(user.id),
      listCourses(),
      listUsers({ role: "instructor" }),
    ])
      .then(([eRes, cRes, iRes]) => {
        if (cancelled) return;
        setEnrollments(Array.isArray(eRes.data) ? eRes.data : []);
        setAllCourses(Array.isArray(cRes.data) ? cRes.data : []);
        setInstructors(Array.isArray(iRes.data) ? iRes.data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setEnrollments([]);
          setAllCourses([]);
          setInstructors([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEnroll(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((e) => e.courseId)),
    [enrollments],
  );

  const assignableCourses = useMemo(() => {
    let list = allCourses.filter((c) => !enrolledCourseIds.has(c.id));
    if (assignInstructorId && assignInstructorId !== "all") {
      list = list.filter((c) => c.instructorId === assignInstructorId);
    }
    return list;
  }, [allCourses, enrolledCourseIds, assignInstructorId]);

  async function handleAssign() {
    if (!user || !assignCourseId) return;
    setAssigning(true);
    try {
      const res = await enrollStudent(assignCourseId, user.id);
      setEnrollments((prev) => [res.data, ...prev]);
      setAssignCourseId("");
      toast.success("Course assigned to student");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not assign course."));
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnenroll(enrollmentId: string) {
    try {
      await unenrollStudent(enrollmentId);
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      toast.success("Course removed from student");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not remove course."));
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-200",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      role="dialog"
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {user && (
          <>
            <header className="flex items-start justify-between gap-4 border-b border-border p-6">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar name={user.name} role={user.role} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-semibold">
                    {user.name}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <RoleBadge role={user.role} />
                    <AccountStatusBadge status={user.status} />
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Account
                </h3>
                <DetailRow icon={Mail} label="Email" value={user.email} />
                <DetailRow
                  icon={Shield}
                  label="Role"
                  value={user.role}
                  className="capitalize"
                />
                <DetailRow
                  icon={CalendarDays}
                  label="Joined"
                  value={user.createdAt ? formatDate(user.createdAt) : "—"}
                />
              </section>

              {user.role === "instructor" && (
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Courses owned ({ownedCourses.length})
                  </h3>
                  {ownedCourses.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border-strong p-4 text-sm text-muted-foreground">
                      No courses assigned yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {ownedCourses.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center gap-3 rounded-xl border border-border p-3"
                        >
                          <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {c.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {c.studentCount ?? 0} students · {c.status}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {user.role === "student" && (
                <>
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Enrolled courses ({enrollments.length})
                    </h3>
                    {loadingEnroll ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading…
                      </div>
                    ) : enrollments.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border-strong p-4 text-sm text-muted-foreground">
                        Not enrolled in any course yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {enrollments.map((e) => {
                          const title =
                            e.course?.title ||
                            allCourses.find((c) => c.id === e.courseId)
                              ?.title ||
                            e.courseId;
                          return (
                            <li
                              key={e.id}
                              className="flex items-center gap-3 rounded-xl border border-border p-3"
                            >
                              <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {e.status}
                                  {e.enrolledAt
                                    ? ` · ${formatDate(e.enrolledAt)}`
                                    : ""}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-danger"
                                title="Remove from course"
                                onClick={() => handleUnenroll(e.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>

                  <section className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Plus className="h-3.5 w-3.5" />
                      Assign course
                    </h3>

                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <UserCog className="h-3.5 w-3.5" />
                        Filter by instructor
                      </label>
                      <Select
                        value={assignInstructorId}
                        onValueChange={(v) => {
                          setAssignInstructorId(v);
                          setAssignCourseId("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All instructors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All instructors</SelectItem>
                          {instructors.map((ins) => (
                            <SelectItem key={ins.id} value={ins.id}>
                              {ins.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        Course
                      </label>
                      <Select
                        value={assignCourseId || undefined}
                        onValueChange={setAssignCourseId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableCourses.length === 0 ? (
                            <SelectItem value="__none" disabled>
                              No courses available
                            </SelectItem>
                          ) : (
                            assignableCourses.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.title}
                                {c.instructorName
                                  ? ` · ${c.instructorName}`
                                  : ""}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="w-full"
                      disabled={!assignCourseId || assigning}
                      onClick={handleAssign}
                    >
                      {assigning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Assigning…
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Assign course
                        </>
                      )}
                    </Button>
                  </section>
                </>
              )}
            </div>

            <footer className="flex gap-2 border-t border-border p-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(user)}
              >
                Edit details
              </Button>
              <Button
                variant={
                  user.status === "suspended" ? "default" : "destructive"
                }
                className="flex-1"
                onClick={() => onToggleStatus(user)}
              >
                {user.status === "suspended" ? "Reactivate" : "Suspend"}
              </Button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("truncate text-sm font-medium", className)}>
          {value}
        </p>
      </div>
    </div>
  );
}










// "use client";

// import { Mail, Shield, CalendarDays, BookOpen, X } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { AccountStatusBadge, RoleBadge, UserAvatar } from "@/features/admin/parts";
// import type { ManagedUser } from "@/lib/api/users";
// import type { Course } from "@/lib/api/courses";
// import { cn, formatDate } from "@/lib/utils";

// export function UserDetailDrawer({
//   user,
//   courses,
//   onClose,
//   onEdit,
//   onToggleStatus,
// }: {
//   user: ManagedUser | null;
//   /** The instructor’s own courses; pass an empty array for students. */
//   courses: Course[];
//   onClose: () => void;
//   onEdit: (user: ManagedUser) => void;
//   onToggleStatus: (user: ManagedUser) => void;
// }) {
//   const open = Boolean(user);

//   return (
//     <div
//       className={cn(
//         "fixed inset-0 z-50 transition-opacity duration-200",
//         open ? "opacity-100" : "pointer-events-none opacity-0",
//       )}
//       role="dialog"
//       aria-hidden={!open}
//     >
//       <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]" onClick={onClose} />

//       <aside
//         className={cn(
//           "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300",
//           open ? "translate-x-0" : "translate-x-full",
//         )}
//       >
//         {user && (
//           <>
//             <header className="flex items-start justify-between gap-4 border-b border-border p-6">
//               <div className="flex min-w-0 items-center gap-3">
//                 <UserAvatar name={user.name} role={user.role} size="lg" />
//                 <div className="min-w-0">
//                   <h2 className="truncate font-display text-lg font-semibold">{user.name}</h2>
//                   <div className="mt-1.5 flex flex-wrap gap-1.5">
//                     <RoleBadge role={user.role} />
//                     <AccountStatusBadge status={user.status} />
//                   </div>
//                 </div>
//               </div>
//               <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
//                 <X className="h-4 w-4" />
//               </Button>
//             </header>

//             <div className="flex-1 space-y-6 overflow-y-auto p-6">
//               <section className="space-y-3">
//                 <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                   Account
//                 </h3>
//                 <DetailRow icon={Mail} label="Email" value={user.email} />
//                 <DetailRow icon={Shield} label="Role" value={user.role} className="capitalize" />
//                 <DetailRow
//                   icon={CalendarDays}
//                   label="Joined"
//                   value={user.createdAt ? formatDate(user.createdAt) : "—"}
//                 />
//               </section>

//               {user.role === "instructor" && (
//                 <section className="space-y-3">
//                   <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                     Courses owned ({courses.length})
//                   </h3>
//                   {courses.length === 0 ? (
//                     <p className="rounded-xl border border-dashed border-border-strong p-4 text-sm text-muted-foreground">
//                       No courses assigned yet.
//                     </p>
//                   ) : (
//                     <ul className="space-y-2">
//                       {courses.map((c) => (
//                         <li
//                           key={c.id}
//                           className="flex items-center gap-3 rounded-xl border border-border p-3"
//                         >
//                           <BookOpen className="h-4 w-4 shrink-0 text-primary" />
//                           <div className="min-w-0">
//                             <p className="truncate text-sm font-medium">{c.title}</p>
//                             <p className="text-xs text-muted-foreground">
//                               {c.studentCount ?? 0} students · {c.status}
//                             </p>
//                           </div>
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </section>
//               )}
//             </div>

//             <footer className="flex gap-2 border-t border-border p-4">
//               <Button variant="outline" className="flex-1" onClick={() => onEdit(user)}>
//                 Edit details
//               </Button>
//               <Button
//                 variant={user.status === "suspended" ? "default" : "destructive"}
//                 className="flex-1"
//                 onClick={() => onToggleStatus(user)}
//               >
//                 {user.status === "suspended" ? "Reactivate" : "Suspend"}
//               </Button>
//             </footer>
//           </>
//         )}
//       </aside>
//     </div>
//   );
// }

// function DetailRow({
//   icon: Icon,
//   label,
//   value,
//   className,
// }: {
//   icon: React.ElementType;
//   label: string;
//   value: string;
//   className?: string;
// }) {
//   return (
//     <div className="flex items-start gap-3">
//       <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
//         <Icon className="h-4 w-4 text-muted-foreground" />
//       </div>
//       <div className="min-w-0">
//         <p className="text-xs text-muted-foreground">{label}</p>
//         <p className={cn("truncate text-sm font-medium", className)}>{value}</p>
//       </div>
//     </div>
//   );
// }