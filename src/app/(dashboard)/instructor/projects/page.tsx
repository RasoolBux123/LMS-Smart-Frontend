"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Send,
  Archive,
  Eye,
  FileX2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { EmptyState } from "@/components/shared/empty-state";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { AssignmentStatusBadge } from "@/components/shared/status-badge";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { projectsApi } from "@/lib/api/coursework";
import type { AssignmentListItem, AssignmentStatus } from "@/types/assignment";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/utils";

/** Deadlines arrive as ISO strings; show something readable, or a dash. */
function formatDeadline(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InstructorProjectsPage() {
  const { user } = useAuth();

  /*
   * Rows come from the API. This page previously held
   * `const initialProjects: ProjectRow[] = []`, so nothing ever appeared here
   * no matter how many projects were created.
   */
  const [rows, setRows] = useState<AssignmentListItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    /* Scope to the signed-in instructor; admins see everything. */
    const params =
      user?.role === "instructor" && user.id ? { instructorId: user.id } : {};

    projectsApi
      .list(params)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(errorMessage(err, "Could not load projects."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((project) => {
      if (status !== "all" && project.status !== status) return false;
      if (!term) return true;
      return project.title.toLowerCase().includes(term);
    });
  }, [rows, search, status]);

  async function duplicate(id: string) {
    try {
      const copy = await projectsApi.duplicate(id);
      setRows((prev) => [copy, ...prev]);
      toast.success("Project duplicated.");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not duplicate the project."));
    }
  }

  async function setPublishState(id: string, next: AssignmentStatus) {
    /*
     * Optimistic: the badge flips immediately, and the previous value is
     * restored if the request fails — otherwise the row would keep showing
     * a state the server never accepted.
     */
    const previous = rows.find((project) => project.id === id)?.status;

    setRows((prev) =>
      prev.map((project) => (project.id === id ? { ...project, status: next } : project)),
    );

    try {
      await projectsApi.updateStatus(id, next);

      toast.success(
        next === "published"
          ? "Project published."
          : next === "archived"
            ? "Project archived."
            : "Moved to draft.",
      );
    } catch (err: unknown) {
      if (previous) {
        setRows((prev) =>
          prev.map((project) =>
            project.id === id ? { ...project, status: previous } : project,
          ),
        );
      }
      toast.error(errorMessage(err, "Could not update the status."));
    }
  }

  async function remove(id: string) {
    try {
      await projectsApi.remove(id);
      setRows((prev) => prev.filter((project) => project.id !== id));
      toast.success("Project deleted.");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not delete the project."));
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Projects
          </h1>

          <p className="text-sm text-muted-foreground">
            Create, publish, and manage projects across your courses.
          </p>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/instructor/projects/create">
            <Plus className="h-4 w-4" />
            Create Project
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground" />

          <Input
            placeholder="Search projects..."

            aria-label="Search projects"

            className="pl-9"

            value={search}

            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>

            <SelectItem value="published">Published</SelectItem>

            <SelectItem value="draft">Draft</SelectItem>

            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading projects…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileX2}

            title={
              search || status !== "all"
                ? "No projects match your filters"
                : "No projects yet"
            }

            description={
              search || status !== "all"
                ? "Try another search term or clear the status filter."
                : "Create your first project to get started."
            }

            action={
              !search && status === "all" ? (
                <Button asChild>
                  <Link href="/instructor/projects/create">Create Project</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          /* Seven columns cannot reflow on a phone, so the table scrolls
             inside the card rather than widening the page. */
          <div className="table-scroll scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>

                  <TableHead>Course</TableHead>

                  <TableHead>Deadline</TableHead>

                  <TableHead>Marks</TableHead>

                  <TableHead>Submissions</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium text-foreground">
                      {project.title}
                    </TableCell>

                    <TableCell>
                      {project.course?.code || project.course?.title || "—"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {formatDeadline(project.deadline)}
                    </TableCell>

                    <TableCell>{project.totalMarks} pts</TableCell>

                    <TableCell>
                      {project.submittedCount ?? 0}/{project.enrolled ?? 0}
                    </TableCell>

                    <TableCell>
                      <AssignmentStatusBadge status={project.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/instructor/projects/${project.id}/submissions`}
                            >
                              <Eye className="h-4 w-4" />
                              View submissions
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>
                            <Link href={`/instructor/projects/edit/${project.id}`}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => duplicate(project.id)}>
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {project.status !== "published" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setPublishState(project.id, "published")
                              }
                            >
                              <Send className="h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          )}

                          {project.status !== "archived" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setPublishState(project.id, "archived")
                              }
                            >
                              <Archive className="h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            destructive
                            onClick={() => setDeleteId(project.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}

        onOpenChange={(open) => !open && setDeleteId(null)}

        title="Delete this project?"

        description="This will permanently remove the project and any submissions attached to it. This action cannot be undone."

        confirmLabel="Delete project"

        onConfirm={() => deleteId && remove(deleteId)}
      />
    </div>
  );
}






// "use client";

// import { useMemo, useState } from "react";
// import Link from "next/link";
// import { toast } from "sonner";

// import {
//   Plus,
//   Search,
//   MoreHorizontal,
//   Pencil,
//   Copy,
//   Trash2,
//   Send,
//   Archive,
//   Eye,
//   FileX2,
// } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";

// import {
//   Table,
//   TableHeader,
//   TableBody,
//   TableRow,
//   TableHead,
//   TableCell,
// } from "@/components/ui/table";

// import { EmptyState } from "@/components/shared/empty-state";

// import { ConfirmDialog } from "@/components/shared/confirm-dialog";

// import { AssignmentStatusBadge } from "@/components/shared/status-badge";
// import type { AssignmentStatusMeta } from "@/types";

// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu";

// type ProjectRow = {
//   id: string;
//   title: string;
//   course: { code: string };
//   deadline: string;
//   totalMarks: number;
//   submittedCount: number;
//   enrolled: number;
//   status: AssignmentStatusMeta;
// };

// const initialProjects: ProjectRow[] = [];

// export default function InstructorProjectsPage() {
//   const [rows, setRows] = useState(initialProjects);

//   const [search, setSearch] = useState("");

//   const [status, setStatus] = useState("all");

//   const [deleteId, setDeleteId] = useState<string | null>(null);

//   const filtered = useMemo(() => {
//     let out = rows.filter((p) =>
//       p.title.toLowerCase().includes(search.toLowerCase()),
//     );

//     if (status !== "all") out = out.filter((p) => p.status === status);

//     return out;
//   }, [rows, search, status]);

//   function duplicate(id: string) {
//     const source = rows.find((p) => p.id === id);

//     if (!source) return;

//     const copy: ProjectRow = {
//       ...source,

//       id: `${source.id}-copy-${Date.now()}`,

//       title: `${source.title} (copy)`,

//       status: "draft",
//     };

//     setRows((prev) => [copy, ...prev]);

//     toast.success("Project duplicated.");
//   }

//   function setPublishState(id: string, s: "published" | "archived" | "draft") {
//     setRows((prev) =>
//       prev.map((p) =>
//         p.id === id
//           ? {
//               ...p,
//               status: s,
//             }
//           : p,
//       ),
//     );

//     toast.success(
//       s === "published"
//         ? "Project published."
//         : s === "archived"
//           ? "Project archived."
//           : "Moved to draft.",
//     );
//   }

//   function remove(id: string) {
//     setRows((prev) => prev.filter((p) => p.id !== id));

//     toast.success("Project deleted.");
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="font-display text-2xl font-semibold">Projects</h1>

//           <p className="text-sm text-muted-foreground">
//             Create, publish, and manage projects across your courses.
//           </p>
//         </div>

//         <Button asChild>
//           <Link href="/instructor/projects/create">
//             <Plus className="h-4 w-4" />
//             Create Project
//           </Link>
//         </Button>
//       </div>

//       <div className="flex flex-col gap-3 sm:flex-row">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

//           <Input
//             placeholder="Search projects..."

//             className="pl-9"

//             value={search}

//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         <Select value={status} onValueChange={setStatus}>
//           <SelectTrigger className="w-full sm:w-44">
//             <SelectValue />
//           </SelectTrigger>

//           <SelectContent>
//             <SelectItem value="all">All statuses</SelectItem>

//             <SelectItem value="published">Published</SelectItem>

//             <SelectItem value="draft">Draft</SelectItem>

//             <SelectItem value="archived">Archived</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="rounded-2xl border bg-card overflow-hidden">
//         {filtered.length === 0 ? (
//           <EmptyState
//             icon={FileX2}

//             title="No projects found"

//             description="Try another search or create your first project."

//             action={
//               <Button asChild>
//                 <Link href="/instructor/projects/create">Create Project</Link>
//               </Button>
//             }
//           />
//         ) : (
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Title</TableHead>

//                 <TableHead>Course</TableHead>

//                 <TableHead>Deadline</TableHead>

//                 <TableHead>Marks</TableHead>

//                 <TableHead>Submissions</TableHead>

//                 <TableHead>Status</TableHead>

//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>

//             <TableBody>
//               {filtered.map((project) => (
//                 <TableRow key={project.id}>
//                   <TableCell className="font-medium">{project.title}</TableCell>

//                   <TableCell>{project.course.code}</TableCell>

//                   <TableCell>{project.deadline}</TableCell>

//                   <TableCell>{project.totalMarks} pts</TableCell>

//                   <TableCell>
//                     {project.submittedCount}/{project.enrolled}
//                   </TableCell>

//                   <TableCell>
//                     <AssignmentStatusBadge status={project.status} />
//                   </TableCell>

//                   <TableCell className="text-right">
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" size="icon">
//                           <MoreHorizontal className="h-4 w-4" />
//                         </Button>
//                       </DropdownMenuTrigger>

//                       <DropdownMenuContent align="end">
//                         <DropdownMenuItem asChild>
//                           <Link
//                             href={`/instructor/projects/${project.id}/submissions`}
//                           >
//                             <Eye className="h-4 w-4" />
//                             View submissions
//                           </Link>
//                         </DropdownMenuItem>

//                         <DropdownMenuItem asChild>
//                           <Link
//                             href={`/instructor/projects/edit/${project.id}`}
//                           >
//                             <Pencil className="h-4 w-4" />
//                             Edit
//                           </Link>
//                         </DropdownMenuItem>

//                         <DropdownMenuItem onClick={() => duplicate(project.id)}>
//                           <Copy className="h-4 w-4" />
//                           Duplicate
//                         </DropdownMenuItem>

//                         <DropdownMenuSeparator />

//                         {project.status !== "published" && (
//                           <DropdownMenuItem
//                             onClick={() =>
//                               setPublishState(project.id, "published")
//                             }
//                           >
//                             <Send className="h-4 w-4" />
//                             Publish
//                           </DropdownMenuItem>
//                         )}

//                         {project.status !== "archived" && (
//                           <DropdownMenuItem
//                             onClick={() =>
//                               setPublishState(project.id, "archived")
//                             }
//                           >
//                             <Archive className="h-4 w-4" />
//                             Archive
//                           </DropdownMenuItem>
//                         )}

//                         <DropdownMenuSeparator />

//                         <DropdownMenuItem
//                           destructive
//                           onClick={() => setDeleteId(project.id)}
//                         >
//                           <Trash2 className="h-4 w-4" />
//                           Delete
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         )}
//       </div>

//       <ConfirmDialog
//         open={!!deleteId}

//         onOpenChange={(v) => !v && setDeleteId(null)}

//         title="Delete this project?"

//         description="This will permanently remove the project."

//         confirmLabel="Delete project"

//         onConfirm={() => deleteId && remove(deleteId)}
//       />
//     </div>
//   );
// }
