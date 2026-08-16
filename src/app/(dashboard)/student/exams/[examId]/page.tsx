import { CourseworkDetail } from "@/features/student/coursework-detail";

export default async function StudentExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId: id } = await params;

  return <CourseworkDetail kind="exam" id={id} />;
}
