import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProjectForm from "@/features/instructor/projects/ProjectForm";

export default function EditProjectPage() {
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
        <h1 className="text-2xl font-semibold">Edit Project</h1>

        <p className="text-sm text-muted-foreground">
          Update the details and publish the changes.
        </p>
      </div>

      <ProjectForm mode="edit" />
    </div>
  );
}
