"use client";

/**
 * Instructor courses page — each course expands into its materials (upload any
 * file with a description; every enrolled student sees it) and its modules.
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronRight,
  Download,
  ExternalLink,
  Link2,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import {
  listCourses,
  listModules,
  createModule,
  type Course,
  type Module,
} from "@/lib/api/courses";
import {
  createMaterial,
  deleteMaterial,
  downloadMaterial,
  formatFileSize,
  listMaterials,
  type Material,
} from "@/lib/api/materials";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { FileTypeIcon, guessFileKind } from "@/components/shared/file-icon";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage, cn } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  active: "success",
  published: "success",
  draft: "warning",
  archived: "secondary",
};

const MODULE_COLORS = [
  { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200", icon: "bg-violet-600" },
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: "bg-emerald-600" },
  { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200", icon: "bg-sky-600" },
  { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", icon: "bg-rose-600" },
  { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: "bg-amber-600" },
  { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", icon: "bg-indigo-600" },
];

export default function InstructorCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({});
  const [materialsByCourse, setMaterialsByCourse] = useState<Record<string, Material[]>>({});
  const [loadingCourse, setLoadingCourse] = useState<string | null>(null);

  /* add-module form */
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  /* upload-material form */
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const [matTitle, setMatTitle] = useState("");
  const [matDescription, setMatDescription] = useState("");
  const [matFile, setMatFile] = useState<File | null>(null);
  const [matUrl, setMatUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listCourses(user?.id ? { instructorId: user.id } : {})
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
  }, [user?.id]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter((course) =>
      `${course.title} ${course.description}`.toLowerCase().includes(term),
    );
  }, [courses, search]);

  async function toggleCourse(courseId: string) {
    if (expanded === courseId) {
      setExpanded(null);
      return;
    }

    setExpanded(courseId);
    setAddingFor(null);
    resetUploadForm();

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

  function resetUploadForm() {
    setUploadFor(null);
    setMatTitle("");
    setMatDescription("");
    setMatFile(null);
    setMatUrl("");
  }

  async function handleUpload(courseId: string) {
    if (!matFile && !matUrl.trim() && !matDescription.trim()) {
      toast.error("Pick a file, paste a link, or write a note first.");
      return;
    }

    setUploading(true);
    try {
      const res = await createMaterial({
        courseId,
        title: matTitle,
        description: matDescription,
        file: matFile,
        url: matUrl,
      });

      setMaterialsByCourse((prev) => ({
        ...prev,
        [courseId]: [res.data, ...(prev[courseId] || [])],
      }));
      resetUploadForm();
      toast.success(res.message || "Material shared with your students.");
    } catch (err) {
      toast.error(errorMessage(err, "Could not upload the material."));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(courseId: string, material: Material) {
    try {
      await deleteMaterial(material.id);
      setMaterialsByCourse((prev) => ({
        ...prev,
        [courseId]: (prev[courseId] || []).filter((m) => m.id !== material.id),
      }));
      toast.success(`"${material.title}" removed`);
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the material."));
    }
  }

  async function handleDownload(material: Material) {
    try {
      await downloadMaterial(material);
    } catch (err) {
      toast.error(errorMessage(err, "Could not download the file."));
    }
  }

  async function handleAddModule(courseId: string) {
    const title = newTitle.trim();
    if (!title) {
      toast.error("Module title is required.");
      return;
    }

    setSaving(true);
    try {
      const orderIndex = (modulesByCourse[courseId] || []).length;
      const res = await createModule(courseId, title, orderIndex);
      setModulesByCourse((prev) => ({
        ...prev,
        [courseId]: [...(prev[courseId] || []), res.data],
      }));
      setNewTitle("");
      setAddingFor(null);
      toast.success("Module added.");
    } catch (err) {
      toast.error(errorMessage(err, "Could not add module."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-foreground">My courses</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Expand a course to share materials with everyone enrolled in it, or to manage
          its modules.
        </p>
      </header>

      <div className="relative sm:max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your courses…"
          aria-label="Search courses"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading courses…
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search ? "No courses match your search" : "No courses assigned"}
          description={
            search
              ? "Try a different search term."
              : "Once an administrator assigns you a course, it will appear here."
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((course) => {
            const isOpen = expanded === course.id;
            const materials = materialsByCourse[course.id] || [];
            const modules = modulesByCourse[course.id] || [];
            const isUploading = uploadFor === course.id;
            const isAdding = addingFor === course.id;

            return (
              <Card key={course.id} className="overflow-hidden">
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
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base font-semibold text-foreground">
                        {course.title}
                      </h2>
                      <Badge variant={STATUS_VARIANT[course.status] ?? "secondary"}>
                        {course.status}
                      </Badge>
                    </div>

                    {course.description && (
                      <p className="clamp-2 mt-1 text-sm leading-relaxed text-muted-foreground">
                        {course.description}
                      </p>
                    )}

                    <p className="mt-2 flex items-center gap-1.5 text-xs text-faint-foreground">
                      <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {course.studentCount ?? 0} enrolled
                    </p>
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
                  <CardContent className="space-y-6 border-t border-border p-4 pt-4 sm:p-5 sm:pt-4">
                    {loadingCourse === course.id ? (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading course content…
                      </p>
                    ) : (
                      <>
                        {/* ---------------- materials ---------------- */}
                        <section className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold">
                              Course materials{" "}
                              <span className="font-normal text-muted-foreground">
                                ({materials.length})
                              </span>
                            </h3>
                            {!isUploading && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  resetUploadForm();
                                  setUploadFor(course.id);
                                }}
                              >
                                <Upload className="h-4 w-4" /> Upload material
                              </Button>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Anything you add here reaches all {course.studentCount ?? 0}{" "}
                            enrolled students, and they get a notification.
                          </p>

                          {isUploading && (
                            <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
                              <Input
                                value={matTitle}
                                onChange={(e) => setMatTitle(e.target.value)}
                                placeholder="Title (optional — the file name is used otherwise)"
                              />

                              <div>
                                <input
                                  type="file"
                                  onChange={(e) => setMatFile(e.target.files?.[0] ?? null)}
                                  className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
                                />
                                <p className="mt-1 text-xs text-faint-foreground">
                                  Any file type · up to 50 MB
                                </p>
                              </div>

                              <div className="relative">
                                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground" />
                                <Input
                                  value={matUrl}
                                  onChange={(e) => setMatUrl(e.target.value)}
                                  placeholder="…or paste a link instead (https://…)"
                                  className="pl-9"
                                />
                              </div>

                              <textarea
                                value={matDescription}
                                onChange={(e) => setMatDescription(e.target.value)}
                                placeholder="Description — tell students what this is and how to use it…"
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-faint-foreground"
                              />

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpload(course.id)}
                                  disabled={uploading}
                                >
                                  {uploading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" /> Sharing…
                                    </>
                                  ) : (
                                    "Share with students"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={resetUploadForm}
                                  disabled={uploading}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {materials.length === 0 && !isUploading ? (
                            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                              Nothing shared yet. Upload lecture slides, notes or a reading
                              list to get started.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {materials.map((material) => (
                                <li
                                  key={material.id}
                                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
                                >
                                  <FileTypeIcon
                                    kind={guessFileKind(
                                      material.fileName || material.title,
                                    )}
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
                                      {material.type === "link"
                                        ? "External link"
                                        : [
                                          material.fileName,
                                          formatFileSize(material.fileSize),
                                        ]
                                          .filter(Boolean)
                                          .join(" · ")}
                                      {material.downloadCount > 0 &&
                                        ` · ${material.downloadCount} download${material.downloadCount === 1 ? "" : "s"}`}
                                    </p>
                                  </div>

                                  <div className="flex shrink-0 gap-1">
                                    {material.url && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label={`Open ${material.title}`}
                                        onClick={() => handleDownload(material)}
                                      >
                                        {material.type === "link" ? (
                                          <ExternalLink className="h-4 w-4" />
                                        ) : (
                                          <Download className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      aria-label={`Delete ${material.title}`}
                                      className="text-danger hover:text-danger"
                                      onClick={() => handleDelete(course.id, material)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </section>

                        {/* ---------------- modules ---------------- */}
                        <section className="space-y-3 border-t border-border pt-4">
                          <h3 className="text-sm font-semibold">
                            Modules{" "}
                            <span className="font-normal text-muted-foreground">
                              ({modules.length})
                            </span>
                          </h3>

                          {modules.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No modules have been added to this course yet.
                            </p>
                          ) : (
                            <ul className="space-y-2.5">
                              {modules
                                .slice()
                                .sort((a, b) => a.orderIndex - b.orderIndex)
                                .map((module, index) => {
                                  const color = MODULE_COLORS[index % MODULE_COLORS.length];
                                  return (
                                    <li
                                      key={module.id}
                                      className={cn(
                                        "flex items-center gap-3 rounded-xl border px-3.5 py-3",
                                        color.bg,
                                        color.border,
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
                                          color.icon,
                                        )}
                                      >
                                        {String(index + 1).padStart(2, "0")}
                                      </div>
                                      <p
                                        className={cn(
                                          "min-w-0 flex-1 truncate text-sm font-medium",
                                          color.text,
                                        )}
                                      >
                                        {module.title}
                                      </p>
                                    </li>
                                  );
                                })}
                            </ul>
                          )}

                          {isAdding ? (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <Input
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Module title (e.g. Introduction to MongoDB)"
                                className="flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddModule(course.id);
                                  if (e.key === "Escape") {
                                    setAddingFor(null);
                                    setNewTitle("");
                                  }
                                }}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAddModule(course.id)}
                                  disabled={saving}
                                >
                                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingFor(null);
                                    setNewTitle("");
                                  }}
                                  disabled={saving}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => setAddingFor(course.id)}
                            >
                              <Plus className="h-4 w-4" />
                              Add module
                            </Button>
                          )}
                        </section>
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}