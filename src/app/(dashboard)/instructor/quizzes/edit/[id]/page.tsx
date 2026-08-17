"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import QuizForm from "@/features/instructor/quizzes/QuizForm";
import { quizzesApi } from "@/lib/api/coursework";
import type { CourseworkListItem } from "@/lib/api/coursework";
import { toast } from "sonner";

export default function EditQuizPage() {
  const params = useParams();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<CourseworkListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;

    quizzesApi
      .get(quizId) // ← yahan getById ki jagah get
      .then((res) => {
        setQuiz(res);
      })
      .catch(() => {
        toast.error("Could not load quiz details.");
      })
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading quiz…
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Quiz not found.
      </div>
    );
  }

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

      <QuizForm
        mode="edit"
        quizId={quizId}
        defaultValues={quiz}
      />
    </div>
  );
}

// import Link from "next/link";
// import { ArrowLeft } from "lucide-react";
// import QuizForm from "@/features/instructor/quizzes/QuizForm";

// export default function EditQuizPage() {
//   return (
//     <div className="mx-auto max-w-4xl space-y-6">
//       <Link
//         href="/instructor/quizzes"
//         className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
//       >
//         <ArrowLeft className="h-4 w-4" />
//         Back to quizzes
//       </Link>

//       <div>
//         <h1 className="text-2xl font-semibold">Edit Quiz</h1>

//         <p className="text-sm text-muted-foreground">
//           Update the details and publish the changes.
//         </p>
//       </div>

//       <QuizForm mode="edit" />
//     </div>
//   );
// }
