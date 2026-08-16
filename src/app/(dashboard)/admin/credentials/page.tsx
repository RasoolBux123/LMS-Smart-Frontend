"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    listCredentials,
    deleteCredential,
    type CredentialRow,
} from "@/lib/api/credentials";
import { errorMessage, cn } from "@/lib/utils";

type RoleFilter = "all" | "instructor" | "student";

export default function AdminCredentialsPage() {
    const [rows, setRows] = useState<CredentialRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<RoleFilter>("all");
    const [visible, setVisible] = useState<Record<string, boolean>>({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await listCredentials(
                role === "all" ? undefined : { role },
            );
            setRows(res.data ?? []);
        } catch (err) {
            toast.error(errorMessage(err) || "Failed to load credentials");
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (r) =>
                r.name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q),
        );
    }, [rows, search]);

    const copyText = async (label: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
        } catch {
            toast.error("Could not copy");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this credential from the vault? (User account stays)")) {
            return;
        }
        try {
            await deleteCredential(id);
            setRows((prev) => prev.filter((r) => r.id !== id));
            toast.success("Credential removed");
        } catch (err) {
            toast.error(errorMessage(err) || "Delete failed");
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <KeyRound className="h-6 w-6 text-primary" />
                        Credentials
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Login email &amp; password for instructors and students created by admin.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "instructor", "student"] as RoleFilter[]).map((r) => (
                        <Button
                            key={r}
                            size="sm"
                            variant={role === r ? "default" : "outline"}
                            onClick={() => setRole(r)}
                            className="capitalize"
                        >
                            {r}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Password</th>
                                <th className="px-4 py-3 font-medium">Updated</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                        Loading…
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                        No credentials yet. Create an instructor or student — their
                                        email &amp; password will appear here.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                filtered.map((row) => {
                                    const show = visible[row.id];
                                    return (
                                        <tr
                                            key={row.id}
                                            className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-medium">{row.name}</td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={
                                                        row.role === "instructor" ? "default" : "secondary"
                                                    }
                                                    className="capitalize"
                                                >
                                                    {row.role}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs">{row.email}</span>
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                                        onClick={() => copyText("Email", row.email)}
                                                        title="Copy email"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs">
                                                        {show ? row.password : "••••••••••••"}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                                        onClick={() =>
                                                            setVisible((v) => ({
                                                                ...v,
                                                                [row.id]: !v[row.id],
                                                            }))
                                                        }
                                                        title={show ? "Hide" : "Show"}
                                                    >
                                                        {show ? (
                                                            <EyeOff className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <Eye className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                                        onClick={() => copyText("Password", row.password)}
                                                        title="Copy password"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {row.updatedAt
                                                    ? new Date(row.updatedAt).toLocaleString()
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-danger"
                                                    onClick={() => handleDelete(row.id)}
                                                    title="Remove from vault"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}