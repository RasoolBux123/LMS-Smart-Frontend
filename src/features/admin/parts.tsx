"use client";

import { Search, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn, initials } from "@/lib/utils";
import type { UserRole, UserStatus } from "@/lib/api/users";

/* ---------------- Page header ---------------- */

export function AdminHeader({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {children && <div className="flex flex-wrap gap-2">{children}</div>}
        </div>
    );
}

/* ---------------- Search box ---------------- */

export function SearchField({
    value,
    onChange,
    placeholder = "Search…",
    className,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <div className={cn("relative", className)}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-9"
                aria-label={placeholder}
            />
        </div>
    );
}

/* ---------------- Badges ---------------- */

const ROLE_META: Record<UserRole, { label: string; variant: "default" | "accent" | "warning" }> = {
    admin: { label: "Admin", variant: "warning" },
    instructor: { label: "Instructor", variant: "default" },
    student: { label: "Student", variant: "accent" },
};

export function RoleBadge({ role }: { role: UserRole }) {
    const meta = ROLE_META[role] ?? ROLE_META.student;
    return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function AccountStatusBadge({ status }: { status: UserStatus | string }) {
    const suspended = status === "suspended";
    return (
        <Badge variant={suspended ? "danger" : "success"}>
            <span
                className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    suspended ? "bg-danger" : "bg-success",
                )}
            />
            {suspended ? "Suspended" : "Active"}
        </Badge>
    );
}

export function CourseStatusBadge({ status }: { status: string }) {
    const map: Record<string, "success" | "secondary" | "outline"> = {
        active: "success",
        draft: "secondary",
        archived: "outline",
    };
    return (
        <Badge variant={map[status] ?? "secondary"} className="capitalize">
            {status || "unknown"}
        </Badge>
    );
}

/* ---------------- Avatar ---------------- */

const AVATAR_TINT: Record<UserRole, string> = {
    admin: "bg-warning-soft text-warning",
    instructor: "bg-primary-soft text-primary",
    student: "bg-accent-soft text-accent",
};

export function UserAvatar({
    name,
    role,
    size = "md",
}: {
    name: string;
    role: UserRole;
    size?: "sm" | "md" | "lg";
}) {
    const dim =
        size === "lg" ? "h-14 w-14 text-base" : size === "sm" ? "h-8 w-8 text-[11px]" : "h-9 w-9 text-xs";
    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center rounded-full font-semibold",
                dim,
                AVATAR_TINT[role] ?? AVATAR_TINT.student,
            )}
            aria-hidden
        >
            {initials(name || "?")}
        </div>
    );
}

/* ---------------- Loading / error ---------------- */

export function TableRowsSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, r) => (
                <TableRow key={r}>
                    {Array.from({ length: cols }).map((__, c) => (
                        <TableCell key={c}>
                            <Skeleton className="h-4 w-full max-w-[160px]" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <p className="text-sm text-danger">{message}</p>
            </div>
            {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                </Button>
            )}
        </div>
    );
}

/* ---------------- Pagination ---------------- */

export function Pagination({
    page,
    pageCount,
    total,
    onChange,
}: {
    page: number;
    pageCount: number;
    total: number;
    onChange: (p: number) => void;
}) {
    if (pageCount <= 1) return null;
    return (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
                Page {page} of {pageCount} · {total} record{total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
                    Previous
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= pageCount}
                    onClick={() => onChange(page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

/* ---------------- CSV export ---------------- */

export function exportToCsv(filename: string, rows: Record<string, string | number>[]) {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
    ].join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}