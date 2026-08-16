"use client";

/**
 * Student courses — every course the student is enrolled in, with the materials
 * their instructor has shared and the course's modules.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  listCourses,
  listModules,
  type Course,
  type Module,
} from "@/lib/api/courses";
import {
  downloadMaterial,
  formatFileSize,
  listMaterials,
  type Material,
} from "@/lib/api/materials";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { FileTypeIcon, guessFileKind } from "@/components/shared/file-icon";
import { cn, errorMessage, formatDate } from "@/lib/utils";

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [materialsByCourse, setMaterialsByCourse] = useState<Record<string, Material[]>>({});
  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({});
  const [loadingCourse, setLoadingCourse] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listCourses()
      .then((res) => {
        if (!cancelled) setCourses(res.data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(errorMessage(err, "Could not load your courses."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleCourse(courseId: string) {
    if (expanded === courseId) {
      setExpanded(null);
      return;
    }
    setExpanded(courseId);

    if (materialsByCourse[courseId] && modulesByCourse[courseId]) return;

    setLoadingCourse(courseId);
    const [mats, mods] = await Promise.allSettled([
      listMaterials(courseId),
      listModules(courseId),
    ]);
    setMaterialsByCourse((prev) => ({
      ...prev,
      [courseId]: mats.status === "fulfilled" ? mats.value.data : [],
    }));
    setModulesByCourse((prev) => ({
      ...prev,
      [courseId]: mods.status === "fulfilled" ? mods.value.data : [],
    }));
    setLoadingCourse(null);
  }

  async function handleOpen(material: Material) {
    try {
      await downloadMaterial(material);
    } catch (err) {
      toast.error(errorMessage(err, "Could not open the file."));
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-foreground">My courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a course to read and download the materials your instructor has shared.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading courses…
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="You're not enrolled yet"
          description="Once you're enrolled in a course it will show up here, along with its materials."
        />
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const isOpen = expanded === course.id;
            const materials = materialsByCourse[course.id] || [];
            const modules = modulesByCourse[course.id] || [];

            return (
              <div
                key={course.id}
                className="overflow-hidden rounded-2xl border border-border bg-card card-shadow"
              >
                <button
                  type="button"
                  onClick={() => toggleCourse(course.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-secondary/50 sm:p-5"
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                    <BookOpen className="h-5 w-5 text-on-primary-soft" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-base font-semibold">{course.title}</h2>
                    <p className="clamp-2 mt-1 text-sm text-muted-foreground">
                      {course.description || "No description"}
                    </p>
                    {course.instructorName && (
                      <p className="mt-1 text-xs text-faint-foreground">
                        {course.instructorName}
                      </p>
                    )}
                  </div>

                  <ChevronRight
                    className={cn(
                      "mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-90",
                    )}
                    aria-hidden
                  />
                </button>

                {isOpen && (
                  <div className="space-y-6 border-t border-border p-4 sm:p-5">
                    {loadingCourse === course.id ? (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading course content…
                      </p>
                    ) : (
                      <>
                        <section className="space-y-3">
                          <h3 className="text-sm font-semibold">
                            Materials{" "}
                            <span className="font-normal text-muted-foreground">
                              ({materials.length})
                            </span>
                          </h3>

                          {materials.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                              Your instructor hasn&apos;t shared any materials for this
                              course yet.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {materials.map((material) => (
                                <li
                                  key={material.id}
                                  className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted/50 p-3"
                                >
                                  <FileTypeIcon
                                    kind={guessFileKind(material.fileName || material.title)}
                                  />

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                      {material.title}
                                    </p>
                                    {material.description && (
                                      <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
                                        {material.description}
                                      </p>
                                    )}
                                    <p className="mt-1 text-xs text-faint-foreground">
                                      {[
                                        material.uploadedByName,
                                        material.createdAt
                                          ? formatDate(material.createdAt)
                                          : "",
                                        material.type === "link"
                                          ? "Link"
                                          : formatFileSize(material.fileSize),
                                      ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </p>
                                  </div>

                                  {material.url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="shrink-0"
                                      onClick={() => handleOpen(material)}
                                    >
                                      {material.type === "link" ? (
                                        <>
                                          <ExternalLink className="h-4 w-4" /> Open
                                        </>
                                      ) : (
                                        <>
                                          <Download className="h-4 w-4" /> Download
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </section>

                        {modules.length > 0 && (
                          <section className="space-y-2 border-t border-border pt-4">
                            <h3 className="text-sm font-semibold">Modules</h3>
                            <ul className="space-y-1.5">
                              {modules
                                .slice()
                                .sort((a, b) => a.orderIndex - b.orderIndex)
                                .map((module, index) => (
                                  <li
                                    key={module.id}
                                    className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2"
                                  >
                                    <span className="text-xs font-bold text-faint-foreground">
                                      {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-sm">
                                      {module.title}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          </section>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}