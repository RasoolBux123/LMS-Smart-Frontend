"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProgramDetail } from "@/features/programs/program-detail";
import { Button } from "@/components/ui/button";
import {
    getProgram,
    updateProgram,
    listProgramCourses,
} from "@/lib/api/programs";
import { listCourses, type Course } from "@/lib/api/courses";
import { errorMessage, cn } from "@/lib/utils";
import type { Program } from "@/types/program";

export default function AdminProgramDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [program, setProgram] = useState<Program | null>(null);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        getProgram(id)
            .then((res) => {
                setProgram(res.data);
                setSelected(res.data.courseIds ?? []);
            })
            .catch(() => setProgram(null));

        listCourses()
            .then((res) => setAllCourses(res.data ?? []))
            .catch(() => setAllCourses([]));
    }, [id, refreshKey]);

    function toggle(courseId: string) {
        setSelected((prev) =>
            prev.includes(courseId)
                ? prev.filter((x) => x !== courseId)
                : [...prev, courseId],
        );
    }

    async function saveLinks() {
        if (!program) return;
        setSaving(true);
        try {
            await updateProgram(program.id, { courseIds: selected });
            toast.success("Courses linked successfully.");
            setOpen(false);
            setRefreshKey((k) => k + 1);
        } catch (err: unknown) {
            toast.error(errorMessage(err, "Could not link courses."));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                    <Link2 className="h-3.5 w-3.5" />
                    Link courses
                </Button>
                <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/programs/${id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit program
                    </Link>
                </Button>
            </div>

            <ProgramDetail
                key={refreshKey}
                programId={id}
                backHref="/admin/programs"
                backLabel="Back to programs"
                courseBasePath="/admin/courses"
            />

            {/* Link courses modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
                        <h2 className="font-display text-lg font-semibold">Link courses</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Select courses that belong to this program.
                        </p>

                        <div className="mt-4 max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                            {allCourses.length === 0 ? (
                                <p className="p-3 text-sm text-muted-foreground">
                                    No courses available. Create courses first.
                                </p>
                            ) : (
                                allCourses.map((course) => {
                                    const checked = selected.includes(course.id);
                                    return (
                                        <label
                                            key={course.id}
                                            className={cn(
                                                "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                                checked ? "bg-primary/10" : "hover:bg-muted/50",
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggle(course.id)}
                                                className="h-4 w-4 rounded border-input"
                                            />
                                            <span className="min-w-0 flex-1 truncate font-medium">
                                                {course.title}
                                            </span>
                                            <span className="text-xs capitalize text-muted-foreground">
                                                {course.status}
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOpen(false)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button size="sm" onClick={saveLinks} disabled={saving}>
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : null}
                                Save ({selected.length})
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}   