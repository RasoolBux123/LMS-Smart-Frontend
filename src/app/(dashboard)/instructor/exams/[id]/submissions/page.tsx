"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, Download, CheckCircle } from "lucide-react";

type SubmissionRow = {
  id: string;
  name: string;
  file: string;
  date: string;
  status: string;
};

const submissions: SubmissionRow[] = [];

export default function ExamSubmissions() {
  const params = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Exam Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Check student exam answers and grading.
        </p>
      </div>

      <div className="grid gap-4">
        {submissions.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No submissions yet.
          </p>
        )}
        {submissions.map((item) => (
          <div key={item.id} className="rounded-xl border p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                <p className="text-sm text-muted-foreground">{item.date}</p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  item.status === "Submitted"
                    ? "bg-green-500/10 text-green-500"
                    : "bg-yellow-500/10 text-yellow-500"
                }`}
              >
                {item.status}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />

                <div>
                  <p className="font-medium">{item.file}</p>
                  <p className="text-xs text-muted-foreground">Answer File</p>
                </div>
              </div>

              {item.file !== "-" && (
                <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <Download className="h-4 w-4" />
                  View
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href={`/instructor/exams/${params.id}/submissions/${item.id}`}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                Grade
              </Link>

              <button className="rounded-lg border px-4 py-2 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Mark Reviewed
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
