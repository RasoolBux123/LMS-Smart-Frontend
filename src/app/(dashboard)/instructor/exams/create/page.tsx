import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ExamForm } from "@/features/instructor/exams/ExamForm";

export default function CreateExamPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/instructor/exams"

        className="inline-flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to exams
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Create Exam</h1>

        <p className="text-sm text-muted-foreground">
          Create exam like assignment module.
        </p>
      </div>

      <ExamForm mode="create" />
    </div>
  );
}
