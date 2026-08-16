"use client";

import { useEffect, useState } from "react";
import {
  listCourses,
  createCourse,
  listModules,
  createModule,
  listMaterials,
  createMaterial,
  Course,
  Module,
  Material,
} from "@/lib/api/courses";
import { Plus, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { errorMessage } from "@/lib/utils";

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({});
  const [materialsByModule, setMaterialsByModule] = useState<Record<string, Material[]>>({});
  const [moduleTitle, setModuleTitle] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialContent, setMaterialContent] = useState("");
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await listCourses();
      setCourses(res.data);
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await createCourse(title, description);
      setCourses((prev) => [res.data, ...prev]);
      setTitle("");
      setDescription("");
      setShowForm(false);
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function toggleCourse(courseId: string) {
    if (expanded === courseId) {
      setExpanded(null);
      return;
    }
    setExpanded(courseId);
    if (!modulesByCourse[courseId]) {
      const res = await listModules(courseId);
      setModulesByCourse((prev) => ({ ...prev, [courseId]: res.data }));
    }
  }

  async function handleAddModule(courseId: string) {
    if (!moduleTitle.trim()) return;
    const res = await createModule(courseId, moduleTitle.trim());
    setModulesByCourse((prev) => ({
      ...prev,
      [courseId]: [...(prev[courseId] || []), res.data],
    }));
    setModuleTitle("");
  }

  async function openModule(moduleId: string) {
    setActiveModule(activeModule === moduleId ? null : moduleId);
    if (!materialsByModule[moduleId]) {
      const res = await listMaterials(moduleId);
      setMaterialsByModule((prev) => ({ ...prev, [moduleId]: res.data }));
    }
  }

  async function handleAddMaterial(moduleId: string) {
    if (!materialTitle.trim()) return;
    const res = await createMaterial(moduleId, {
      title: materialTitle.trim(),
      type: "text",
      content: materialContent,
    });
    setMaterialsByModule((prev) => ({
      ...prev,
      [moduleId]: [...(prev[moduleId] || []), res.data],
    }));
    setMaterialTitle("");
    setMaterialContent("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">My courses</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create courses, modules, and learning materials.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={16} /> New course
        </button>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreateCourse} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Course title"
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Short description"
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create course"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-faint-foreground">Loading…</p>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <BookOpen className="mx-auto mb-3 text-faint-foreground" size={28} />
          <p className="text-sm text-faint-foreground">No courses yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => {
            const open = expanded === c.id;
            const modules = modulesByCourse[c.id] || [];
            return (
              <div key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleCourse(c.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <div>
                    <p className="font-medium text-foreground">{c.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{c.description || "No description"}</p>
                  </div>
                  {open ? <ChevronDown size={18} className="text-faint-foreground" /> : <ChevronRight size={18} className="text-faint-foreground" />}
                </button>

                {open && (
                  <div className="border-t border-border bg-surface-muted/50 px-5 py-4 space-y-4">
                    <div className="flex gap-2">
                      <input
                        value={moduleTitle}
                        onChange={(e) => setModuleTitle(e.target.value)}
                        placeholder="New module title"
                        className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddModule(c.id)}
                        className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
                      >
                        Add module
                      </button>
                    </div>

                    {modules.length === 0 ? (
                      <p className="text-sm text-faint-foreground">No modules yet.</p>
                    ) : (
                      modules.map((m) => (
                        <div key={m.id} className="rounded-xl border border-border bg-card p-4">
                          <button
                            type="button"
                            onClick={() => openModule(m.id)}
                            className="flex w-full items-center justify-between text-left"
                          >
                            <span className="text-sm font-medium text-foreground">{m.title}</span>
                            {activeModule === m.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          {activeModule === m.id && (
                            <div className="mt-3 space-y-3 border-t border-border pt-3">
                              {(materialsByModule[m.id] || []).map((mat) => (
                                <div key={mat.id} className="rounded-lg bg-surface-muted px-3 py-2">
                                  <p className="text-sm font-medium text-foreground">{mat.title}</p>
                                  {mat.content && <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{mat.content}</p>}
                                </div>
                              ))}
                              <input
                                value={materialTitle}
                                onChange={(e) => setMaterialTitle(e.target.value)}
                                placeholder="Material title"
                                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                              />
                              <textarea
                                value={materialContent}
                                onChange={(e) => setMaterialContent(e.target.value)}
                                placeholder="Material content / notes"
                                rows={2}
                                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddMaterial(m.id)}
                                className="rounded-lg bg-popover px-3 py-2 text-xs font-medium text-popover-foreground border border-border card-shadow"
                              >
                                Add material
                              </button>
                            </div>
                          )}
                        </div>
                      ))
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
