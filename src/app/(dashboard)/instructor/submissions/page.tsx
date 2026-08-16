"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Inbox, Loader2, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  SubmissionsTable,
  type SubmissionRow,
} from "@/features/instructor/submissions-table";
import { useAuth } from "@/hooks/useAuth";
import {
  assignmentsApi,
  quizzesApi,
  examsApi,
  projectsApi,
  type CourseworkKind,
  type CourseworkListItem,
} from "@/lib/api/coursework";
import { listCourses, type Course } from "@/lib/api/courses";
import { listCourseEnrollments } from "@/lib/api/enrollments";
import { gradeSubmission } from "@/lib/api/assignments";
import type { Submission, SubmissionStatus, User } from "@/types";
import { errorMessage } from "@/lib/utils";

type CourseworkItem = CourseworkListItem & {
  kind: CourseworkKind;
};

const ALL = "all";

function asArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const d = (raw as { data?: unknown }).data;
    if (Array.isArray(d)) return d as T[];
  }
  return [];
}

const KIND_LABEL: Record<CourseworkKind, string> = {
  assignments: "Assignment",
  quizzes: "Quiz",
  exams: "Exam",
  projects: "Project",
};

const KIND_OPTIONS: { value: string; label: string }[] = [
  { value: ALL, label: "All types" },
  { value: "assignments", label: "Assignment" },
  { value: "quizzes", label: "Quiz" },
  { value: "exams", label: "Exam" },
  { value: "projects", label: "Project" },
];

const KIND_API = {
  assignments: assignmentsApi,
  quizzes: quizzesApi,
  exams: examsApi,
  projects: projectsApi,
} as const;

function SubmissionsPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [items, setItems] = useState<CourseworkItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(
    () => searchParams.get("course") ?? ALL,
  );
  const [selectedKind, setSelectedKind] = useState<string>(
    () => searchParams.get("type") ?? ALL,
  );
  const [selectedId, setSelectedId] = useState(
    () => searchParams.get("item") ?? ALL,
  );
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const cid = i.courseId || i.course?.id;
      if (selectedCourseId !== ALL && cid !== selectedCourseId) return false;
      if (selectedKind !== ALL && i.kind !== selectedKind) return false;
      return true;
    });
  }, [items, selectedCourseId, selectedKind]);

  const selectedItem =
    selectedId !== ALL
      ? (filteredItems.find((i) => i.id === selectedId) ?? null)
      : null;

  const isMultiView = selectedId === ALL;

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    setListError(null);

    Promise.all([
      listCourses().catch(() => ({ data: [] as Course[] })),
      assignmentsApi.list({}).catch(() => []),
      quizzesApi.list({}).catch(() => []),
      examsApi.list({}).catch(() => []),
      projectsApi.list({}).catch(() => []),
    ])
      .then(([coursesRes, assignments, quizzes, exams, projects]) => {
        if (cancelled) return;

        const courseList = asArray<Course>(coursesRes);
        setCourses(courseList);

        const combined: CourseworkItem[] = [
          ...asArray<CourseworkListItem>(assignments).map((a) => ({
            ...a,
            kind: "assignments" as const,
          })),
          ...asArray<CourseworkListItem>(quizzes).map((q) => ({
            ...q,
            kind: "quizzes" as const,
          })),
          ...asArray<CourseworkListItem>(exams).map((e) => ({
            ...e,
            kind: "exams" as const,
          })),
          ...asArray<CourseworkListItem>(projects).map((p) => ({
            ...p,
            kind: "projects" as const,
          })),
        ];

        combined.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );

        setItems(combined);

        const urlCourse = searchParams.get("course");
        const urlType = searchParams.get("type");
        const urlItem =
          searchParams.get("item") ?? searchParams.get("assignment");

        if (urlCourse && urlCourse !== ALL) {
          if (courseList.some((c) => c.id === urlCourse)) {
            setSelectedCourseId(urlCourse);
          } else {
            setSelectedCourseId(ALL);
          }
        }

        if (
          urlType &&
          ["assignments", "quizzes", "exams", "projects"].includes(urlType)
        ) {
          setSelectedKind(urlType);
        }

        if (urlItem && urlItem !== ALL) {
          const found = combined.find((i) => i.id === urlItem);
          if (found) {
            setSelectedId(found.id);
            const cid = found.courseId || found.course?.id;
            if (cid) setSelectedCourseId(cid);
            setSelectedKind(found.kind);
          } else {
            setSelectedId(ALL);
          }
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setItems([]);
        setCourses([]);
        setListError(errorMessage(err, "Could not load data."));
        toast.error(errorMessage(err, "Could not load data."));
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (selectedId === ALL) return;
    const stillValid = filteredItems.some((i) => i.id === selectedId);
    if (!stillValid) setSelectedId(ALL);
  }, [filteredItems, selectedId]);

  function buildRowFromSubmission(
    item: CourseworkItem,
    raw: {
      id: string;
      assignmentId?: string;
      studentId: string;
      status?: string;
      submittedAt?: string | null;
      files?: {
        id?: string;
        name?: string;
        url?: string;
        kind?: string;
        size?: number;
      }[];
      attemptNumber?: number;
      marksAwarded?: number | null;
      score?: number | null;
      feedback?: string | null;
      passFail?: "pass" | "fail" | null;
      marksHidden?: boolean;
    },
    student: { id: string; name: string; email: string; rollNumber?: string },
  ): SubmissionRow {
    const marks =
      raw.marksAwarded != null
        ? raw.marksAwarded
        : raw.score != null
          ? raw.score
          : null;

    let status: SubmissionStatus = "submitted";
    if (marks != null || raw.status === "graded") status = "graded";
    else if (raw.status === "late") status = "late";

    const submission: Submission = {
      id: raw.id,
      assignmentId: raw.assignmentId || item.id,
      studentId: raw.studentId,
      status,
      submittedAt: raw.submittedAt ?? null,
      files: (raw.files || []).map((f, i) => ({
        id: f.id || String(i),
        name: f.name || "file",
        kind:
          (f.kind as "pdf" | "docx" | "image" | "zip" | "other") || "other",
        size: f.size || 0,
        url: f.url || "",
      })),
      attemptNumber: raw.attemptNumber ?? 1,
      marksAwarded: marks,
      feedback: raw.feedback ?? null,
      passFail: raw.passFail ?? null,
      marksHidden: !!raw.marksHidden,
    };

    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: "student",
        avatarColor: "#0D9488",
        rollNumber: student.rollNumber,
      },
      submission,
      status,
      itemId: item.id,
      itemTitle: item.title,
      itemKind: KIND_LABEL[item.kind],
      courseTitle: item.course?.title || item.course?.code || "—",
      rowTotalMarks: item.totalMarks ?? 100,
    };
  }

  const loadSingleItemRows = useCallback(async (item: CourseworkItem) => {
    setLoadingRows(true);
    try {
      const api = KIND_API[item.kind];
      const [subsRes, enrollRes] = await Promise.all([
        api.listSubmissions(item.id).catch(() => ({ data: [] })),
        item.courseId
          ? listCourseEnrollments(item.courseId).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);

      const subsList = asArray<{
        id: string;
        assignmentId?: string;
        studentId: string;
        status?: string;
        submittedAt?: string | null;
        files?: {
          id?: string;
          name?: string;
          url?: string;
          kind?: string;
          size?: number;
        }[];
        attemptNumber?: number;
        marksAwarded?: number | null;
        score?: number | null;
        feedback?: string | null;
        passFail?: "pass" | "fail" | null;
      }>(subsRes);

      const enrollList = asArray<{
        userId?: string;
        student?: {
          id: string;
          name: string;
          email: string;
          rollNumber?: string;
        } | null;
      }>(enrollRes);

      const byStudent = new Map<string, (typeof subsList)[0]>();
      for (const s of subsList) {
        if (!s?.studentId) continue;
        const existing = byStudent.get(s.studentId);
        if (
          !existing ||
          (s.attemptNumber ?? 1) > (existing.attemptNumber ?? 1)
        ) {
          byStudent.set(s.studentId, s);
        }
      }

      const studentMap = new Map<
        string,
        { id: string; name: string; email: string; rollNumber?: string }
      >();

      for (const e of enrollList) {
        if (e.student?.id) {
          studentMap.set(e.student.id, {
            id: e.student.id,
            name: e.student.name || e.student.email || e.student.id,
            email: e.student.email || "",
            rollNumber: e.student.rollNumber,
          });
        } else if (e.userId) {
          studentMap.set(e.userId, {
            id: e.userId,
            name: e.userId,
            email: "",
          });
        }
      }

      for (const [sid] of byStudent) {
        if (!studentMap.has(sid)) {
          studentMap.set(sid, { id: sid, name: sid, email: "" });
        }
      }

      const built: SubmissionRow[] = [];
      for (const [, st] of studentMap) {
        const raw = byStudent.get(st.id);
        if (!raw) {
          built.push({
            student: {
              id: st.id,
              name: st.name,
              email: st.email,
              role: "student",
              avatarColor: "#0D9488",
              rollNumber: st.rollNumber,
            },
            submission: null,
            status: "pending",
            itemId: item.id,
            itemTitle: item.title,
            itemKind: KIND_LABEL[item.kind],
            courseTitle: item.course?.title || item.course?.code || "—",
            rowTotalMarks: item.totalMarks ?? 100,
          });
          continue;
        }
        built.push(buildRowFromSubmission(item, raw, st));
      }

      built.sort((x, y) => x.student.name.localeCompare(y.student.name));
      setRows(built);
    } catch (err: unknown) {
      setRows([]);
      toast.error(errorMessage(err, "Could not load submissions."));
    } finally {
      setLoadingRows(false);
    }
  }, []);

  const loadMultiRows = useCallback(async (targetItems: CourseworkItem[]) => {
    setLoadingRows(true);
    try {
      if (targetItems.length === 0) {
        setRows([]);
        return;
      }

      const results = await Promise.all(
        targetItems.map(async (item) => {
          const api = KIND_API[item.kind];
          const subsRes = await api
            .listSubmissions(item.id)
            .catch(() => ({ data: [] }));
          const subsList = asArray<{
            id: string;
            assignmentId?: string;
            studentId: string;
            status?: string;
            submittedAt?: string | null;
            files?: {
              id?: string;
              name?: string;
              url?: string;
              kind?: string;
              size?: number;
            }[];
            attemptNumber?: number;
            marksAwarded?: number | null;
            score?: number | null;
            feedback?: string | null;
            passFail?: "pass" | "fail" | null;
          }>(subsRes);

          const byStudent = new Map<string, (typeof subsList)[0]>();
          for (const s of subsList) {
            if (!s?.studentId) continue;
            const existing = byStudent.get(s.studentId);
            if (
              !existing ||
              (s.attemptNumber ?? 1) > (existing.attemptNumber ?? 1)
            ) {
              byStudent.set(s.studentId, s);
            }
          }

          return { item, subs: Array.from(byStudent.values()) };
        }),
      );

      const courseIds = [
        ...new Set(
          targetItems
            .map((i) => i.courseId || i.course?.id)
            .filter(Boolean) as string[],
        ),
      ];

      const studentMap = new Map<
        string,
        { id: string; name: string; email: string; rollNumber?: string }
      >();

      await Promise.all(
        courseIds.map(async (cid) => {
          const enrollRes = await listCourseEnrollments(cid).catch(() => ({
            data: [],
          }));
          const enrollList = asArray<{
            userId?: string;
            student?: {
              id: string;
              name: string;
              email: string;
              rollNumber?: string;
            } | null;
          }>(enrollRes);
          for (const e of enrollList) {
            if (e.student?.id) {
              studentMap.set(e.student.id, {
                id: e.student.id,
                name: e.student.name || e.student.email || e.student.id,
                email: e.student.email || "",
                rollNumber: e.student.rollNumber,
              });
            } else if (e.userId && !studentMap.has(e.userId)) {
              studentMap.set(e.userId, {
                id: e.userId,
                name: e.userId,
                email: "",
              });
            }
          }
        }),
      );

      const built: SubmissionRow[] = [];
      for (const { item, subs } of results) {
        for (const raw of subs) {
          const st = studentMap.get(raw.studentId) ?? {
            id: raw.studentId,
            name: raw.studentId,
            email: "",
          };
          built.push(buildRowFromSubmission(item, raw, st));
        }
      }

      built.sort((a, b) => {
        const da = a.submission?.submittedAt
          ? new Date(a.submission.submittedAt).getTime()
          : 0;
        const db = b.submission?.submittedAt
          ? new Date(b.submission.submittedAt).getTime()
          : 0;
        return db - da;
      });

      setRows(built);
    } catch (err: unknown) {
      setRows([]);
      toast.error(errorMessage(err, "Could not load submissions."));
    } finally {
      setLoadingRows(false);
    }
  }, []);

  useEffect(() => {
    if (loadingList) return;

    if (selectedItem) {
      loadSingleItemRows(selectedItem);
    } else {
      loadMultiRows(filteredItems);
    }
  }, [
    loadingList,
    selectedItem,
    filteredItems,
    loadSingleItemRows,
    loadMultiRows,
  ]);

  function updateUrl(courseId: string, kind: string, itemId: string) {
    const params = new URLSearchParams();
    if (courseId && courseId !== ALL) params.set("course", courseId);
    if (kind && kind !== ALL) params.set("type", kind);
    if (itemId && itemId !== ALL) params.set("item", itemId);
    const qs = params.toString();
    router.replace(
      qs ? `/instructor/submissions?${qs}` : "/instructor/submissions",
      { scroll: false },
    );
  }

  function handleCourseChange(courseId: string) {
    setSelectedCourseId(courseId);
    setSelectedId(ALL);
    updateUrl(courseId, selectedKind, ALL);
  }

  function handleKindChange(kind: string) {
    setSelectedKind(kind);
    setSelectedId(ALL);
    updateUrl(selectedCourseId, kind, ALL);
  }

  function handleItemChange(id: string) {
    setSelectedId(id);
    updateUrl(selectedCourseId, selectedKind, id);
  }

  async function handleGradeSave(
    studentId: string,
    marks: number,
    feedback: string,
    passFail: "pass" | "fail",
    submissionId?: string,
    hideMarks = false,
  ) {
    const row = submissionId
      ? rows.find((r) => r.submission?.id === submissionId)
      : rows.find((r) => r.student.id === studentId && r.submission);

    if (!row?.submission?.id) {
      toast.error("No submission to grade.");
      throw new Error("No submission");
    }
    await gradeSubmission(row.submission.id, marks, feedback, passFail, hideMarks);
    setRows((prev) =>
      prev.map((r) =>
        r.submission?.id === row.submission!.id
          ? {
            ...r,
            submission: {
              ...r.submission!,
              marksAwarded: marks,
              feedback,
              passFail,
              status: "graded",
              marksHidden: hideMarks,
            },
            status: "graded",
          }
          : r,
      ),
    );
  }

  const hiddenCount = rows.filter(
    (r) => !!r.submission?.marksHidden,
  ).length;

  async function handleReleaseAllMarks() {
    setReleasing(true);
    try {
      let totalUpdated = 0;

      if (selectedItem) {
        const api = KIND_API[selectedItem.kind];
        const res = await api.releaseMarks(selectedItem.id);
        totalUpdated = res.data?.updated ?? 0;
      } else {
        // Multi / All view: release every unique item that has hidden marks
        const kindById = new Map<string, CourseworkKind>();
        for (const r of rows) {
          if (r.submission?.marksHidden && r.itemId && r.itemKind) {
            // itemKind is label like "Assignment" — map back
            const kind =
              (Object.entries(KIND_LABEL).find(
                ([, label]) => label === r.itemKind,
              )?.[0] as CourseworkKind | undefined) || "assignments";
            kindById.set(r.itemId, kind);
          }
        }
        // Prefer matching from items list when possible
        for (const item of items) {
          if (kindById.has(item.id)) {
            kindById.set(item.id, item.kind);
          }
        }
        for (const [itemId, kind] of kindById) {
          try {
            const res = await KIND_API[kind].releaseMarks(itemId);
            totalUpdated += res.data?.updated ?? 0;
          } catch {
            // continue other items
          }
        }
      }

      setRows((prev) =>
        prev.map((r) =>
          r.submission?.marksHidden
            ? {
              ...r,
              submission: { ...r.submission!, marksHidden: false },
            }
            : r,
        ),
      );
      toast.success(
        totalUpdated > 0
          ? `Released marks for ${totalUpdated} student(s).`
          : "No hidden marks found to release.",
      );
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not release marks."));
    } finally {
      setReleasing(false);
    }
  }

  if (loadingList) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (listError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Submissions</h1>
          <p className="text-sm text-muted-foreground">
            Review, grade, and give feedback on student work.
          </p>
        </div>
        <EmptyState
          icon={Inbox}
          title="Could not load data"
          description={listError}
        />
      </div>
    );
  }

  const headerTitle = selectedItem
    ? selectedItem.title
    : selectedCourseId !== ALL
      ? courses.find((c) => c.id === selectedCourseId)?.title || "Course"
      : "All submissions";

  const headerSub = selectedItem
    ? `${selectedItem.course?.title || selectedItem.course?.code || "—"} · ${selectedItem.totalMarks ?? 100} points`
    : selectedKind !== ALL
      ? KIND_LABEL[selectedKind as CourseworkKind]
      : "Across all your courses and coursework";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Submissions</h1>
          <p className="text-sm text-muted-foreground">
            Review, grade, and give feedback on student work.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {/* 1. Course — only courses assigned to this instructor */}
          <Select value={selectedCourseId} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 2. Type */}
          <Select value={selectedKind} onValueChange={handleKindChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {KIND_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 3. Specific item */}
          <Select
            value={selectedId}
            onValueChange={handleItemChange}
            disabled={filteredItems.length === 0}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue
                placeholder={
                  filteredItems.length === 0
                    ? "No items"
                    : "Select specific item"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All items</SelectItem>
              {filteredItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      [{KIND_LABEL[item.kind]}]
                    </span>
                    {item.title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* Bulk release bar — always visible when any marks are hidden */}
      {hiddenCount > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">
            {hiddenCount} student{hiddenCount === 1 ? "" : "s"} have hidden
            marks. Students currently see &quot;Not graded yet&quot;.
          </p>
          <Button
            type="button"
            size="sm"
            disabled={releasing}
            onClick={handleReleaseAllMarks}
            className="shrink-0"
          >
            {releasing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {releasing ? "Releasing…" : `Release all marks (${hiddenCount})`}
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{headerTitle}</CardTitle>
              {selectedItem && (
                <Badge variant="secondary" className="text-xs">
                  {KIND_LABEL[selectedItem.kind]}
                </Badge>
              )}
              {isMultiView && (
                <Badge variant="outline" className="text-xs">
                  {rows.length} submission{rows.length === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{headerSub}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedItem && (
              <Badge variant="outline">
                {selectedItem.submittedCount ??
                  rows.filter((r) => r.submission).length}
                /{selectedItem.enrolled ?? rows.length} submitted
              </Badge>
            )}
            {selectedItem && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={releasing}
                onClick={handleReleaseAllMarks}
                title="Unhide marks for all students on this item"
              >
                {releasing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {releasing
                  ? "Releasing…"
                  : hiddenCount > 0
                    ? `Release all marks (${hiddenCount})`
                    : "Release all marks"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingRows ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading submissions…
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No submissions yet"
              description={
                isMultiView
                  ? "No student submissions match the current filters."
                  : "When enrolled students submit work for this item, they will appear here."
              }
            />
          ) : (
            <SubmissionsTable
              key={`${selectedCourseId}-${selectedKind}-${selectedId}`}
              rows={rows}
              totalMarks={selectedItem?.totalMarks ?? 100}
              onGradeSave={handleGradeSave}
              showItemColumn={isMultiView}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InstructorSubmissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SubmissionsPageInner />
    </Suspense>
  );
}





// "use client";

// import { Suspense, useCallback, useEffect, useState } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { Inbox, Loader2 } from "lucide-react";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { EmptyState } from "@/components/shared/empty-state";
// import {
//   SubmissionsTable,
//   type SubmissionRow,
// } from "@/features/instructor/submissions-table";
// import { useAuth } from "@/hooks/useAuth";
// import {
//   assignmentsApi,
//   quizzesApi,
//   examsApi,
//   projectsApi,
//   type CourseworkKind,
//   type CourseworkListItem,
// } from "@/lib/api/coursework";
// import { listCourseEnrollments } from "@/lib/api/enrollments";
// import { gradeSubmission } from "@/lib/api/assignments";
// import type { Submission, SubmissionStatus, User } from "@/types";
// import { errorMessage } from "@/lib/utils";

// type CourseworkItem = CourseworkListItem & {
//   kind: CourseworkKind;
// };

// function asArray<T>(raw: unknown): T[] {
//   if (Array.isArray(raw)) return raw as T[];
//   if (raw && typeof raw === "object") {
//     const d = (raw as { data?: unknown }).data;
//     if (Array.isArray(d)) return d as T[];
//   }
//   return [];
// }

// const KIND_LABEL: Record<CourseworkKind, string> = {
//   assignments: "Assignment",
//   quizzes: "Quiz",
//   exams: "Exam",
//   projects: "Project",
// };

// const KIND_API = {
//   assignments: assignmentsApi,
//   quizzes: quizzesApi,
//   exams: examsApi,
//   projects: projectsApi,
// } as const;

// function SubmissionsPageInner() {
//   const { user } = useAuth();
//   const searchParams = useSearchParams();
//   const router = useRouter();

//   const [items, setItems] = useState<CourseworkItem[]>([]);
//   const [selectedId, setSelectedId] = useState(
//     () => searchParams.get("item") ?? searchParams.get("assignment") ?? "",
//   );
//   const [rows, setRows] = useState<SubmissionRow[]>([]);
//   const [loadingList, setLoadingList] = useState(true);
//   const [loadingRows, setLoadingRows] = useState(false);
//   const [listError, setListError] = useState<string | null>(null);

//   // Load ALL coursework kinds in parallel
//   useEffect(() => {
//     let cancelled = false;
//     setLoadingList(true);
//     setListError(null);

//     Promise.all([
//       assignmentsApi.list({}).catch(() => []),
//       quizzesApi.list({}).catch(() => []),
//       examsApi.list({}).catch(() => []),
//       projectsApi.list({}).catch(() => []),
//     ])
//       .then(([assignments, quizzes, exams, projects]) => {
//         if (cancelled) return;

//         const combined: CourseworkItem[] = [
//           ...asArray<CourseworkListItem>(assignments).map((a) => ({
//             ...a,
//             kind: "assignments" as const,
//           })),
//           ...asArray<CourseworkListItem>(quizzes).map((q) => ({
//             ...q,
//             kind: "quizzes" as const,
//           })),
//           ...asArray<CourseworkListItem>(exams).map((e) => ({
//             ...e,
//             kind: "exams" as const,
//           })),
//           ...asArray<CourseworkListItem>(projects).map((p) => ({
//             ...p,
//             kind: "projects" as const,
//           })),
//         ];

//         // Newest first
//         combined.sort(
//           (a, b) =>
//             new Date(b.createdAt || 0).getTime() -
//             new Date(a.createdAt || 0).getTime(),
//         );

//         setItems(combined);

//         setSelectedId((prev) => {
//           if (prev && combined.some((i) => i.id === prev)) return prev;
//           return combined[0]?.id ?? "";
//         });
//       })
//       .catch((err: unknown) => {
//         if (cancelled) return;
//         setItems([]);
//         setListError(errorMessage(err, "Could not load coursework."));
//         toast.error(errorMessage(err, "Could not load coursework."));
//       })
//       .finally(() => {
//         if (!cancelled) setLoadingList(false);
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [user?.id]);

//   const selected =
//     items.find((i) => i.id === selectedId) ?? items[0] ?? null;

//   const loadRows = useCallback(async (item: CourseworkItem) => {
//     setLoadingRows(true);
//     try {
//       const api = KIND_API[item.kind];

//       const [subsRes, enrollRes] = await Promise.all([
//         api.listSubmissions(item.id).catch(() => ({ data: [] })),
//         item.courseId
//           ? listCourseEnrollments(item.courseId).catch(() => ({ data: [] }))
//           : Promise.resolve({ data: [] }),
//       ]);

//       const subsList = asArray<{
//         id: string;
//         assignmentId?: string;
//         studentId: string;
//         status?: string;
//         submittedAt?: string | null;
//         files?: {
//           id?: string;
//           name?: string;
//           url?: string;
//           kind?: string;
//           size?: number;
//         }[];
//         attemptNumber?: number;
//         marksAwarded?: number | null;
//         score?: number | null;
//         feedback?: string | null;
//         passFail?: "pass" | "fail" | null;
//       }>(subsRes);

//       const enrollList = asArray<{
//         userId?: string;
//         student?: {
//           id: string;
//           name: string;
//           email: string;
//           rollNumber?: string;
//         } | null;
//       }>(enrollRes);

//       const byStudent = new Map<string, (typeof subsList)[0]>();
//       for (const s of subsList) {
//         if (!s?.studentId) continue;
//         const existing = byStudent.get(s.studentId);
//         if (
//           !existing ||
//           (s.attemptNumber ?? 1) > (existing.attemptNumber ?? 1)
//         ) {
//           byStudent.set(s.studentId, s);
//         }
//       }

//       const studentMap = new Map<
//         string,
//         { id: string; name: string; email: string; rollNumber?: string }
//       >();

//       for (const e of enrollList) {
//         if (e.student?.id) {
//           studentMap.set(e.student.id, {
//             id: e.student.id,
//             name: e.student.name || e.student.email || e.student.id,
//             email: e.student.email || "",
//             rollNumber: e.student.rollNumber,
//           });
//         } else if (e.userId) {
//           studentMap.set(e.userId, {
//             id: e.userId,
//             name: e.userId,
//             email: "",
//           });
//         }
//       }

//       for (const [sid] of byStudent) {
//         if (!studentMap.has(sid)) {
//           studentMap.set(sid, { id: sid, name: sid, email: "" });
//         }
//       }

//       const built: SubmissionRow[] = [];
//       for (const [, st] of studentMap) {
//         const raw = byStudent.get(st.id);
//         const student: User = {
//           id: st.id,
//           name: st.name,
//           email: st.email,
//           role: "student",
//           avatarColor: "#0D9488",
//           rollNumber: st.rollNumber,
//         };

//         if (!raw) {
//           built.push({ student, submission: null, status: "pending" });
//           continue;
//         }

//         const marks =
//           raw.marksAwarded != null
//             ? raw.marksAwarded
//             : raw.score != null
//               ? raw.score
//               : null;

//         let status: SubmissionStatus = "submitted";
//         if (marks != null || raw.status === "graded") status = "graded";
//         else if (raw.status === "late") status = "late";

//         const submission: Submission = {
//           id: raw.id,
//           assignmentId: raw.assignmentId || item.id,
//           studentId: raw.studentId,
//           status,
//           submittedAt: raw.submittedAt ?? null,
//           files: (raw.files || []).map((f, i) => ({
//             id: f.id || String(i),
//             name: f.name || "file",
//             kind:
//               (f.kind as "pdf" | "docx" | "image" | "zip" | "other") || "other",
//             size: f.size || 0,
//             url: f.url || "",
//           })),
//           attemptNumber: raw.attemptNumber ?? 1,
//           marksAwarded: marks,
//           feedback: raw.feedback ?? null,
//           passFail: raw.passFail ?? null,
//         };

//         built.push({ student, submission, status });
//       }

//       built.sort((x, y) => x.student.name.localeCompare(y.student.name));
//       setRows(built);
//     } catch (err: unknown) {
//       setRows([]);
//       toast.error(errorMessage(err, "Could not load submissions."));
//     } finally {
//       setLoadingRows(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (!selected) {
//       setRows([]);
//       return;
//     }
//     loadRows(selected);
//   }, [selected, loadRows]);

//   function handleChange(id: string) {
//     setSelectedId(id);
//     router.replace(`/instructor/submissions?item=${id}`, { scroll: false });
//   }

//   async function handleGradeSave(
//     studentId: string,
//     marks: number,
//     feedback: string,
//     passFail: "pass" | "fail",
//   ) {
//     const row = rows.find((r) => r.student.id === studentId);
//     if (!row?.submission?.id) {
//       toast.error("No submission to grade.");
//       throw new Error("No submission");
//     }
//     await gradeSubmission(row.submission.id, marks, feedback, passFail);
//     setRows((prev) =>
//       prev.map((r) =>
//         r.student.id === studentId && r.submission
//           ? {
//               ...r,
//               submission: {
//                 ...r.submission,
//                 marksAwarded: marks,
//                 feedback,
//                 passFail,
//                 status: "graded",
//               },
//               status: "graded",
//             }
//           : r,
//       ),
//     );
//   }

//   if (loadingList) {
//     return (
//       <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
//         <Loader2 className="h-5 w-5 animate-spin" />
//         Loading coursework…
//       </div>
//     );
//   }

//   if (listError || items.length === 0) {
//     return (
//       <div className="space-y-6">
//         <div>
//           <h1 className="font-display text-2xl font-semibold">Submissions</h1>
//           <p className="text-sm text-muted-foreground">
//             Review, grade, and give feedback on student work.
//           </p>
//         </div>
//         <EmptyState
//           icon={Inbox}
//           title={listError ? "Could not load coursework" : "No coursework yet"}
//           description={
//             listError ||
//             "Create and publish an assignment, quiz, exam or project first. Student submissions will show up here."
//           }
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="font-display text-2xl font-semibold">Submissions</h1>
//           <p className="text-sm text-muted-foreground">
//             Review, grade, and give feedback on student work.
//           </p>
//         </div>

//         <Select
//           value={selected?.id ?? selectedId}
//           onValueChange={handleChange}
//         >
//           <SelectTrigger className="w-full sm:w-96">
//             <SelectValue placeholder="Choose assignment / quiz / exam / project" />
//           </SelectTrigger>
//           <SelectContent>
//             {items.map((item) => (
//               <SelectItem key={item.id} value={item.id}>
//                 <span className="flex items-center gap-2">
//                   <span className="text-xs text-muted-foreground">
//                     [{KIND_LABEL[item.kind]}]
//                   </span>
//                   {item.title}
//                 </span>
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       {selected && (
//         <Card>
//           <CardHeader className="flex-row items-center justify-between space-y-0">
//             <div>
//               <div className="flex items-center gap-2">
//                 <CardTitle>{selected.title}</CardTitle>
//                 <Badge variant="secondary" className="text-xs">
//                   {KIND_LABEL[selected.kind]}
//                 </Badge>
//               </div>
//               <p className="mt-0.5 text-sm text-muted-foreground">
//                 {selected.course?.title || selected.course?.code || "—"} ·{" "}
//                 {selected.totalMarks ?? 100} points
//               </p>
//             </div>
//             <Badge variant="outline">
//               {selected.submittedCount ??
//                 rows.filter((r) => r.submission).length}
//               /{selected.enrolled ?? rows.length} submitted
//             </Badge>
//           </CardHeader>
//           <CardContent>
//             {loadingRows ? (
//               <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 Loading submissions…
//               </div>
//             ) : rows.length === 0 ? (
//               <EmptyState
//                 icon={Inbox}
//                 title="No submissions yet"
//                 description="When enrolled students submit work for this item, they will appear here."
//               />
//             ) : (
//               <SubmissionsTable
//                 key={selected.id}
//                 rows={rows}
//                 totalMarks={selected.totalMarks ?? 100}
//                 onGradeSave={handleGradeSave}
//               />
//             )}
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

// export default function InstructorSubmissionsPage() {
//   return (
//     <Suspense
//       fallback={
//         <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
//           Loading…
//         </div>
//       }
//     >
//       <SubmissionsPageInner />
//     </Suspense>
//   );
// }

