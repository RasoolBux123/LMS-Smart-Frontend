"use client";

import Link from "next/link";

import { CalendarDays, FileText, Clock } from "lucide-react";

const exams = [
  {
    id: "1",
    title: "Python Mid Term Exam",
    course: "Python Programming",
    deadline: "05 Aug 2026 11:30 PM",
    marks: 100,
    status: "Submitted",
  },

  {
    id: "2",
    title: "Database Final Exam",
    course: "Database Systems",
    deadline: "15 Aug 2026 09:00 PM",
    marks: 100,
    status: "Pending",
  },

  {
    id: "3",
    title: "Web Development Exam",
    course: "Next.js",
    deadline: "20 Aug 2026 10:00 PM",
    marks: 100,
    status: "Not Submitted",
  },
];

export default function StudentExamList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Exams</h1>

        <p className="text-sm text-muted-foreground">
          Track your exam submissions.
        </p>
      </div>

      <div className="grid gap-4">
        {exams.map((exam) => (
          <div
            key={exam.id}

            className="rounded-xl border p-5 space-y-5"
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
  exam.status === "Submitted"
    ? "bg-green-500/10 text-green-500"
    : exam.status === "Pending"
      ? "bg-yellow-500/10 text-yellow-500"
      : "bg-red-500/10 text-red-500"
}

`}
              >
                {exam.status}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="flex gap-2">
                <CalendarDays className="h-4 w-4" />

                <div>
                  <p className="text-muted-foreground">Deadline</p>

                  <p>{exam.deadline}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <FileText className="h-4 w-4" />

                <div>
                  <p className="text-muted-foreground">Marks</p>

                  <p>{exam.marks}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Clock className="h-4 w-4" />

                <div>
                  <p className="text-muted-foreground">Status</p>

                  <p>{exam.status}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href={`/student/exams/${exam.id}`}

                className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                View Exam
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
