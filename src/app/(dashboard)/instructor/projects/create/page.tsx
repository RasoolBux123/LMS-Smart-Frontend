import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProjectForm from "@/features/instructor/projects/ProjectForm";

export default function CreateProjectPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/instructor/projects"

        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Create Project</h1>

        <p className="text-sm text-muted-foreground">
          Create, upload and publish course projects.
        </p>
      </div>

      <ProjectForm mode="create" />
    </div>
  );
}
