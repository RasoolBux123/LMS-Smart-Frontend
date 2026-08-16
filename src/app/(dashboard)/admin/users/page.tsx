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
type TabValue = "all" | UserRole;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<TabValue>("all");
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

  /* Jump back to the first page whenever a filter changes. */
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
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
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
      toast.success(`${target.name} delete ho gaya`);
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not delete."));
    } finally {
      setPendingDelete(null);
    }
  }

  function handleExport() {
    exportToCsv(
      `smartlms-users-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((u) => ({
        Name: u.name,
        Email: u.email,
        Role: u.role,
        Status: u.status,
        Joined: u.createdAt ? formatDate(u.createdAt) : "",
      })),
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Manage users"
        description="Instructor, student and admin accounts — create, edit and suspend them."
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
          <UserPlus className="h-4 w-4" /> Add user
        </Button>
      </AdminHeader>

      {error && <ErrorNote message={error} onRetry={load} />}

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="instructor">Instructors ({counts.instructor})</TabsTrigger>
            <TabsTrigger value="student">Students ({counts.student})</TabsTrigger>
            <TabsTrigger value="admin">Admins ({counts.admin})</TabsTrigger>
          </TabsList>
        </Tabs>

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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRowsSkeleton rows={6} cols={6} />}

            {!loading && pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={UsersIcon}
                    title={search || statusFilter !== "all" ? "No matches found" : "No accounts yet"}
                    description={
                      search || statusFilter !== "all"
                        ? "Try adjusting your search or filter."
                        : "Add your first instructor or student."
                    }
                    className="border-0"
                  />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              pageRows.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => setDetail(u)}
                >
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
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
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






// "use client";

// import { useEffect, useState } from "react";
// import { listUsers, ManagedUser } from "@/lib/api/users";
// import AddUserDrawer from "@/app/components/admin/AddUserDrawer";
// import { errorMessage } from "@/lib/utils";

// export default function AdminUsersPage() {
//   const [tab, setTab] = useState<"instructor" | "student">("instructor");
//   const [instructors, setInstructors] = useState<ManagedUser[]>([]);
//   const [students, setStudents] = useState<ManagedUser[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [drawer, setDrawer] = useState<"instructor" | "student" | null>(null);

//   async function loadAll() {
//     setLoading(true);
//     try {
//       const [iRes, sRes] = await Promise.all([listUsers("instructor"), listUsers("student")]);
//       setInstructors(iRes.data);
//       setStudents(sRes.data);
//     } catch (err: unknown) {
//       console.error("Failed to load users:", errorMessage(err));
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     loadAll();
//   }, []);

//   function handleCreated(user: ManagedUser) {
//     if (user.role === "instructor") setInstructors((prev) => [user, ...prev]);
//     else setStudents((prev) => [user, ...prev]);
//   }

//   const rows = tab === "instructor" ? instructors : students;
//   const accent = tab === "instructor" ? "#4F46E5" : "#0D9488";

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h2 className="font-display text-2xl font-semibold text-foreground">Manage users</h2>
//           <p className="mt-1 text-sm text-muted-foreground">Create instructor and student accounts.</p>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           <button
//             onClick={() => setDrawer("instructor")}
//             className="rounded-xl px-4 py-2.5 text-sm font-medium text-white"
//             style={{ backgroundColor: "#4F46E5" }}
//           >
//             + Add instructor
//           </button>
//           <button
//             onClick={() => setDrawer("student")}
//             className="rounded-xl px-4 py-2.5 text-sm font-medium text-white"
//             style={{ backgroundColor: "#0D9488" }}
//           >
//             + Add student
//           </button>
//         </div>
//       </div>

//       <div className="flex gap-2 rounded-xl border border-border bg-card p-1 w-fit">
//         <button
//           onClick={() => setTab("instructor")}
//           className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
//             tab === "instructor" ? "bg-primary-soft text-primary" : "text-muted-foreground"
//           }`}
//         >
//           Instructors ({instructors.length})
//         </button>
//         <button
//           onClick={() => setTab("student")}
//           className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
//             tab === "student" ? "bg-teal-50 text-teal-700" : "text-muted-foreground"
//           }`}
//         >
//           Students ({students.length})
//         </button>
//       </div>

//       <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="border-b border-border bg-surface-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
//               <th className="px-6 py-3">Name</th>
//               <th className="px-6 py-3">Email</th>
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
//             {!loading && rows.length === 0 && (
//               <tr>
//                 <td colSpan={3} className="px-6 py-10 text-center text-faint-foreground">
//                   No {tab}s yet — add one above.
//                 </td>
//               </tr>
//             )}
//             {rows.map((u) => (
//               <tr key={u.id} className="border-b border-slate-50 last:border-0">
//                 <td className="px-6 py-4">
//                   <div className="flex items-center gap-3">
//                     <div
//                       className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
//                       style={{ backgroundColor: accent }}
//                     >
//                       {u.name.slice(0, 2).toUpperCase()}
//                     </div>
//                     <span className="font-medium text-foreground">{u.name}</span>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
//                 <td className="px-6 py-4">
//                   <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">
//                     {u.status}
//                   </span>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <AddUserDrawer
//         role="instructor"
//         open={drawer === "instructor"}
//         onClose={() => setDrawer(null)}
//         onCreated={handleCreated}
//       />
//       <AddUserDrawer
//         role="student"
//         open={drawer === "student"}
//         onClose={() => setDrawer(null)}
//         onCreated={handleCreated}
//       />
//     </div>
//   );
// }
