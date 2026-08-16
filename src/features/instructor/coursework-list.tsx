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

import { courseworkApi, type CourseworkKind } from "@/lib/api/coursework";
import type { AssignmentListItem, AssignmentStatus } from "@/types/assignment";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/utils";

/**
 * Shared list view for quizzes, exams and projects.
 *
 * All three pages were byte-for-byte identical apart from labels, and each
 * held its own `const initialRows = []` — so nothing ever appeared after
 * creating one. This fetches from the API and keeps the three pages thin.
 */

interface Labels {
    /** "Quizzes" */
    plural: string;
    /** "quiz" — used mid-sentence */
    singular: string;
    /** "Create Quiz" */
    createLabel: string;
}

const LABELS: Record<CourseworkKind, Labels> = {
    assignments: {
        plural: "Assignments",
        singular: "assignment",
        createLabel: "Create Assignment",
    },
    quizzes: { plural: "Quizzes", singular: "quiz", createLabel: "Create Quiz" },
    exams: { plural: "Exams", singular: "exam", createLabel: "Create Exam" },
    projects: {
        plural: "Projects",
        singular: "project",
        createLabel: "Create Project",
    },
};

const DESCRIPTIONS: Record<CourseworkKind, string> = {
    assignments: "Create, publish, and manage assignments across your courses.",
    quizzes: "Create, publish, and manage quizzes across your courses.",
    exams: "Create, publish, and manage exams across your courses.",
    projects: "Create, publish, and manage projects across your courses.",
};

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

export function CourseworkList({ kind }: { kind: CourseworkKind }) {
    const { user } = useAuth();
    const api = useMemo(() => courseworkApi(kind), [kind]);
    const labels = LABELS[kind];
    const basePath = `/instructor/${kind}`;

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

        api
            .list(params)
            .then((data) => {
                if (cancelled) return;
                const rows = Array.isArray(data)
                    ? data
                    : Array.isArray((data as { data?: unknown })?.data)
                        ? ((data as { data: AssignmentListItem[] }).data)
                        : [];
                setRows(rows);
            })
            .catch((err) => {
                if (!cancelled) {
                    toast.error(
                        errorMessage(err, `Could not load ${labels.plural.toLowerCase()}.`),
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [api, user?.id, user?.role, labels.plural]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return rows.filter((row) => {
            if (status !== "all" && row.status !== status) return false;
            if (!term) return true;
            return row.title.toLowerCase().includes(term);
        });
    }, [rows, search, status]);

    async function duplicate(id: string) {
        try {
            const copy = await api.duplicate(id);
            setRows((prev) => [copy, ...prev]);
            toast.success(`${labels.plural.slice(0, -1)} duplicated.`);
        } catch (err: unknown) {
            toast.error(errorMessage(err, `Could not duplicate the ${labels.singular}.`));
        }
    }

    async function setPublishState(id: string, next: AssignmentStatus) {
        /*
         * Optimistic: the badge flips immediately, and the previous value is
         * restored if the request fails — otherwise the row would show a state
         * the server never accepted.
         */
        const previous = rows.find((row) => row.id === id)?.status;

        setRows((prev) =>
            prev.map((row) => (row.id === id ? { ...row, status: next } : row)),
        );

        try {
            await api.updateStatus(id, next);
            toast.success(
                next === "published"
                    ? `${labels.plural.slice(0, -1)} published.`
                    : next === "archived"
                        ? `${labels.plural.slice(0, -1)} archived.`
                        : "Moved to draft.",
            );
        } catch (err: unknown) {
            if (previous) {
                setRows((prev) =>
                    prev.map((row) =>
                        row.id === id ? { ...row, status: previous } : row,
                    ),
                );
            }
            toast.error(errorMessage(err, "Could not update the status."));
        }
    }

    async function remove(id: string) {
        try {
            await api.remove(id);
            setRows((prev) => prev.filter((row) => row.id !== id));
            toast.success(`${labels.plural.slice(0, -1)} deleted.`);
        } catch (err: unknown) {
            toast.error(errorMessage(err, `Could not delete the ${labels.singular}.`));
        } finally {
            setDeleteId(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-semibold text-foreground">
                        {labels.plural}
                    </h1>

                    <p className="text-sm text-muted-foreground">{DESCRIPTIONS[kind]}</p>
                </div>

                <Button asChild className="w-full sm:w-auto">
                    <Link href={`${basePath}/create`}>
                        <Plus className="h-4 w-4" />
                        {labels.createLabel}
                    </Link>
                </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground" />

                    <Input
                        placeholder={`Search ${labels.plural.toLowerCase()}...`}
                        aria-label={`Search ${labels.plural.toLowerCase()}`}
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
                        Loading {labels.plural.toLowerCase()}…
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={FileX2}
                        title={
                            search || status !== "all"
                                ? `No ${labels.plural.toLowerCase()} match your filters`
                                : `No ${labels.plural.toLowerCase()} yet`
                        }
                        description={
                            search || status !== "all"
                                ? "Try another search term or clear the status filter."
                                : `Create your first ${labels.singular} to get started.`
                        }
                        action={
                            !search && status === "all" ? (
                                <Button asChild>
                                    <Link href={`${basePath}/create`}>{labels.createLabel}</Link>
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
                                {filtered.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium text-foreground">
                                            {row.title}
                                        </TableCell>

                                        <TableCell>
                                            {row.course?.code || row.course?.title || "—"}
                                        </TableCell>

                                        <TableCell className="whitespace-nowrap">
                                            {formatDeadline(row.deadline)}
                                        </TableCell>

                                        <TableCell>{row.totalMarks} pts</TableCell>

                                        <TableCell>
                                            {row.submittedCount ?? 0}/{row.enrolled ?? 0}
                                        </TableCell>

                                        <TableCell>
                                            <AssignmentStatusBadge status={row.status} />
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
                                                        <Link href={`${basePath}/${row.id}/submissions`}>
                                                            <Eye className="h-4 w-4" />
                                                            View submissions
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem asChild>
                                                        <Link href={`${basePath}/edit/${row.id}`}>
                                                            <Pencil className="h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem onClick={() => duplicate(row.id)}>
                                                        <Copy className="h-4 w-4" />
                                                        Duplicate
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    {row.status !== "published" && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                setPublishState(row.id, "published")
                                                            }
                                                        >
                                                            <Send className="h-4 w-4" />
                                                            Publish
                                                        </DropdownMenuItem>
                                                    )}

                                                    {row.status !== "archived" && (
                                                        <DropdownMenuItem
                                                            onClick={() => setPublishState(row.id, "archived")}
                                                        >
                                                            <Archive className="h-4 w-4" />
                                                            Archive
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem
                                                        destructive
                                                        onClick={() => setDeleteId(row.id)}
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
                title={`Delete this ${labels.singular}?`}
                description={`This will permanently remove the ${labels.singular} and any submissions attached to it. This action cannot be undone.`}
                confirmLabel={`Delete ${labels.singular}`}
                onConfirm={() => deleteId && remove(deleteId)}
            />
        </div>
    );
}