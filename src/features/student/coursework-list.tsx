"use client";

import { Loader2, AlertCircle } from "lucide-react";
import { StudentCourseworkTable } from "@/features/student/coursework-table";
import { courseworkLabels } from "@/features/student/coursework-config";
import { useStudentCoursework } from "@/hooks/useStudentCoursework";
import type { CourseworkKind } from "@/types";

export function CourseworkList({ kind }: { kind: CourseworkKind }) {
  const labels = courseworkLabels[kind];

  /*
   * Rows now come from the API. This component used to call
   * `courseworkForStudent(currentStudent.id, kind)`, which read the empty
   * `@/data/*` seed arrays — so the page was always blank no matter what
   * an instructor published.
   */
  const { rows, loading, error } = useStudentCoursework(kind);

  return (
    <div className="space-y-7">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {labels.plural}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {labels.subtitle}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-card py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading {labels.plural.toLowerCase()}…
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3.5"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm leading-relaxed text-on-danger-soft">{error}</p>
        </div>
      ) : (
        <StudentCourseworkTable rows={rows} kind={kind} />
      )}
    </div>
  );
}





// import { StudentCourseworkTable } from "@/features/student/coursework-table";
// import { courseworkLabels } from "@/features/student/coursework-config";
// import { currentStudent } from "@/data/users";
// import { courseworkForStudent } from "@/lib/selectors";
// import type { CourseworkKind } from "@/types";

// export function CourseworkList({ kind }: { kind: CourseworkKind }) {
//   const labels = courseworkLabels[kind];
//   const rows = courseworkForStudent(currentStudent.id, kind);

//   return (
//     <div className="space-y-7">
//       <div className="space-y-1.5">
//         <h1 className="font-display text-2xl font-semibold">{labels.plural}</h1>
//         <p className="text-sm leading-relaxed text-muted-foreground">
//           {labels.subtitle}
//         </p>
//       </div>

//       <StudentCourseworkTable rows={rows} kind={kind} />
//     </div>
//   );
// }


// // import { StudentCourseworkTable } from "@/features/student/coursework-table";
// // import { courseworkLabels } from "@/features/student/coursework-config";
// // import { currentStudent } from "@/data/users";
// // import { courseworkForStudent } from "@/lib/selectors";
// // import type { CourseworkKind } from "@/types";

// // export function CourseworkList({ kind }: { kind: CourseworkKind }) {
// //   const labels = courseworkLabels[kind];
// //   const rows = courseworkForStudent(currentStudent.id, kind);

// //   return (
// //     <div className="space-y-7">
// //       <div className="space-y-1.5">
// //         <h1 className="font-display text-2xl font-semibold">{labels.plural}</h1>
// //         <p className="text-sm leading-relaxed text-muted-foreground">
// //           {labels.subtitle}
// //         </p>
// //       </div>

// //       <StudentCourseworkTable rows={rows} kind={kind} />
// //     </div>
// //   );
// // }
