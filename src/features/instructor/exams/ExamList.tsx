"use client";

import Link from "next/link";

import { Eye, Edit, Trash2, Plus } from "lucide-react";

const exams = [
  {
    id: "1",

    title: "Python Mid Term Exam",

    course: "Python Programming",

    deadline: "05 Aug 2026 11:30 PM",

    marks: 100,

    status: "Published",
  },

  {
    id: "2",

    title: "Database Final Exam",

    course: "Database Systems",

    deadline: "15 Aug 2026 09:00 PM",

    marks: 100,

    status: "Draft",
  },
];

export default function ExamList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Exams</h1>

          <p className="text-sm text-muted-foreground">
            Manage your exams like assignments.
          </p>
        </div>

        <Link
          href="/instructor/exams/create"

          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Create Exam
        </Link>
      </div>

      <div className="grid gap-4">
        {exams.map((exam) => (
          <div
            key={exam.id}

            className="rounded-xl border border-border p-5 space-y-4"
          >
            <div className="flex justify-between">
              <div>
                <h2 className="font-semibold text-lg">{exam.title}</h2>

                <p className="text-sm text-muted-foreground">{exam.course}</p>
              </div>

              <span
                className={`

rounded-full

px-3

py-1

text-xs

${
  exam.status === "Published"
    ? "bg-green-500/10 text-green-500"
    : "bg-yellow-500/10 text-yellow-500"
}

`}
              >
                {exam.status}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Deadline</p>

                <p>{exam.deadline}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Total Marks</p>

                <p>{exam.marks}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Submission</p>

                <p>File Upload</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <Eye className="h-4 w-4" />
                View
              </button>

              <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <Edit className="h-4 w-4" />
                Edit
              </button>

              <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-red-500">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
