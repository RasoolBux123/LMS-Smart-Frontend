"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  Download,
  GraduationCap,
  Loader2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { listCourses, type Course } from "@/lib/api/courses";
import {
  getCourseWeights,
  setCourseWeights,
  getStudentGrading,
  type StudentGradingReport,
} from "@/lib/api/grading";
import { listCourseEnrollments, type Enrollment } from "@/lib/api/enrollments";
import {
  assignmentsApi,
  quizzesApi,
  examsApi,
  projectsApi,
  type CourseworkListItem,
} from "@/lib/api/coursework";
import { gradeSubmission } from "@/lib/api/assignments";
import { getCourseAttendance } from "@/lib/api/attendance";
import { GradingModal } from "@/features/instructor/grading-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn, errorMessage } from "@/lib/utils";
import type { User } from "@/types";

type SectionKey = "assignments" | "quizzes" | "projects" | "exams";

interface StudentRow {
  student: User;
  submissionId: string | null;
  obtainedMarks: number | null;
  feedback: string | null;
  passFail: "pass" | "fail" | null;
  status: "not_submitted" | "pending" | "graded" | "late";
}

interface KpiRow {
  component: SectionKey;
  label: string;
  weightagePercent: number;
}

const SECTION_META = [
  {
    key: "assignments" as const,
    label: "Assignment",
    api: assignmentsApi,
    defaultWeight: 25,
  },
  {
    key: "quizzes" as const,
    label: "Quiz",
    api: quizzesApi,
    defaultWeight: 25,
  },
  {
    key: "projects" as const,
    label: "Project",
    api: projectsApi,
    defaultWeight: 25,
  },
  {
    key: "exams" as const,
    label: "Exam",
    api: examsApi,
    defaultWeight: 25,
  },
];

function asArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const d = (raw as { data?: unknown }).data;
    if (Array.isArray(d)) return d as T[];
  }
  return [];
}

function defaultKpis(): KpiRow[] {
  return SECTION_META.map((s) => ({
    component: s.key,
    label: s.label,
    weightagePercent: s.defaultWeight,
  }));
}

function weightsToKpis(w: {
  Assignment: number;
  Quiz: number;
  Project: number;
  Exam: number;
}): KpiRow[] {
  return [
    {
      component: "assignments",
      label: "Assignment",
      weightagePercent: w.Assignment,
    },
    { component: "quizzes", label: "Quiz", weightagePercent: w.Quiz },
    { component: "projects", label: "Project", weightagePercent: w.Project },
    { component: "exams", label: "Exam", weightagePercent: w.Exam },
  ];
}

function kpisToWeights(rows: KpiRow[]) {
  const map: Record<string, number> = {};
  for (const r of rows) map[r.label] = Number(r.weightagePercent) || 0;
  return {
    Assignment: map["Assignment"] ?? 25,
    Quiz: map["Quiz"] ?? 25,
    Project: map["Project"] ?? 25,
    Exam: map["Exam"] ?? 25,
  };
}

