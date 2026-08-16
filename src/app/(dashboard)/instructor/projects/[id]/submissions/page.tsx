"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, FileX2 } from "lucide-react";
import ProjectForm from "@/features/instructor/projects/ProjectForm";
import { EmptyState } from "@/components/shared/empty-state";
import { projectsApi, type Coursework } from "@/lib/api/coursework";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  /*
   * The form was rendered as `<ProjectForm mode="edit" />` — no id, no values.
   * So it opened blank, and on save the missing id sent it down the create
   * path, producing a duplicate instead of an edit.
   */
  const [item, setItem] = useState<Coursework | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    projectsApi
      .get(id)
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch(() => {
        if (!cancelled) setItem(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/instructor/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      {loading ? (
        <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading project…
        </div>
      ) : !item ? (
        <EmptyState
          icon={FileX2}
          title="Project not found"
          description="This project may have already been deleted."
        />
      ) : (
        <>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Edit Project
            </h1>

            <p className="text-sm text-muted-foreground">
              Update the details and publish the changes.
            </p>
          </div>

          <ProjectForm mode="edit" projectId={id} defaultValues={item} />
        </>
      )}
    </div>
  );
}








// "use client";

// import { FileText, Download, CheckCircle } from "lucide-react";

// type SubmissionRow = {
//   id: string;
//   student: string;
//   file: string;
//   date: string;
//   status: string;
// };

// const submissions: SubmissionRow[] = [];

// export default function ProjectSubmissions() {
//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-semibold">Project Submissions</h1>

//         <p className="text-sm text-muted-foreground">
//           Review student project files and grade submissions.
//         </p>
//       </div>

//       <div className="grid gap-4">
//         {submissions.length === 0 && (
//           <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
//             No submissions yet.
//           </p>
//         )}
//         {submissions.map((item) => (
//           <div
//             key={item.id}

//             className="rounded-xl border p-5 space-y-4"
//           >
//             <div className="flex justify-between items-start">
//               <div>
//                 <h2 className="font-semibold">{item.student}</h2>

//                 <p className="text-sm text-muted-foreground">{item.date}</p>
//               </div>

//               <span
//                 className={`
// rounded-full
// px-3
// py-1
// text-xs

// ${
//   item.status === "Submitted"
//     ? "bg-green-500/10 text-green-500"
//     : "bg-yellow-500/10 text-yellow-500"
// }

// `}
//               >
//                 {item.status}
//               </span>
//             </div>

//             <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
//               <div className="flex items-center gap-3">
//                 <FileText className="h-5 w-5" />

//                 <div>
//                   <p className="font-medium">{item.file}</p>

//                   <p className="text-xs text-muted-foreground">
//                     Project Solution File
//                   </p>
//                 </div>
//               </div>

//               {item.file !== "-" && (
//                 <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
//                   <Download className="h-4 w-4" />
//                   View
//                 </button>
//               )}
//             </div>

//             <div className="flex gap-2">
//               <button className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
//                 Grade
//               </button>

//               <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
//                 <CheckCircle className="h-4 w-4" />
//                 Mark Reviewed
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
