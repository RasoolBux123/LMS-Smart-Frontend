import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuizForm from "@/features/instructor/quizzes/QuizForm";

export default function EditQuizPage() {
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
        <h1 className="text-2xl font-semibold">Edit Quiz</h1>

        <p className="text-sm text-muted-foreground">
          Update the details and publish the changes.
        </p>
      </div>

      <QuizForm mode="edit" />
    </div>
  );
}
