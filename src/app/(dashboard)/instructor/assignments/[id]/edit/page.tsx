"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, FileX2 } from "lucide-react";
import { AssignmentForm } from "../../_components/AssignmentForm";
import { EmptyState } from "@/components/shared/empty-state";
import { getAssignment } from "@/lib/api/assignments";
import type { Assignment } from "@/types/assignment";

export default function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  /*
   * This was a server component that awaited getAssignment(id). The token
   * lives in localStorage, so apiFetch sends no Authorization header when it
   * runs on the server — the request 401'd, the catch swallowed it, and the
   * page always rendered notFound(). Fetching on the client fixes it.
   */
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getAssignment(id)
      .then((data) => {
        if (!cancelled) setAssignment(data);
      })
      .catch(() => {
        if (!cancelled) setAssignment(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/instructor/assignments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to assignments
      </Link>

      {loading ? (
        <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading assignment…
        </div>
      ) : !assignment ? (
        <EmptyState
          icon={FileX2}
          title="Assignment not found"
          description="This assignment may have already been deleted."
        />
      ) : (
        <>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Edit assignment
            </h1>
            <p className="text-sm text-muted-foreground">
              Update the details for &ldquo;{assignment.title}&rdquo;.
            </p>
          </div>

          <AssignmentForm
            mode="edit"
            assignmentId={id}
            defaultValues={assignment}
          />
        </>
      )}
    </div>
  );
}





// import Link from "next/link";
// import { notFound } from "next/navigation";
// import { ArrowLeft } from "lucide-react";
// import { AssignmentForm } from "../../_components/AssignmentForm";
// import { getAssignment } from "@/lib/api/assignments";

// export default async function EditAssignmentPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const { id } = await params;

//   const assignment = await getAssignment(id).catch(() => null);
//   if (!assignment) notFound();

//   return (
//     <div className="mx-auto max-w-3xl space-y-6">
//       <Link
//         href="/instructor/assignments"
//         className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
//       >
//         <ArrowLeft className="h-3.5 w-3.5" /> Back to assignments
//       </Link>
//       <div>
//         <h1 className="font-display text-2xl font-semibold">Edit assignment</h1>
//         <p className="text-sm text-muted-foreground">
//           Update the details for &ldquo;{assignment.title}&rdquo;.
//         </p>
//       </div>
//       <AssignmentForm
//         mode="edit"
//         assignmentId={id}
//         defaultValues={assignment}
//       />
//     </div>
//   );
// }

