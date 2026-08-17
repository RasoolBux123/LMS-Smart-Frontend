"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ExamForm } from "@/features/instructor/exams/ExamForm";
import { examsApi } from "@/lib/api/coursework";
import type { CourseworkListItem } from "@/lib/api/coursework";
import { toast } from "sonner";

export default function EditExamPage() {
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<CourseworkListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;

    examsApi
      .get(examId)
      .then((res) => {
        setExam(res);
      })
      .catch(() => {
        toast.error("Could not load exam details.");
      })
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading exam…
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Exam not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/instructor/exams"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to exams
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Edit Exam</h1>
        <p className="text-sm text-muted-foreground">
          Update the details and publish the changes.
        </p>
      </div>

      <ExamForm
        mode="edit"
        examId={examId}
        defaultValues={exam}
      />
    </div>
  );
}