function CourseworkSection({
  meta,
  courseId,
  enrollments,
  itemId,
  onItemIdChange,
}: {
  meta: (typeof SECTION_META)[number];
  courseId: string;
  enrollments: Enrollment[];
  itemId: string;
  onItemIdChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(meta.key === "assignments");
  const [items, setItems] = useState<CourseworkListItem[]>([]);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [gradingFor, setGradingFor] = useState<StudentRow | null>(null);

  const selected = items.find((i) => i.id === itemId) ?? null;

  useEffect(() => {
    if (!courseId) {
      setItems([]);
      return;
    }
    let alive = true;
    setLoadingItems(true);
    meta.api
      .list({ courseId })
      .then((raw) => {
        if (!alive) return;
        const list = asArray<CourseworkListItem>(raw).filter(
          (i) => !i.courseId || i.courseId === courseId,
        );
        setItems(list);
      })
      .catch(() => {
        if (alive) setItems([]);
      })
      .finally(() => {
        if (alive) setLoadingItems(false);
      });
    return () => {
      alive = false;
    };
  }, [courseId, meta.api, meta.key]);

  const loadRows = useCallback(async () => {
    if (!itemId || !selected) {
      setRows([]);
      return;
    }
    setLoadingRows(true);
    try {
      const subsRaw = await meta.api
        .listSubmissions(itemId)
        .catch(() => ({ data: [] }));
      const subs = asArray<{
        id: string;
        studentId: string;
        status?: string;
        marksAwarded?: number | null;
        score?: number | null;
        feedback?: string | null;
        passFail?: "pass" | "fail" | null;
        attemptNumber?: number;
      }>(subsRaw);

      const byStudent = new Map<string, (typeof subs)[number]>();
      for (const s of subs) {
        if (!s?.studentId) continue;
        const prev = byStudent.get(s.studentId);
        if (!prev || (s.attemptNumber ?? 1) > (prev.attemptNumber ?? 1)) {
          byStudent.set(s.studentId, s);
        }
      }

      const built: StudentRow[] = [];
      const seen = new Set<string>();

      for (const e of enrollments) {
        const st = e.student;
        const sid = st?.id || e.userId;
        if (!sid) continue;
        seen.add(sid);
        const sub = byStudent.get(sid);
        const marks =
          sub?.marksAwarded != null
            ? sub.marksAwarded
            : sub?.score != null
              ? sub.score
              : null;
        let status: StudentRow["status"] = "not_submitted";
        if (sub) {
          if (marks != null || sub.status === "graded") status = "graded";
          else if (sub.status === "late") status = "late";
          else status = "pending";
        }
        built.push({
          student: {
            id: sid,
            name: st?.name || sid,
            email: st?.email || "",
            role: "student",
            avatarColor: "#0D9488",
          },
          submissionId: sub?.id ?? null,
          obtainedMarks: marks,
          feedback: sub?.feedback ?? null,
          passFail: sub?.passFail ?? null,
          status,
        });
      }

      for (const [sid, sub] of byStudent) {
        if (seen.has(sid)) continue;
        const marks =
          sub.marksAwarded != null
            ? sub.marksAwarded
            : sub.score != null
              ? sub.score
              : null;
        built.push({
          student: {
            id: sid,
            name: sid,
            email: "",
            role: "student",
            avatarColor: "#0D9488",
          },
          submissionId: sub.id,
          obtainedMarks: marks,
          feedback: sub.feedback ?? null,
          passFail: sub.passFail ?? null,
          status:
            marks != null || sub.status === "graded"
              ? "graded"
              : sub.status === "late"
                ? "late"
                : "pending",
        });
      }

      built.sort((a, b) => a.student.name.localeCompare(b.student.name));
      setRows(built);
    } catch (err: unknown) {
      setRows([]);
      toast.error(errorMessage(err, "Could not load students."));
    } finally {
      setLoadingRows(false);
    }
  }, [itemId, selected, enrollments, meta.api]);

  useEffect(() => {
    if (open) loadRows();
  }, [open, loadRows]);

  async function handleGradeSave(
    studentId: string,
    marks: number,
    feedback: string,
    passFail: "pass" | "fail" | null,
  ) {
    const row = rows.find((r) => r.student.id === studentId);
    if (!row?.submissionId) {
      toast.error("No submission to grade.");
      return;
    }
    await gradeSubmission(
      row.submissionId,
      marks,
      feedback,
      passFail ?? undefined,
    );
    setRows((prev) =>
      prev.map((r) =>
        r.student.id === studentId
          ? {
              ...r,
              obtainedMarks: marks,
              feedback,
              passFail,
              status: "graded" as const,
            }
          : r,
      ),
    );
  }

  const statusBadge = (s: StudentRow["status"]) => {
    if (s === "graded")
      return (
        <Badge className="border-0 bg-emerald-500/15 text-emerald-600">
          Graded
        </Badge>
      );
    if (s === "pending" || s === "late")
      return (
        <Badge className="border-0 bg-amber-500/15 text-amber-600">
          Pending
        </Badge>
      );
    return (
      <Badge className="border-0 bg-rose-500/15 text-rose-600">
        Not Submitted
      </Badge>
    );
  };

  function exportToExcel() {
    if (!selected || rows.length === 0) {
      toast.error("Export ke liye data nahi hai.");
      return;
    }

    const data = rows.map((r) => ({
      Student: r.student.name,
      Email: r.student.email || "",
      "Total Marks": selected.totalMarks ?? 100,
      "Obtained Marks": r.obtainedMarks ?? "",
      Status:
        r.status === "graded"
          ? "Graded"
          : r.status === "pending" || r.status === "late"
            ? "Pending"
            : "Not Submitted",
      Feedback: r.feedback ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, meta.label);

    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch:
        Math.max(
          key.length,
          ...data.map(
            (row) =>
              String((row as Record<string, unknown>)[key] ?? "").length,
          ),
        ) + 2,
    }));
    ws["!cols"] = colWidths;

    const safeTitle = selected.title.replace(/[^a-z0-9]+/gi, "_");
    const fileName = `${meta.label}_${safeTitle}_grades.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel download ho gaya!");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-primary">
          {meta.label}
          {!loadingItems && (
            <span className="ml-2 font-normal text-muted-foreground">
              ({items.length})
            </span>
          )}
          {selected && (
            <span className="ml-2 font-normal text-foreground">
              · {selected.title}
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
        <div className="space-y-3 border-t border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {loadingItems
                ? "Loading…"
                : items.length === 0
                  ? `Is course pe koi ${meta.label.toLowerCase()} nahi.`
                  : `Select ${meta.label.toLowerCase()} — students neeche`}
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={itemId || undefined}
                onValueChange={onItemIdChange}
                disabled={loadingItems || items.length === 0}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue
                    placeholder={`Select ${meta.label.toLowerCase()}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {items.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No items
                    </SelectItem>
                  ) : (
                    items.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {itemId && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onItemIdChange("")}
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {!loadingItems && items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {items.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() =>
                    onItemIdChange(itemId === i.id ? "" : i.id)
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    i.id === itemId
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {i.title}
                </button>
              ))}
            </div>
          )}

          {loadingItems || loadingRows ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Is course ke liye {meta.label.toLowerCase()} create karo.
            </p>
          ) : !selected ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Upar se {meta.label.toLowerCase()} select karo — us ke saare
              students yahan aayenge.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Is course pe koi enrolled student nahi.
            </p>
          ) : (
            <>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportToExcel}
                  className="gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Obtained</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.student.id}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          {r.student.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {r.student.email || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {selected.totalMarks ?? 100}
                        </td>
                        <td className="px-4 py-3">
                          {r.obtainedMarks != null ? r.obtainedMarks : "—"}
                        </td>
                        <td className="px-4 py-3">{statusBadge(r.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!r.submissionId}
                            onClick={() => setGradingFor(r)}
                          >
                            Grade
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {gradingFor && selected && (
            <GradingModal
              open={!!gradingFor}
              onOpenChange={(v) => !v && setGradingFor(null)}
              student={gradingFor.student}
              totalMarks={selected.totalMarks ?? 100}
              initialMarks={gradingFor.obtainedMarks}
              initialFeedback={gradingFor.feedback}
              onSave={(marks, feedback, passFail) =>
                handleGradeSave(
                  gradingFor.student.id,
                  marks,
                  feedback,
                  passFail,
                )
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function KpiEditor({
  courseId,
  kpis,
  onChange,
}: {
  courseId: string;
  kpis: KpiRow[];
  onChange: (rows: KpiRow[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(kpis);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(kpis);
  }, [kpis]);

  const total = draft.reduce(
    (s, r) => s + (Number(r.weightagePercent) || 0),
    0,
  );

  async function handleSave() {
    if (Math.abs(total - 100) > 0.01) {
      toast.error("Total weightage must equal 100%.");
      return;
    }
    const weights = kpisToWeights(draft);
    setSaving(true);
    try {
      await setCourseWeights(courseId, weights);
      onChange(draft);
      setEditing(false);
      toast.success("Weightages saved — students will see the same %.");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not save weightages."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Student Performance Overview — KPI Weights</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Edit percentages (total 100%). Saved on server for all students.
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setDraft(kpis);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1 h-3.5 w-3.5" />
                )}
                Save
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit KPIs
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Component</th>
              <th className="px-4 py-3">Weightage %</th>
            </tr>
          </thead>
          <tbody>
            {draft.map((row, idx) => (
              <tr key={row.component} className="border-b border-border/60">
                <td className="px-4 py-3 font-medium">{row.label}</td>
                <td className="px-4 py-3">
                  {editing ? (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="h-9 w-24"
                      value={row.weightagePercent}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setDraft((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  weightagePercent: Number.isFinite(v) ? v : 0,
                                }
                              : r,
                          ),
                        );
                      }}
                    />
                  ) : (
                    `${row.weightagePercent.toFixed(2)}%`
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-secondary/30 font-semibold">
              <td className="px-4 py-3">Total</td>
              <td
                className={cn(
                  "px-4 py-3",
                  Math.abs(total - 100) > 0.01 && editing && "text-destructive",
                )}
              >
                {total.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export default function InstructorGradingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [kpis, setKpis] = useState<KpiRow[]>(defaultKpis());
  const [loading, setLoading] = useState(true);
  const [exportingOverall, setExportingOverall] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Record<SectionKey, string>>({
    assignments: "",
    quizzes: "",
    projects: "",
    exams: "",
  });

  const anySelected = Object.values(selectedIds).some((id) => id !== "");

  const setSectionId = useCallback((key: SectionKey, id: string) => {
    setSelectedIds((prev) => ({ ...prev, [key]: id }));
  }, []);

  useEffect(() => {
    listCourses()
      .then((res) => {
        const list = res.data ?? asArray<Course>(res);
        setCourses(list);
        if (list.length) setCourseId(list[0].id);
      })
      .catch(() => toast.error("Could not load courses."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedIds({
      assignments: "",
      quizzes: "",
      projects: "",
      exams: "",
    });

    if (!courseId) {
      setEnrollments([]);
      return;
    }
    getCourseWeights(courseId)
      .then((res) => setKpis(weightsToKpis(res.data)))
      .catch(() => setKpis(defaultKpis()));
    listCourseEnrollments(courseId)
      .then((res) => setEnrollments(res.data ?? asArray<Enrollment>(res)))
      .catch(() => {
        setEnrollments([]);
        toast.error("Could not load enrolled students.");
      });
  }, [courseId]);

  const courseTitle = useMemo(
    () => courses.find((c) => c.id === courseId)?.title ?? "",
    [courses, courseId],
  );

  /** Overall performance export for all students in the course */
  async function exportOverallPerformance() {
    if (!courseId || enrollments.length === 0) {
      toast.error("Course select karo aur enrolled students hone chahiye.");
      return;
    }

    setExportingOverall(true);
    try {
      // Attendance summary per student
      const attendanceMap = new Map<
        string,
        { present: number; total: number; percentage: number }
      >();

      try {
        const attRes = await getCourseAttendance(courseId);
        const sessions = asArray<{
          records?: {
            studentId?: string;
            studentEmail?: string;
            status?: string;
          }[];
        }>(attRes);

        const counts = new Map<
          string,
          { present: number; total: number }
        >();

        for (const session of sessions) {
          for (const rec of session.records ?? []) {
            const key =
              rec.studentId || rec.studentEmail || "";
            if (!key) continue;
            const cur = counts.get(key) ?? { present: 0, total: 0 };
            cur.total += 1;
            if (rec.status === "present") cur.present += 1;
            counts.set(key, cur);
          }
        }

        for (const [key, c] of counts) {
          attendanceMap.set(key, {
            present: c.present,
            total: c.total,
            percentage:
              c.total > 0
                ? Math.round((c.present / c.total) * 10000) / 100
                : 0,
          });
        }
      } catch {
        // attendance optional — continue without it
      }

      const rows: Record<string, string | number>[] = [];

      for (const e of enrollments) {
        const st = e.student;
        const email = st?.email || "";
        const name = st?.name || email || e.userId || "Unknown";
        const sid = st?.id || e.userId || "";

        let report: StudentGradingReport | null = null;
        if (email) {
          try {
            const res = await getStudentGrading(email, courseId);
            report = res.data ?? null;
          } catch {
            // skip this student's grades if API fails
          }
        }

        const perf = report?.performance ?? [];
        const getComp = (label: string) =>
          perf.find(
            (p) =>
              p.component.toLowerCase() === label.toLowerCase() ||
              p.component.toLowerCase().includes(label.toLowerCase()),
          );

        const assignment = getComp("Assignment");
        const quiz = getComp("Quiz");
        const project = getComp("Project");
        const exam = getComp("Exam");

        const att =
          attendanceMap.get(sid) ||
          attendanceMap.get(email) ||
          null;

        rows.push({
          Student: name,
          Email: email,
          "Assignment Obtained": assignment?.obtainedMarks ?? "",
          "Assignment Total": assignment?.totalMarks ?? "",
          "Assignment Weighted %":
            assignment?.weightedScorePercent != null
              ? Number(assignment.weightedScorePercent.toFixed(2))
              : "",
          "Quiz Obtained": quiz?.obtainedMarks ?? "",
          "Quiz Total": quiz?.totalMarks ?? "",
          "Quiz Weighted %":
            quiz?.weightedScorePercent != null
              ? Number(quiz.weightedScorePercent.toFixed(2))
              : "",
          "Project Obtained": project?.obtainedMarks ?? "",
          "Project Total": project?.totalMarks ?? "",
          "Project Weighted %":
            project?.weightedScorePercent != null
              ? Number(project.weightedScorePercent.toFixed(2))
              : "",
          "Exam Obtained": exam?.obtainedMarks ?? "",
          "Exam Total": exam?.totalMarks ?? "",
          "Exam Weighted %":
            exam?.weightedScorePercent != null
              ? Number(exam.weightedScorePercent.toFixed(2))
              : "",
          "Attendance Present": att?.present ?? "",
          "Attendance Total Sessions": att?.total ?? "",
          "Attendance %": att?.percentage ?? "",
          "Overall Weighted Score %":
            report?.overallWeightedScorePercent != null
              ? Number(report.overallWeightedScorePercent.toFixed(2))
              : "",
          "Total Obtained Marks": report?.totalObtainedMarks ?? "",
          "Total Marks": report?.totalMarks ?? "",
        });
      }

      if (rows.length === 0) {
        toast.error("Koi student data nahi mila.");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Overall Performance");

      const colWidths = Object.keys(rows[0]).map((key) => ({
        wch:
          Math.max(
            key.length,
            ...rows.map((r) => String(r[key] ?? "").length),
          ) + 2,
      }));
      ws["!cols"] = colWidths;

      const safeCourse = (courseTitle || "Course").replace(
        /[^a-z0-9]+/gi,
        "_",
      );
      XLSX.writeFile(wb, `${safeCourse}_Overall_Performance.xlsx`);
      toast.success("Overall performance Excel download ho gaya!");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Overall export fail ho gaya."));
    } finally {
      setExportingOverall(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Grading
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Course select karo — neeche us course ki assignments, quizzes,
            projects aur exams aayengi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={courseId || undefined} onValueChange={setCourseId}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No courses
                </SelectItem>
              ) : (
                courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* ★ Overall Performance Export */}
          {courseId && enrollments.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={exportOverallPerformance}
              disabled={exportingOverall}
              className="gap-1.5"
            >
              {exportingOverall ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export Overall
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Graded
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Not Submitted
        </span>
      </div>

      {!courseId ? (
        <EmptyState
          icon={GraduationCap}
          title="Select a course"
          description="Upar se course choose karo."
        />
      ) : (
        <>
          {SECTION_META.map((meta) => (
            <CourseworkSection
              key={meta.key}
              meta={meta}
              courseId={courseId}
              enrollments={enrollments}
              itemId={selectedIds[meta.key]}
              onItemIdChange={(id) => setSectionId(meta.key, id)}
            />
          ))}

          {!anySelected && (
            <KpiEditor courseId={courseId} kpis={kpis} onChange={setKpis} />
          )}

          {courseTitle && (
            <p className="text-xs text-muted-foreground">
              Course:{" "}
              <span className="font-medium text-foreground">{courseTitle}</span>
              {" · "}
              {enrollments.length} student
              {enrollments.length === 1 ? "" : "s"} enrolled
            </p>
          )}
        </>
      )}
    </div>
  );
}


// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { listCourses, type Course } from "@/lib/api/courses";
// import { listCourseEnrollments, type Enrollment } from "@/lib/api/enrollments";
// import { getStudentGrading, type StudentGradingReport } from "@/lib/api/grading";
// import { GradingAccordion } from "@/components/shared/grading-accordion";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { EmptyState } from "@/components/shared/empty-state";

// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { GraduationCap, Users, Search, Loader2 } from "lucide-react";
// import { toast } from "sonner";
// import { InstructorInsightCard } from "@/components/ai/InstructorInsightCard";
// import { triggerInsightGeneration, buildGradeDataFromReport } from "@/lib/api/aiInsights";

// export default function InstructorGradingPage() {
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [courseId, setCourseId] = useState("");
//   const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
//   const [studentEmail, setStudentEmail] = useState("");
//   const [studentSearch, setStudentSearch] = useState("");
//   const [report, setReport] = useState<StudentGradingReport | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [loadingStudents, setLoadingStudents] = useState(false);
//   const [loadingReport, setLoadingReport] = useState(false);
//   const [insightKey, setInsightKey] = useState(0); // bump to force InstructorInsightCard to refetch
//   const lastGenerated = useRef<string>("");

//   // Instructor courses only (backend filters by role)
//   useEffect(() => {
//     listCourses()
//       .then((res) => {
//         const list = res.data ?? [];
//         setCourses(list);
//         if (list.length) setCourseId(list[0].id);
//       })
//       .catch(() => toast.error("Could not load courses."))
//       .finally(() => setLoading(false));
//   }, []);

//   // Students enrolled in selected course
//   useEffect(() => {
//     if (!courseId) {
//       setEnrollments([]);
//       setStudentEmail("");
//       return;
//     }
//     setLoadingStudents(true);
//     listCourseEnrollments(courseId)
//       .then((res) => {
//         const list = res.data ?? [];
//         setEnrollments(list);
//         const first = list.find((e) => e.student)?.student?.email ?? "";
//         setStudentEmail(first);
//         setStudentSearch("");
//       })
//       .catch(() => {
//         setEnrollments([]);
//         setStudentEmail("");
//         toast.error("Could not load enrolled students.");
//       })
//       .finally(() => setLoadingStudents(false));
//   }, [courseId]);

//   // Grading report for selected student + course
//   useEffect(() => {
//     if (!courseId || !studentEmail) {
//       setReport(null);
//       return;
//     }
//     setLoadingReport(true);
//     getStudentGrading(studentEmail, courseId)
//       .then((res) => setReport(res.data))
//       .catch(() => {
//         setReport(null);
//         toast.error("Could not load grading data.");
//       })
//       .finally(() => setLoadingReport(false));
//   }, [courseId, studentEmail]);

//   // Generate/refresh AI insight when the marks actually change
//   useEffect(() => {
//     if (!report || !courseId || !studentEmail) return;

//     const gradeData = buildGradeDataFromReport(report, studentEmail, courseId);
//     const signature = `${studentEmail}|${courseId}|${JSON.stringify(gradeData.components)}`;
//     if (lastGenerated.current === signature) return;
//     lastGenerated.current = signature;

//     triggerInsightGeneration(gradeData)
//       .then(() => setInsightKey((k) => k + 1))
//       .catch((err) => {
//         console.error("AI insight generation failed:", err);
//       });
//   }, [report, courseId, studentEmail]);

//   const filteredStudents = useMemo(() => {
//     const q = studentSearch.trim().toLowerCase();
//     const list = enrollments.filter((e) => e.student);
//     if (!q) return list;
//     return list.filter((e) => {
//       const s = e.student!;
//       return (
//         s.name?.toLowerCase().includes(q) ||
//         s.email?.toLowerCase().includes(q) ||
//         (s as { rollNumber?: string }).rollNumber?.toLowerCase().includes(q)
//       );
//     });
//   }, [enrollments, studentSearch]);

//   if (loading) {
//     return (
//       <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
//         <Loader2 className="h-5 w-5 animate-spin" />
//         Loading…
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
//         <div>
//           <h1 className="font-display text-3xl font-bold tracking-tight">
//             Grading
//           </h1>
//           <p className="mt-1 text-sm text-muted-foreground">
//             Select a course and student to review their assignments, quizzes,
//             projects, and exam grades.
//           </p>
//         </div>

//         <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
//           {/* Course dropdown */}
//           <Select value={courseId} onValueChange={(v) => setCourseId(v)}>
//             <SelectTrigger className="w-full sm:w-48">
//               <SelectValue placeholder="Select course" />
//             </SelectTrigger>
//             <SelectContent>
//               {courses.length === 0 ? (
//                 <SelectItem value="__none" disabled>
//                   No courses
//                 </SelectItem>
//               ) : (
//                 courses.map((c) => (
//                   <SelectItem key={c.id} value={c.id}>
//                     {c.title}
//                   </SelectItem>
//                 ))
//               )}
//             </SelectContent>
//           </Select>

//           {/* Search students */}
//           <div className="relative w-full sm:w-52">
//             <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//             <Input
//               placeholder="Search students…"
//               className="pl-9"
//               value={studentSearch}
//               onChange={(e) => setStudentSearch(e.target.value)}
//               disabled={!courseId || loadingStudents}
//             />
//           </div>

//           {/* Student dropdown */}
//           <Select
//             value={studentEmail}
//             onValueChange={(v) => setStudentEmail(v)}
//             disabled={!courseId || loadingStudents}
//           >
//             <SelectTrigger className="w-full sm:w-64">
//               <SelectValue
//                 placeholder={
//                   loadingStudents
//                     ? "Loading students…"
//                     : filteredStudents.length === 0
//                       ? "No students found"
//                       : "Select student"
//                 }
//               />
//             </SelectTrigger>
//             <SelectContent>
//               {filteredStudents.length === 0 ? (
//                 <SelectItem value="__none" disabled>
//                   {studentSearch ? "No match" : "No enrolled students"}
//                 </SelectItem>
//               ) : (
//                 filteredStudents.map((e) => (
//                   <SelectItem key={e.id} value={e.student!.email}>
//                     {e.student!.name} ({e.student!.email})
//                   </SelectItem>
//                 ))
//               )}
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       {/* Status legend */}
//       <div className="flex flex-wrap items-center gap-6 text-sm">
//         <span className="flex items-center gap-1.5">
//           <span className="h-3.5 w-3.5 rounded-full bg-success" /> Submitted
//         </span>
//         <span className="flex items-center gap-1.5">
//           <span className="h-3.5 w-3.5 rounded-full bg-warning" /> Pending
//         </span>
//         <span className="flex items-center gap-1.5">
//           <span className="h-3.5 w-3.5 rounded-full bg-danger" /> Not Submitted
//         </span>
//       </div>

//       {loadingReport ? (
//         <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
//           <Loader2 className="h-4 w-4 animate-spin" />
//           Loading grading data…
//         </div>
//       ) : !studentEmail ? (
//         <EmptyState
//           icon={Users}
//           title="No student selected"
//           description="Choose a course and student above to view their grading record."
//         />
//       ) : !report ? (
//         <EmptyState
//           icon={GraduationCap}
//           title="No grading data found"
//           description="There is no grading record for this student on this course yet."
//         />
//       ) : (
//         <>
//           <div className="space-y-4">
//             <GradingAccordion
//               title="Assignment"
//               rows={report.assignments}
//               defaultOpen
//             />
//             <GradingAccordion title="Quiz" rows={report.quizzes} />
//             <GradingAccordion title="Project" rows={report.projects} />
//             <GradingAccordion title="Exam" rows={report.exams} />
//           </div>

//           <Card>
//             <CardHeader>
//               <CardTitle>Student Performance Overview</CardTitle>
//             </CardHeader>
//             <CardContent className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
//                     <th className="px-4 py-3">Component</th>
//                     <th className="px-4 py-3">Weightage</th>
//                     <th className="px-4 py-3">Total Marks</th>
//                     <th className="px-4 py-3">Obtained Marks</th>
//                     <th className="px-4 py-3">Weighted Score %</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {report.performance.map((p) => (
//                     <tr
//                       key={p.component}
//                       className="border-b border-border/60 last:border-0"
//                     >
//                       <td className="px-4 py-3 font-medium">{p.component}</td>
//                       <td className="px-4 py-3">
//                         {p.weightagePercent.toFixed(2)}%
//                       </td>
//                       <td className="px-4 py-3">{p.totalMarks.toFixed(2)}</td>
//                       <td className="px-4 py-3">
//                         {p.obtainedMarks.toFixed(2)}
//                       </td>
//                       <td className="px-4 py-3">
//                         {p.weightedScorePercent.toFixed(2)}
//                       </td>
//                     </tr>
//                   ))}
//                   <tr className="bg-primary-soft font-semibold">
//                     <td className="px-4 py-3">Total</td>
//                     <td className="px-4 py-3">
//                       {report.totalWeightagePercent.toFixed(2)}%
//                     </td>
//                     <td className="px-4 py-3">
//                       {report.totalMarks.toFixed(2)}
//                     </td>
//                     <td className="px-4 py-3">
//                       {report.totalObtainedMarks.toFixed(2)}
//                     </td>
//                     <td className="px-4 py-3 text-primary">
//                       {report.overallWeightedScorePercent.toFixed(2)}%
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </CardContent>
//           </Card>

//           <InstructorInsightCard
//             key={insightKey}
//             studentId={studentEmail}
//             courseId={courseId}
//           />
//         </>
//       )}
//     </div>
//   );
// }