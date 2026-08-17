"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GradeRow, GradeStatus } from "@/lib/api/grading";

const statusMap: Record<
    GradeStatus,
    { label: string; variant: "success" | "warning" | "danger" }
> = {
    submitted: { label: "Graded", variant: "success" },
    pending: { label: "Pending", variant: "warning" },
    not_submitted: { label: "Not Submitted", variant: "danger" },
    not_graded_yet: { label: "Not graded yet", variant: "warning" },
};

const PAGE_SIZE = 5;

interface GradingAccordionProps {
    title: string;
    rows: GradeRow[];
    defaultOpen?: boolean;
}

export function GradingAccordion({
    title,
    rows,
    defaultOpen = false,
}: GradingAccordionProps) {
    const [open, setOpen] = useState(defaultOpen);
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return rows.slice(start, start + PAGE_SIZE);
    }, [rows, page]);

    // Reset to page 1 when rows change
    useMemo(() => {
        setPage(1);
    }, [rows]);

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between px-6 py-4 text-left"
            >
                <span className="font-display text-base font-semibold text-primary">
                    {title}
                    {rows.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({rows.length})
                        </span>
                    )}
                </span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        open && "rotate-180",
                    )}
                />
            </button>

            {open && (
                <div className="border-t border-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-6 py-3">{title} Name</th>
                                    <th className="px-6 py-3">Total Marks</th>
                                    <th className="px-6 py-3">Obtained Marks</th>
                                    <th className="px-6 py-3">Remarks</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-8 text-center text-muted-foreground"
                                        >
                                            No {title.toLowerCase()} yet.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRows.map((r) => {
                                        const meta = statusMap[r.status];
                                        return (
                                            <tr
                                                key={r.id}
                                                className="border-b border-border/60 last:border-0"
                                            >
                                                <td className="px-6 py-4 font-medium">{r.name}</td>
                                                <td className="px-6 py-4">{r.totalMarks}</td>
                                                <td className="px-6 py-4">
                                                    {r.status === "not_graded_yet"
                                                        ? "—"
                                                        : (r.obtainedMarks ?? "—")}
                                                </td>
                                                <td className="max-w-xs px-6 py-4 text-muted-foreground">
                                                    {r.remarks || "-"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={meta.variant}>{meta.label}</Badge>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {rows.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between border-t border-border px-6 py-3">
                            <p className="text-xs text-muted-foreground">
                                Showing {(page - 1) * PAGE_SIZE + 1}–
                                {Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>

                                <span className="min-w-[4rem] text-center text-sm text-muted-foreground">
                                    {page} / {totalPages}
                                </span>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}



// "use client";

// import { useState } from "react";
// import { ChevronDown } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { cn } from "@/lib/utils";
// import type { GradeRow, GradeStatus } from "@/lib/api/grading";

// const statusMap: Record<GradeStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
//     submitted: { label: "Graded", variant: "success" },
//     pending: { label: "Pending", variant: "warning" },
//     not_submitted: { label: "Not Submitted", variant: "danger" },
//     not_graded_yet: { label: "Not graded yet", variant: "warning" },
// };

// interface GradingAccordionProps {
//     title: string;
//     rows: GradeRow[];
//     defaultOpen?: boolean;
// }

// export function GradingAccordion({
//     title,
//     rows,
//     defaultOpen = false,
// }: GradingAccordionProps) {
//     const [open, setOpen] = useState(defaultOpen);

//     return (
//         <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow">
//             <button
//                 onClick={() => setOpen((v) => !v)}
//                 className="flex w-full items-center justify-between px-6 py-4 text-left"
//             >
//                 <span className="font-display text-base font-semibold text-primary">
//                     {title}
//                 </span>
//                 <ChevronDown
//                     className={cn(
//                         "h-4 w-4 text-muted-foreground transition-transform",
//                         open && "rotate-180",
//                     )}
//                 />
//             </button>

//             {open && (
//                 <div className="overflow-x-auto border-t border-border">
//                     <table className="w-full text-sm">
//                         <thead>
//                             <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
//                                 <th className="px-6 py-3">{title} Name</th>
//                                 <th className="px-6 py-3">Total Marks</th>
//                                 <th className="px-6 py-3">Obtained Marks</th>
//                                 <th className="px-6 py-3">Remarks</th>
//                                 <th className="px-6 py-3">Status</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {rows.length === 0 ? (
//                                 <tr>
//                                     <td
//                                         colSpan={5}
//                                         className="px-6 py-8 text-center text-muted-foreground"
//                                     >
//                                         No {title.toLowerCase()} yet.
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 rows.map((r) => {
//                                     const meta = statusMap[r.status];
//                                     return (
//                                         <tr
//                                             key={r.id}
//                                             className="border-b border-border/60 last:border-0"
//                                         >
//                                             <td className="px-6 py-4 font-medium">{r.name}</td>
//                                             <td className="px-6 py-4">{r.totalMarks}</td>
//                                             <td className="px-6 py-4">
//                                                 {r.status === "not_graded_yet"
//                                                     ? "—"
//                                                     : (r.obtainedMarks ?? "—")}
//                                             </td>
//                                             <td className="max-w-xs px-6 py-4 text-muted-foreground">
//                                                 {r.remarks || "-"}
//                                             </td>
//                                             <td className="px-6 py-4">
//                                                 <Badge variant={meta.variant}>{meta.label}</Badge>
//                                             </td>
//                                         </tr>
//                                     );
//                                 })
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             )}
//         </div>
//     );
// }

