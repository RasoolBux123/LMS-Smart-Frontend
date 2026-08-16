import { ProgramDetail } from "@/features/programs/program-detail";

export default async function InstructorProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProgramDetail
      programId={id}
      backHref="/instructor/programs"
      backLabel="Back to programs"
    />
  );
}
