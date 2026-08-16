"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AssignmentStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  getAssignments,
  deleteAssignment,
  duplicateAssignment,
  updateAssignmentStatus,
} from "@/lib/api/assignments";
import type { AssignmentListItem, AssignmentStatus } from "@/types/assignment";
import { formatDate } from "@/lib/utils";

export default function InstructorAssignmentsPage() {
  const [rows, setRows] = useState<AssignmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AssignmentStatus | "all">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRows(await getAssignments());
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Couldn't load assignments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Filtering is client-side for now. As the dataset grows, move it to the
  // server by calling getAssignments({ search, status }).
  const filtered = useMemo(() => {
    let out = rows.filter((r) =>
      r.title.toLowerCase().includes(search.toLowerCase()),
    );
    if (status !== "all") out = out.filter((r) => r.status === status);
    return out;
  }, [rows, search, status]);

  async function duplicate(id: string) {
    try {
      const copy = await duplicateAssignment(id);
      setRows((prev) => [copy, ...prev]);
      toast.success("Assignment duplicated.");
    } catch {
      toast.error("Couldn't duplicate the assignment.");
    }
  }

  async function setPublishState(id: string, next: AssignmentStatus) {
    const prev = rows;
    setRows((current) =>
      current.map((r) => (r.id === id ? { ...r, status: next } : r)),
    );
    try {
      await updateAssignmentStatus(id, next);
      toast.success(
        next === "published"
          ? "Assignment published."
          : next === "archived"
            ? "Assignment archived."
            : "Moved to draft.",
      );
    } catch {
      setRows(prev);
      toast.error("Couldn't update the status.");
    }
  }

  async function remove(id: string) {
    const prev = rows;
    setRows((current) => current.filter((r) => r.id !== id));
    try {
      await deleteAssignment(id);
      toast.success("Assignment deleted.");
    } catch {
      setRows(prev);
      toast.error("Couldn't delete the assignment.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Create, publish, and manage assignments across your courses.
          </p>
        </div>
        <Button asChild>
          <Link href="/instructor/assignments/create">
            <Plus className="h-4 w-4" /> Create assignment
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assignments…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as AssignmentStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border bg-card card-shadow overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            icon={FileX2}
            title="No Assignemnts Found"
            description={loadError}
            action={
              <Button asChild>
                <Link href="/instructor/assignments/create">Create Assignment</Link>
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileX2}
            title="No assignments found"
            description="Try a different search, or create your first assignment."
            action={
              <Button asChild>
                <Link href="/instructor/assignments/create">
                  Create assignment
                </Link>
              </Button>
            }
          />
        ) : (
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
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="max-w-[240px]">
                    <p className="truncate font-medium">{a.title}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {a.course?.code ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(a.deadline)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {a.totalMarks} pts
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {a.submittedCount}/{a.enrolled}
                  </TableCell>
                  <TableCell>
                    <AssignmentStatusBadge status={a.status} />
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
                            href={`/instructor/submissions?assignment=${a.id}`}
                          >
                            <Eye className="h-4 w-4" /> View submissions
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/instructor/assignments/${a.id}/edit`}>
                            <Pencil className="h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicate(a.id)}>
                          <Copy className="h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {a.status !== "published" && (
                          <DropdownMenuItem
                            onClick={() => setPublishState(a.id, "published")}
                          >
                            <Send className="h-4 w-4" /> Publish
                          </DropdownMenuItem>
                        )}
                        {a.status !== "archived" && (
                          <DropdownMenuItem
                            onClick={() => setPublishState(a.id, "archived")}
                          >
                            <Archive className="h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          destructive
                          onClick={() => setDeleteId(a.id)}
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
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete this assignment?"
        description="This will permanently remove the assignment and its submission records. This action cannot be undone."
        confirmLabel="Delete assignment"
        onConfirm={() => deleteId && remove(deleteId)}
      />
    </div>
  );
}
