import { CourseworkDetail } from "@/features/student/coursework-detail";

export default async function StudentQuizDetailPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId: id } = await params;

  return <CourseworkDetail kind="quiz" id={id} />;
}
