import { CourseworkDetail } from "@/features/student/coursework-detail";

export default async function StudentProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId: id } = await params;

  return <CourseworkDetail kind="project" id={id} />;
}
