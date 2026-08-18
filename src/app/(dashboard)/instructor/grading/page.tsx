"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { listCourses, type Course } from "@/lib/api/courses";
import { listCourseEnrollments, type Enrollment } from "@/lib/api/enrollments";
import { getStudentGrading, type StudentGradingReport } from "@/lib/api/grading";
import { GradingAccordion } from "@/components/shared/grading-accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { GraduationCap, Users, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { InstructorInsightCard } from "@/components/ai/InstructorInsightCard";
import { triggerInsightGeneration, buildGradeDataFromReport } from "@/lib/api/aiInsights";

export default function InstructorGradingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [studentEmail, setStudentEmail] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [report, setReport] = useState<StudentGradingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [insightKey, setInsightKey] = useState(0); // bump to force InstructorInsightCard to refetch
  const lastGenerated = useRef<string>("");

  // Instructor courses only (backend filters by role)
  useEffect(() => {
    listCourses()
      .then((res) => {
        const list = res.data ?? [];
        setCourses(list);
        if (list.length) setCourseId(list[0].id);
      })
      .catch(() => toast.error("Could not load courses."))
      .finally(() => setLoading(false));
  }, []);

  // Students enrolled in selected course
  useEffect(() => {
    if (!courseId) {
      setEnrollments([]);
      setStudentEmail("");
      return;
    }
    setLoadingStudents(true);
    listCourseEnrollments(courseId)
      .then((res) => {
        const list = res.data ?? [];
        setEnrollments(list);
        const first = list.find((e) => e.student)?.student?.email ?? "";
        setStudentEmail(first);
        setStudentSearch("");
      })
      .catch(() => {
        setEnrollments([]);
        setStudentEmail("");
        toast.error("Could not load enrolled students.");
      })
      .finally(() => setLoadingStudents(false));
  }, [courseId]);

  // Grading report for selected student + course
  useEffect(() => {
    if (!courseId || !studentEmail) {
      setReport(null);
      return;
    }
    setLoadingReport(true);
    getStudentGrading(studentEmail, courseId)
      .then((res) => setReport(res.data))
      .catch(() => {
        setReport(null);
        toast.error("Could not load grading data.");
      })
      .finally(() => setLoadingReport(false));
  }, [courseId, studentEmail]);

  // Generate/refresh AI insight when the marks actually change
  useEffect(() => {
    if (!report || !courseId || !studentEmail) return;

    const gradeData = buildGradeDataFromReport(report, studentEmail, courseId);
    const signature = `${studentEmail}|${courseId}|${JSON.stringify(gradeData.components)}`;
    if (lastGenerated.current === signature) return;
    lastGenerated.current = signature;

    triggerInsightGeneration(gradeData)
      .then(() => setInsightKey((k) => k + 1))
      .catch((err) => {
        console.error("AI insight generation failed:", err);
      });
  }, [report, courseId, studentEmail]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    const list = enrollments.filter((e) => e.student);
    if (!q) return list;
    return list.filter((e) => {
      const s = e.student!;
      return (
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        (s as { rollNumber?: string }).rollNumber?.toLowerCase().includes(q)
      );
    });
  }, [enrollments, studentSearch]);

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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Grading
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a course and student to review their assignments, quizzes,
            projects, and exam grades.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Course dropdown */}
          <Select value={courseId} onValueChange={(v) => setCourseId(v)}>
            <SelectTrigger className="w-full sm:w-48">
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

          {/* Search students */}
          <div className="relative w-full sm:w-52">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students…"
              className="pl-9"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              disabled={!courseId || loadingStudents}
            />
          </div>

          {/* Student dropdown */}
          <Select
            value={studentEmail}
            onValueChange={(v) => setStudentEmail(v)}
            disabled={!courseId || loadingStudents}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue
                placeholder={
                  loadingStudents
                    ? "Loading students…"
                    : filteredStudents.length === 0
                      ? "No students found"
                      : "Select student"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredStudents.length === 0 ? (
                <SelectItem value="__none" disabled>
                  {studentSearch ? "No match" : "No enrolled students"}
                </SelectItem>
              ) : (
                filteredStudents.map((e) => (
                  <SelectItem key={e.id} value={e.student!.email}>
                    {e.student!.name} ({e.student!.email})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-success" /> Submitted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-warning" /> Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-danger" /> Not Submitted
        </span>
      </div>

      {loadingReport ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading grading data…
        </div>
      ) : !studentEmail ? (
        <EmptyState
          icon={Users}
          title="No student selected"
          description="Choose a course and student above to view their grading record."
        />
      ) : !report ? (
        <EmptyState
          icon={GraduationCap}
          title="No grading data found"
          description="There is no grading record for this student on this course yet."
        />
      ) : (
        <>
          <div className="space-y-4">
            <GradingAccordion
              title="Assignment"
              rows={report.assignments}
              defaultOpen
            />
            <GradingAccordion title="Quiz" rows={report.quizzes} />
            <GradingAccordion title="Project" rows={report.projects} />
            <GradingAccordion title="Exam" rows={report.exams} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Performance Overview</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Component</th>
                    <th className="px-4 py-3">Weightage</th>
                    <th className="px-4 py-3">Total Marks</th>
                    <th className="px-4 py-3">Obtained Marks</th>
                    <th className="px-4 py-3">Weighted Score %</th>
                  </tr>
                </thead>
                <tbody>
                  {report.performance.map((p) => (
                    <tr
                      key={p.component}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">{p.component}</td>
                      <td className="px-4 py-3">
                        {p.weightagePercent.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">{p.totalMarks.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {p.obtainedMarks.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {p.weightedScorePercent.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-primary-soft font-semibold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3">
                      {report.totalWeightagePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      {report.totalMarks.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {report.totalObtainedMarks.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-primary">
                      {report.overallWeightedScorePercent.toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <InstructorInsightCard
            key={insightKey}
            studentId={studentEmail}
            courseId={courseId}
          />
        </>
      )}
    </div>
  );
}