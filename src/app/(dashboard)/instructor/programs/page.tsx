import { ProgramCatalog } from "@/features/programs/program-catalog";

export const metadata = { title: "Programs · SmartLMS" };

export default function InstructorProgramsPage() {
  return (
    <ProgramCatalog
      basePath="/instructor/programs"
      title="Programs"
      description="Every program running at the institute, including the courses each one contains."
    />
  );
}
