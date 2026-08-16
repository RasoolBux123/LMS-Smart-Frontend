import { CourseworkDetail } from "@/features/student/coursework-detail";

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId: id } = await params;

  return <CourseworkDetail kind="assignment" id={id} />;
}


// import { CourseworkDetail } from "@/features/student/coursework-detail";

// export default async function StudentAssignmentDetailPage({
//   params,
// }: {
//   params: Promise<{ assignmentId: string }>;
// }) {
//   const { assignmentId: id } = await params;

//   return <CourseworkDetail kind="assignment" id={id} />;
// }
