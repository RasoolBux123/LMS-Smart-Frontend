"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    UserPlus,
    Users as UsersIcon,
    MoreHorizontal,
    Pencil,
    Trash2,
    Ban,
    CheckCircle2,
    Download,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AccountStatusBadge,
    AdminHeader,
    ErrorNote,
    Pagination,
    RoleBadge,
    SearchField,
    TableRowsSkeleton,
    UserAvatar,
    exportToCsv,
} from "@/features/admin/parts";
import { UserDialog } from "@/features/admin/user-dialog";
import { UserDetailDrawer } from "@/features/admin/user-detail-drawer";
import {
    deleteUser,
    listUsers,
    updateUser,
    type ManagedUser,
    type UserRole,
} from "@/lib/api/users";
import { listCourses, type Course } from "@/lib/api/courses";
import { errorMessage, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

/** "all" shows the combined view with role tabs; otherwise a single role. */
export type UsersScope = "all" | UserRole;

interface ScopeCopy {
    title: string;
    description: string;
    addLabel: string;
    emptyText: string;
}

const SCOPE_COPY: { [K in UsersScope]: ScopeCopy } = {
    all: {
        title: "All users",
        description: "Every account on the platform — create, edit and suspend them.",
        addLabel: "Add user",
        emptyText: "No accounts yet",
    },
    admin: {
        title: "Admins",
        description: "Platform administrators — they have full control over the system.",
        addLabel: "Add admin",
        emptyText: "No admins yet",
    },
    instructor: {
        title: "Instructors",
        description: "Manage instructor accounts responsible for creating courses, assigning coursework, and grading students.",
        addLabel: "Add instructor",
        emptyText: "No instructors yet",
    },
    student: {
        title: "Students",
        description: "Enrolled learners — their attendance, submissions and grades are tracked here.",
        addLabel: "Add student",
        emptyText: "No students yet",
    },
};

export function UsersManager({ scope = "all" }: { scope?: UsersScope }) {
    const copy = SCOPE_COPY[scope];
    const locked = scope !== "all";

    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [tab, setTab] = useState<UsersScope>(scope);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<ManagedUser | null>(null);
    const [detail, setDetail] = useState<ManagedUser | null>(null);
    const [pendingDelete, setPendingDelete] = useState<ManagedUser | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [u, c] = await Promise.all([listUsers(), listCourses()]);
            setUsers(u.data);
            setCourses(c.data);
        } catch (err: unknown) {
            setError(errorMessage(err, "Could not load users."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    /* Route badle to scope ke saath tab bhi reset ho */
    useEffect(() => {
        setTab(scope);
        setSearch("");
        setStatusFilter("all");
        setPage(1);
    }, [scope]);

    useEffect(() => {
        setPage(1);
    }, [tab, search, statusFilter]);

    const counts = useMemo(
        () => ({
            all: users.length,
            admin: users.filter((u) => u.role === "admin").length,
            instructor: users.filter((u) => u.role === "instructor").length,
            student: users.filter((u) => u.role === "student").length,
        }),
        [users],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users
            .filter((u) => (tab === "all" ? true : u.role === tab))
            .filter((u) => (statusFilter === "all" ? true : u.status === statusFilter))
            .filter(
                (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [users, tab, statusFilter, search]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    /* ---------- actions ---------- */

    function upsert(user: ManagedUser, mode: "create" | "edit") {
        setUsers((prev) =>
            mode === "create" ? [user, ...prev] : prev.map((u) => (u.id === user.id ? user : u)),
        );
        setDetail((d) => (d && d.id === user.id ? user : d));
    }

    async function toggleStatus(user: ManagedUser) {
        const next = user.status === "suspended" ? "active" : "suspended";
        try {
            const res = await updateUser(user.id, { status: next });
            upsert(res.data, "edit");
            toast.success(`${user.name} is now ${next}`);
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Could not update the status."));
        }
    }

    async function confirmDelete() {
        if (!pendingDelete) return;
        const target = pendingDelete;

        try {
            await deleteUser(target.id);

            setUsers((prev) => prev.filter((u) => u.id !== target.id));
            setDetail((d) => (d && d.id === target.id ? null : d));

            toast.custom((t) => (
                <div
                    className={`${t.visible
                            ? "animate-in fade-in slide-in-from-top-2"
                            : "animate-out fade-out"
                        } flex w-full max-w-sm items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-lg dark:border-red-800 dark:bg-red-950/60`}
                >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                        <Trash2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                            {target.name} deleted successfully
                        </p>
                        <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
                            Account has been permanently removed.
                        </p>
                    </div>
                </div>
            ));
        } catch (err: unknown) {
            const msg = errorMessage(err, "Could not delete the account.");

            // Common backend messages ko friendly banao
            const friendly =
                msg.toLowerCase().includes("not found")
                    ? "This account was not found. It may have already been deleted."
                    : msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("permission")
                        ? "You don't have permission to delete this account."
                        : msg;

            toast.error(friendly);
        } finally {
            setPendingDelete(null);
        }
    }
    function handleExport() {
        exportToCsv(
            `smartlms-${scope === "all" ? "users" : `${scope}s`}-${new Date()
                .toISOString()
                .slice(0, 10)}.csv`,
            filtered.map((u) => ({
                Name: u.name,
                Email: u.email,
                Role: u.role,
                Status: u.status,
                Joined: u.createdAt ? formatDate(u.createdAt) : "",
            })),
        );
    }

    const showRoleColumn = scope === "all";

    return (
        <div className="space-y-6">
            <AdminHeader
                title={copy.title}
                description={
                    loading
                        ? copy.description
                        : `${filtered.length} record${filtered.length === 1 ? "" : "s"} · ${copy.description}`
                }
            >
                <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button
                    onClick={() => {
                        setEditing(null);
                        setDialogOpen(true);
                    }}
                >
                    <UserPlus className="h-4 w-4" /> {copy.addLabel}
                </Button>
            </AdminHeader>

            {error && <ErrorNote message={error} onRetry={load} />}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Role tabs only appear in the combined view */}
                {!locked ? (
                    <Tabs value={tab} onValueChange={(v) => setTab(v as UsersScope)}>
                        <TabsList>
                            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                            <TabsTrigger value="admin">Admins ({counts.admin})</TabsTrigger>
                            <TabsTrigger value="instructor">Instructors ({counts.instructor})</TabsTrigger>
                            <TabsTrigger value="student">Students ({counts.student})</TabsTrigger>
                        </TabsList>
                    </Tabs>
                ) : (
                    <span />
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder="Search by name or email…"
                        className="sm:w-72"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="sm:w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Email</TableHead>
                            {showRoleColumn && <TableHead>Role</TableHead>}
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden lg:table-cell">Joined</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && <TableRowsSkeleton rows={6} cols={showRoleColumn ? 6 : 5} />}

                        {!loading && pageRows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={showRoleColumn ? 6 : 5} className="p-0">
                                    <EmptyState
                                        icon={UsersIcon}
                                        title={
                                            search || statusFilter !== "all" ? "No matches found" : copy.emptyText
                                        }
                                        description={
                                            search || statusFilter !== "all"
                                                ? "Try adjusting your search or filter."
                                                : "Use the button above to add the first account."
                                        }
                                        className="border-0"
                                    />
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            pageRows.map((u) => (
                                <TableRow key={u.id} className="cursor-pointer" onClick={() => setDetail(u)}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <UserAvatar name={u.name} role={u.role} />
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{u.name}</p>
                                                <p className="truncate text-xs text-muted-foreground md:hidden">
                                                    {u.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden text-muted-foreground md:table-cell">
                                        {u.email}
                                    </TableCell>
                                    {showRoleColumn && (
                                        <TableCell>
                                            <RoleBadge role={u.role} />
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <AccountStatusBadge status={u.status} />
                                    </TableCell>
                                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                                        {u.createdAt ? formatDate(u.createdAt) : "—"}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" aria-label={`Actions for ${u.name}`}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setEditing(u);
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleStatus(u)}>
                                                    {u.status === "suspended" ? (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4" /> Reactivate
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ban className="h-4 w-4" /> Suspend
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-danger focus:text-danger"
                                                    onClick={() => setPendingDelete(u)}
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

                {!loading && (
                    <Pagination
                        page={page}
                        pageCount={pageCount}
                        total={filtered.length}
                        onChange={setPage}
                    />
                )}
            </div>

            <UserDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                user={editing}
                defaultRole={locked ? (scope as UserRole) : "student"}
                // allowedRoles={locked ? [scope as UserRole] : undefined}
                onSaved={upsert}
            />

            <UserDetailDrawer
                user={detail}
                courses={courses.filter((c) => detail && c.instructorId === detail.id)}
                onClose={() => setDetail(null)}
                onEdit={(u) => {
                    setEditing(u);
                    setDialogOpen(true);
                }}
                onToggleStatus={toggleStatus}
            />

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                onOpenChange={(open) => !open && setPendingDelete(null)}
                title="Delete this account?"
                description={`${pendingDelete?.name ?? "This user"} will be permanently deleted. This action cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={confirmDelete}
            />
        </div>
    );
}




