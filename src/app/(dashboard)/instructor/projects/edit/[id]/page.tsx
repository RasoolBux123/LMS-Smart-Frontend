"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import ProjectForm from "@/features/instructor/projects/ProjectForm";
import { projectsApi } from "@/lib/api/coursework";
import type { CourseworkListItem } from "@/lib/api/coursework";
import { toast } from "sonner";

export default function EditProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<CourseworkListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    projectsApi
      .get(projectId)
      .then((res) => {
        setProject(res);
      })
      .catch(() => {
        toast.error("Could not load project details.");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading project…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Project not found.
      </div>
    );
  }

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

      <ProjectForm
        mode="edit"
        projectId={projectId}
        defaultValues={project}
      />
    </div>
  );
}














// import Link from "next/link";
// import { ArrowLeft } from "lucide-react";
// import ProjectForm from "@/features/instructor/projects/ProjectForm";

// export default function EditProjectPage() {
//   return (
//     <div className="mx-auto max-w-4xl space-y-6">
//       <Link
//         href="/instructor/projects"
//         className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
//       >
//         <ArrowLeft className="h-4 w-4" />
//         Back to projects
//       </Link>

//       <div>
//         <h1 className="text-2xl font-semibold">Edit Project</h1>

//         <p className="text-sm text-muted-foreground">
//           Update the details and publish the changes.
//         </p>
//       </div>

//       <ProjectForm mode="edit" />
//     </div>
//   );
// }
