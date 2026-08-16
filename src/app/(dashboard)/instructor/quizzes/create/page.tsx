import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import QuizForm from "@/features/instructor/quizzes/QuizForm";

export default function CreateQuizPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/instructor/quizzes"

        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quizzes
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Create Quiz</h1>

        <p className="text-sm text-muted-foreground">
          Create quiz questions and publish for students.
        </p>
      </div>

      <QuizForm mode="create" />
    </div>
  );
}
