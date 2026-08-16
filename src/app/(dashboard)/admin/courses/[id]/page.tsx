"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    BookOpen,
    Loader2,
    FileText,
    Layers,
    ExternalLink,
} from "lucide-react";
import {
    getCourse,
    listModules,
    listMaterials,
    type Course,
    type Module,
    type Material,
} from "@/lib/api/courses";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

type ModuleWithMaterials = Module & { materials: Material[] };

export default function AdminCourseDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<ModuleWithMaterials[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [courseRes, modulesRes] = await Promise.all([
                    getCourse(id),
                    listModules(id),
                ]);

                if (cancelled) return;

                setCourse(courseRes.data);

                const mods = (modulesRes.data ?? []).slice().sort(
                    (a, b) => a.orderIndex - b.orderIndex,
                );

                // Har module ke materials parallel fetch
                const withMaterials = await Promise.all(
                    mods.map(async (mod) => {
                        try {
                            const matRes = await listMaterials(mod.id);
                            return { ...mod, materials: matRes.data ?? [] };
                        } catch {
                            return { ...mod, materials: [] };
                        }
                    }),
                );

                if (!cancelled) setModules(withMaterials);
            } catch {
                if (!cancelled) setNotFound(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading course…
            </div>
        );
    }

    if (notFound || !course) {
        return (
            <div className="space-y-6">
                <Link
                    href="/admin/courses"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to courses
                </Link>
                <EmptyState
                    icon={BookOpen}
                    title="Course not found"
                    description="This course may have been removed."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                    href="/admin/programs"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to programs
                </Link>

                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/courses">All courses</Link>
                </Button>
            </div>

            {/* Header */}
            <div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-display text-2xl font-semibold text-foreground">
                        {course.title}
                    </h1>
                    <Badge variant={course.status === "active" ? "success" : "secondary"}>
                        {String(course.status).charAt(0).toUpperCase() +
                            String(course.status).slice(1)}
                    </Badge>
                </div>

                {course.instructorName && (
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        Instructor:{" "}
                        <span className="font-medium text-foreground">
                            {course.instructorName}
                        </span>
                    </p>
                )}

                {course.description && (
                    <div className="mt-4">
                        <h2 className="mb-1.5 text-sm font-semibold text-foreground">
                            About the Course
                        </h2>
                        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                            {course.description}
                        </p>
                    </div>
                )}

                <div className="mt-5">
                    <h2 className="mb-2 text-sm font-semibold text-foreground">
                        Course Activities
                    </h2>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {["Assignments", "Quizzes", "Project(s)", "Exam(s)", "Attendance", "Grading"].map(
                            (activity) => (
                                <span
                                    key={activity}
                                    className="rounded-md border border-border px-2.5 py-1"
                                >
                                    {activity}
                                </span>
                            ),
                        )}
                    </div>
                </div>

                {course.objectives && course.objectives.length > 0 && (
                    <div className="mt-5">
                        <h2 className="mb-2 text-sm font-semibold text-foreground">
                            Skills you gain
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {course.objectives.map((skill) => (
                                <Badge key={skill} variant="outline" className="font-normal">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Card>
                    <CardContent className="p-4 pt-4">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <p className="mt-2 font-display text-xl font-semibold">
                            {modules.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Modules</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 pt-4">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <p className="mt-2 font-display text-xl font-semibold">
                            {course.studentCount ?? 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Students</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 pt-4">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="mt-2 font-display text-xl font-semibold capitalize">
                            {course.status}
                        </p>
                        <p className="text-xs text-muted-foreground">Status</p>
                    </CardContent>
                </Card>
            </div>

            {/* Modules + Materials */}
            <section>
                <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
                    Modules
                </h2>

                {modules.length === 0 ? (
                    <EmptyState
                        icon={Layers}
                        title="No modules yet"
                        description="Modules added to this course will appear here."
                    />
                ) : (
                    <div className="space-y-3">
                        {modules.map((mod, index) => (
                            <Card key={mod.id}>
                                <CardContent className="p-4 pt-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-semibold text-primary">
                                            {index + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-foreground">{mod.title}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Module {index + 1}
                                            </p>

                                            {/* Materials list */}
                                            {mod.materials.length > 0 ? (
                                                <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                                                    {mod.materials.map((mat) => (
                                                        <li key={mat.id}>
                                                            {mat.url ? (

                                                                href = { mat.url }
                                                                    target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                                                >
                                                            <FileText className="h-3.5 w-3.5 shrink-0" />
                                                            {mat.title}
                                                            <ExternalLink className="h-3 w-3 opacity-60" />
                                                        </a>
                                                    ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                                        <FileText className="h-3.5 w-3.5 shrink-0" />
                                                        {mat.title}
                                                    </span>
                                                            )}
                                                </li>
                                            ))}
                                        </ul>
                                        ) : (
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            No materials yet
                                        </p>
                                            )}
                                    </div>
                                </div>
                            </CardContent>
                            </Card>
                ))}
        </div>
    )
}
            </section >
        </div >
    );
}





// "use client";

// import { use, useEffect, useState } from "react";
// import Link from "next/link";
// import {
//     ArrowLeft,
//     BookOpen,
//     Loader2,
//     FileText,
//     Layers,
//     ExternalLink,
// } from "lucide-react";
// import {
//     getCourse,
//     listModules,
//     listMaterials,
//     type Course,
//     type Module,
//     type Material,
// } from "@/lib/api/courses";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { EmptyState } from "@/components/shared/empty-state";
// import { Button } from "@/components/ui/button";

// type ModuleWithMaterials = Module & { materials: Material[] };

// export default function AdminCourseDetailPage({
//     params,
// }: {
//     params: Promise<{ id: string }>;
// }) {
//     const { id } = use(params);
//     const [course, setCourse] = useState<Course | null>(null);
//     const [modules, setModules] = useState<ModuleWithMaterials[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [notFound, setNotFound] = useState(false);

//     useEffect(() => {
//         let cancelled = false;

//         async function load() {
//             try {
//                 const [courseRes, modulesRes] = await Promise.all([
//                     getCourse(id),
//                     listModules(id),
//                 ]);

//                 if (cancelled) return;

//                 setCourse(courseRes.data);

//                 const mods = (modulesRes.data ?? []).slice().sort(
//                     (a, b) => a.orderIndex - b.orderIndex,
//                 );

//                 // Har module ke materials parallel fetch
//                 const withMaterials = await Promise.all(
//                     mods.map(async (mod) => {
//                         try {
//                             const matRes = await listMaterials(mod.id);
//                             return { ...mod, materials: matRes.data ?? [] };
//                         } catch {
//                             return { ...mod, materials: [] };
//                         }
//                     }),
//                 );

//                 if (!cancelled) setModules(withMaterials);
//             } catch {
//                 if (!cancelled) setNotFound(true);
//             } finally {
//                 if (!cancelled) setLoading(false);
//             }
//         }

//         load();

//         return () => {
//             cancelled = true;
//         };
//     }, [id]);

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground">
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 Loading course…
//             </div>
//         );
//     }

//     if (notFound || !course) {
//         return (
//             <div className="space-y-6">
//                 <Link
//                     href="/admin/courses"
//                     className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
//                 >
//                     <ArrowLeft className="h-3.5 w-3.5" />
//                     Back to courses
//                 </Link>
//                 <EmptyState
//                     icon={BookOpen}
//                     title="Course not found"
//                     description="This course may have been removed."
//                 />
//             </div>
//         );
//     }

//     return (
//         <div className="space-y-6">
//             {/* Back */}
//             <div className="flex flex-wrap items-center justify-between gap-3">
//                 <Link
//                     href="/admin/programs"
//                     className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
//                 >
//                     <ArrowLeft className="h-3.5 w-3.5" />
//                     Back to programs
//                 </Link>

//                 <Button asChild variant="outline" size="sm">
//                     <Link href="/admin/courses">All courses</Link>
//                 </Button>
//             </div>

//             {/* Header */}
//             <div>
//                 <div className="flex flex-wrap items-center gap-2.5">
//                     <h1 className="font-display text-2xl font-semibold text-foreground">
//                         {course.title}
//                     </h1>
//                     <Badge variant={course.status === "active" ? "success" : "secondary"}>
//                         {String(course.status).charAt(0).toUpperCase() +
//                             String(course.status).slice(1)}
//                     </Badge>
//                 </div>

//                 {course.instructorName && (
//                     <p className="mt-1.5 text-sm text-muted-foreground">
//                         Instructor:{" "}
//                         <span className="font-medium text-foreground">
//                             {course.instructorName}
//                         </span>
//                     </p>
//                 )}

//                 {course.description && (
//                     <div className="mt-4">
//                         <h2 className="mb-1.5 text-sm font-semibold text-foreground">
//                             About the Course
//                         </h2>
//                         <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
//                             {course.description}
//                         </p>
//                     </div>
//                 )}
//             </div>

//             {/* Stats */}
//             <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
//                 <Card>
//                     <CardContent className="p-4 pt-4">
//                         <Layers className="h-4 w-4 text-muted-foreground" />
//                         <p className="mt-2 font-display text-xl font-semibold">
//                             {modules.length}
//                         </p>
//                         <p className="text-xs text-muted-foreground">Modules</p>
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardContent className="p-4 pt-4">
//                         <BookOpen className="h-4 w-4 text-muted-foreground" />
//                         <p className="mt-2 font-display text-xl font-semibold">
//                             {course.studentCount ?? 0}
//                         </p>
//                         <p className="text-xs text-muted-foreground">Students</p>
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardContent className="p-4 pt-4">
//                         <FileText className="h-4 w-4 text-muted-foreground" />
//                         <p className="mt-2 font-display text-xl font-semibold capitalize">
//                             {course.status}
//                         </p>
//                         <p className="text-xs text-muted-foreground">Status</p>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Modules + Materials */}
//             <section>
//                 <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
//                     Modules
//                 </h2>

//                 {modules.length === 0 ? (
//                     <EmptyState
//                         icon={Layers}
//                         title="No modules yet"
//                         description="Modules added to this course will appear here."
//                     />
//                 ) : (
//                     <div className="space-y-3">
//                         {modules.map((mod, index) => (
//                             <Card key={mod.id}>
//                                 <CardContent className="p-4 pt-4">
//                                     <div className="flex items-start gap-4">
//                                         <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-semibold text-primary">
//                                             {index + 1}
//                                         </div>
//                                         <div className="min-w-0 flex-1">
//                                             <p className="font-medium text-foreground">{mod.title}</p>
//                                             <p className="mt-0.5 text-xs text-muted-foreground">
//                                                 Module {index + 1}
//                                             </p>

//                                             {/* Materials list */}
//                                             {mod.materials.length > 0 ? (
//                                                 <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
//                                                     {mod.materials.map((mat) => (
//                                                         <li key={mat.id}>
//                                                             {mat.url ? (
//                                                                 <a
//                                                                     href={mat.url}
//                                                                     target="_blank"
//                                                                     rel="noopener noreferrer"
//                                                                     className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
//                                                                 >
//                                                                     <FileText className="h-3.5 w-3.5 shrink-0" />
//                                                                     {mat.title}
//                                                                     <ExternalLink className="h-3 w-3 opacity-60" />
//                                                                 </a>
//                                                             ) : (
//                                                                 <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
//                                                                     <FileText className="h-3.5 w-3.5 shrink-0" />
//                                                                     {mat.title}
//                                                                 </span>
//                                                             )}
//                                                         </li>
//                                                     ))}
//                                                 </ul>
//                                             ) : (
//                                                 <p className="mt-2 text-xs text-muted-foreground">
//                                                     No materials yet
//                                                 </p>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         ))}
//                     </div>
//                 )}
//             </section>
//         </div>
//     );
// }