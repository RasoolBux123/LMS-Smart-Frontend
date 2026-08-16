"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminHeader,
  CourseStatusBadge,
  ErrorNote,
  SearchField,
  TableRowsSkeleton,
} from "@/features/admin/parts";
import { CourseDialog } from "@/features/admin/course-dialog";
import {
  deleteCourse,
  listCourses,
  type Course,
} from "@/lib/api/courses";
import { listUsers, type ManagedUser } from "@/lib/api/users";
import { errorMessage, formatDate } from "@/lib/utils";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [c, i] = await Promise.all([listCourses(), listUsers("instructor")]);
      setCourses(c.data);
      setInstructors(i.data);
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not load courses."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const instructorName = useCallback(
    (course: Course) => {
      if (course.instructorName) return course.instructorName;
      const found = instructors.find((i) => i.id === course.instructorId);
      return found?.name ?? "Unassigned";
    },
    [instructors],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses
      .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter))
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [courses, search, statusFilter]);

  const totalStudents = useMemo(
    () => courses.reduce((sum, c) => sum + (c.studentCount ?? 0), 0),
    [courses],
  );

  function upsert(course: Course, mode: "create" | "edit") {
    setCourses((prev) =>
      mode === "create" ? [course, ...prev] : prev.map((c) => (c.id === course.id ? course : c)),
    );
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    try {
      await deleteCourse(target.id);
      setCourses((prev) => prev.filter((c) => c.id !== target.id));
      toast.success(`"${target.title}" delete ho gaya`);
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not delete the course."));
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="All courses"
        description={`${courses.length} courses · ${totalStudents} enrollments platform-wide.`}
      >
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <FolderPlus className="h-4 w-4" /> New course
        </Button>
      </AdminHeader>

      {error && <ErrorNote message={error} onRetry={load} />}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search courses…"
          className="sm:w-80"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead className="hidden md:table-cell">Instructor</TableHead>
              <TableHead className="hidden sm:table-cell">Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRowsSkeleton rows={5} cols={6} />}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={BookOpen}
                    title={search ? "No courses found" : "No courses yet"}
                    description={
                      search
                        ? "Try a different search term."
                        : "Create your first course and assign an instructor."
                    }
                    className="border-0"
                    action={
                      !search ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditing(null);
                            setDialogOpen(true);
                          }}
                        >
                          Create course
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 max-w-[260px]">
                        <p className="truncate font-medium">{c.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span
                      className={
                        c.instructorId ? "text-muted-foreground" : "text-warning"
                      }
                    >
                      {instructorName(c)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {c.studentCount ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <CourseStatusBadge status={String(c.status)} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {c.createdAt ? formatDate(c.createdAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${c.title}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(c);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-danger focus:text-danger"
                          onClick={() => setPendingDelete(c)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <CourseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={editing}
        instructors={instructors}
        onSaved={upsert}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this course?"
        description={`"${pendingDelete?.title ?? ""}" aur uski enrollments delete ho jayengi.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}







// "use client";

// import { useEffect, useState } from "react";
// import { listCourses, Course } from "@/lib/api/courses";

// export default function AdminCoursesPage() {
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     listCourses()
//       .then((res) => setCourses(res.data))
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, []);

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="font-display text-2xl font-semibold text-foreground">All courses</h2>
//         <p className="mt-1 text-sm text-muted-foreground">Platform-wide course catalog.</p>
//       </div>

//       <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="border-b border-border bg-surface-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
//               <th className="px-6 py-3">Title</th>
//               <th className="px-6 py-3">Description</th>
//               <th className="px-6 py-3">Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading && (
//               <tr>
//                 <td colSpan={3} className="px-6 py-10 text-center text-faint-foreground">
//                   Loading…
//                 </td>
//               </tr>
//             )}
//             {!loading && courses.length === 0 && (
//               <tr>
//                 <td colSpan={3} className="px-6 py-10 text-center text-faint-foreground">
//                   No courses yet.
//                 </td>
//               </tr>
//             )}
//             {courses.map((c) => (
//               <tr key={c.id} className="border-b border-slate-50 last:border-0">
//                 <td className="px-6 py-4 font-medium text-foreground">{c.title}</td>
//                 <td className="px-6 py-4 text-muted-foreground line-clamp-2">{c.description || "—"}</td>
//                 <td className="px-6 py-4 capitalize text-muted-foreground">{c.status}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
