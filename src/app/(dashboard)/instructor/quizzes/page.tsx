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

import { quizzesApi } from "@/lib/api/coursework";
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

export default function InstructorQuizzesPage() {
  const { user } = useAuth();

  /*
   * Rows come from the API. This page previously held
   * `const initialQuizzes: QuizRow[] = []`, so nothing ever appeared here
   * no matter how many quizzes were created.
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

    quizzesApi
      .list(params)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(errorMessage(err, "Could not load quizzes."));
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

    return rows.filter((quiz) => {
      if (status !== "all" && quiz.status !== status) return false;
      if (!term) return true;
      return quiz.title.toLowerCase().includes(term);
    });
  }, [rows, search, status]);

  async function duplicate(id: string) {
    try {
      const copy = await quizzesApi.duplicate(id);
      setRows((prev) => [copy, ...prev]);
      toast.success("Quiz duplicated.");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not duplicate the quiz."));
    }
  }

  async function setPublishState(id: string, next: AssignmentStatus) {
    /*
     * Optimistic: the badge flips immediately, and the previous value is
     * restored if the request fails — otherwise the row would keep showing
     * a state the server never accepted.
     */
    const previous = rows.find((quiz) => quiz.id === id)?.status;

    setRows((prev) =>
      prev.map((quiz) => (quiz.id === id ? { ...quiz, status: next } : quiz)),
    );

    try {
      await quizzesApi.updateStatus(id, next);

      toast.success(
        next === "published"
          ? "Quiz published."
          : next === "archived"
            ? "Quiz archived."
            : "Moved to draft.",
      );
    } catch (err: unknown) {
      if (previous) {
        setRows((prev) =>
          prev.map((quiz) =>
            quiz.id === id ? { ...quiz, status: previous } : quiz,
          ),
        );
      }
      toast.error(errorMessage(err, "Could not update the status."));
    }
  }

  async function remove(id: string) {
    try {
      await quizzesApi.remove(id);
      setRows((prev) => prev.filter((quiz) => quiz.id !== id));
      toast.success("Quiz deleted.");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not delete the quiz."));
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Quizzes
          </h1>

          <p className="text-sm text-muted-foreground">
            Create, publish, and manage quizzes across your courses.
          </p>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/instructor/quizzes/create">
            <Plus className="h-4 w-4" />
            Create Quiz
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground" />

          <Input
            placeholder="Search quizzes..."

            aria-label="Search quizzes"

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
            Loading quizzes…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileX2}

            title={
              search || status !== "all"
                ? "No quizzes match your filters"
                : "No quizzes yet"
            }

            description={
              search || status !== "all"
                ? "Try another search term or clear the status filter."
                : "Create your first quiz to get started."
            }

            action={
              !search && status === "all" ? (
                <Button asChild>
                  <Link href="/instructor/quizzes/create">Create Quiz</Link>
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
                {filtered.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell className="font-medium text-foreground">
                      {quiz.title}
                    </TableCell>

                    <TableCell>
                      {quiz.course?.code || quiz.course?.title || "—"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {formatDeadline(quiz.deadline)}
                    </TableCell>

                    <TableCell>{quiz.totalMarks} pts</TableCell>

                    <TableCell>
                      {quiz.submittedCount ?? 0}/{quiz.enrolled ?? 0}
                    </TableCell>

                    <TableCell>
                      <AssignmentStatusBadge status={quiz.status} />
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
                              href={`/instructor/quizzes/${quiz.id}/submissions`}
                            >
                              <Eye className="h-4 w-4" />
                              View submissions
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>
                            <Link href={`/instructor/quizzes/edit/${quiz.id}`}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => duplicate(quiz.id)}>
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {quiz.status !== "published" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setPublishState(quiz.id, "published")
                              }
                            >
                              <Send className="h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          )}

                          {quiz.status !== "archived" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setPublishState(quiz.id, "archived")
                              }
                            >
                              <Archive className="h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            destructive
                            onClick={() => setDeleteId(quiz.id)}
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

        title="Delete this quiz?"

        description="This will permanently remove the quiz and any submissions attached to it. This action cannot be undone."

        confirmLabel="Delete quiz"

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

// type QuizRow = {
//   id: string;
//   title: string;
//   course: { code: string };
//   deadline: string;
//   totalMarks: number;
//   submittedCount: number;
//   enrolled: number;
//   status: AssignmentStatusMeta;
// };

// const initialQuizzes: QuizRow[] = [];

// export default function InstructorQuizzesPage() {
//   const [rows, setRows] = useState(initialQuizzes);

//   const [search, setSearch] = useState("");

//   const [status, setStatus] = useState("all");

//   const [deleteId, setDeleteId] = useState<string | null>(null);

//   const filtered = useMemo(() => {
//     let out = rows.filter((q) =>
//       q.title.toLowerCase().includes(search.toLowerCase()),
//     );

//     if (status !== "all") out = out.filter((q) => q.status === status);

//     return out;
//   }, [rows, search, status]);

//   function duplicate(id: string) {
//     const source = rows.find((q) => q.id === id);

//     if (!source) return;

//     const copy: QuizRow = {
//       ...source,

//       id: `${source.id}-copy-${Date.now()}`,

//       title: `${source.title} (copy)`,

//       status: "draft",
//     };

//     setRows((prev) => [copy, ...prev]);

//     toast.success("Quiz duplicated.");
//   }

//   function setPublishState(id: string, s: "published" | "archived" | "draft") {
//     setRows((prev) =>
//       prev.map((q) =>
//         q.id === id
//           ? {
//               ...q,
//               status: s,
//             }
//           : q,
//       ),
//     );

//     toast.success(
//       s === "published"
//         ? "Quiz published."
//         : s === "archived"
//           ? "Quiz archived."
//           : "Moved to draft.",
//     );
//   }

//   function remove(id: string) {
//     setRows((prev) => prev.filter((q) => q.id !== id));

//     toast.success("Quiz deleted.");
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="font-display text-2xl font-semibold">Quizzes</h1>

//           <p className="text-sm text-muted-foreground">
//             Create, publish, and manage quizzes across your courses.
//           </p>
//         </div>

//         <Button asChild>
//           <Link href="/instructor/quizzes/create">
//             <Plus className="h-4 w-4" />
//             Create Quiz
//           </Link>
//         </Button>
//       </div>

//       <div className="flex flex-col gap-3 sm:flex-row">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

//           <Input
//             placeholder="Search quizzes..."

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

//             title="No quizzes found"

//             description="Try another search or create your first quiz."

//             action={
//               <Button asChild>
//                 <Link href="/instructor/quizzes/create">Create Quiz</Link>
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
//               {filtered.map((quiz) => (
//                 <TableRow key={quiz.id}>
//                   <TableCell className="font-medium">{quiz.title}</TableCell>

//                   <TableCell>{quiz.course.code}</TableCell>

//                   <TableCell>{quiz.deadline}</TableCell>

//                   <TableCell>{quiz.totalMarks} pts</TableCell>

//                   <TableCell>
//                     {quiz.submittedCount}/{quiz.enrolled}
//                   </TableCell>

//                   <TableCell>
//                     <AssignmentStatusBadge status={quiz.status} />
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
//                             href={`/instructor/quizzes/${quiz.id}/submissions`}
//                           >
//                             <Eye className="h-4 w-4" />
//                             View submissions
//                           </Link>
//                         </DropdownMenuItem>

//                         <DropdownMenuItem asChild>
//                           <Link href={`/instructor/quizzes/edit/${quiz.id}`}>
//                             <Pencil className="h-4 w-4" />
//                             Edit
//                           </Link>
//                         </DropdownMenuItem>

//                         <DropdownMenuItem onClick={() => duplicate(quiz.id)}>
//                           <Copy className="h-4 w-4" />
//                           Duplicate
//                         </DropdownMenuItem>

//                         <DropdownMenuSeparator />

//                         {quiz.status !== "published" && (
//                           <DropdownMenuItem
//                             onClick={() =>
//                               setPublishState(quiz.id, "published")
//                             }
//                           >
//                             <Send className="h-4 w-4" />
//                             Publish
//                           </DropdownMenuItem>
//                         )}

//                         {quiz.status !== "archived" && (
//                           <DropdownMenuItem
//                             onClick={() => setPublishState(quiz.id, "archived")}
//                           >
//                             <Archive className="h-4 w-4" />
//                             Archive
//                           </DropdownMenuItem>
//                         )}

//                         <DropdownMenuSeparator />

//                         <DropdownMenuItem
//                           destructive
//                           onClick={() => setDeleteId(quiz.id)}
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

//         title="Delete this quiz?"

//         description="This will permanently remove the quiz."

//         confirmLabel="Delete quiz"

//         onConfirm={() => deleteId && remove(deleteId)}
//       />
//     </div>
//   );
// }
