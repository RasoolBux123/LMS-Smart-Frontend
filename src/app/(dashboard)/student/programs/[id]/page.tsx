import { ProgramDetail } from "@/features/programs/program-detail";

export default async function StudentProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProgramDetail
      programId={id}
      backHref="/student/programs"
      backLabel="Back to programs"
    />
  );
}
