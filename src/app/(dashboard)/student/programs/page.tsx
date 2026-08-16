import { ProgramCatalog } from "@/features/programs/program-catalog";

export const metadata = { title: "Programs · SmartLMS" };

export default function StudentProgramsPage() {
  return (
    <ProgramCatalog
      basePath="/student/programs"
      title="Programs"
      description="Browse every program offered by the institute and see what each one covers."
    />
  );
}
