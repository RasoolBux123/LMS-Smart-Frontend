import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AssignmentForm } from "../_components/AssignmentForm";

export default function CreateAssignmentPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/instructor/assignments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to assignments
      </Link>
      <div>
        <h1 className="font-display text-2xl font-semibold">
          Create assignment
        </h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details below, then publish or save as a draft.
        </p>
      </div>
      <AssignmentForm mode="create" />
    </div>
  );
}




// import Link from "next/link";
// import { ArrowLeft } from "lucide-react";
// import { AssignmentForm } from "../_components/AssignmentForm";
// // import { AssignmentForm } from "../_components/AssignmentForm";

// export default function CreateAssignmentPage() {
//   return (
//     <div className="mx-auto max-w-3xl space-y-6">
//       <Link
//         href="/instructor/assignments"
//         className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
//       >
//         <ArrowLeft className="h-3.5 w-3.5" /> Back to assignments
//       </Link>
//       <div>
//         <h1 className="font-display text-2xl font-semibold">
//           Create assignment
//         </h1>
//         <p className="text-sm text-muted-foreground">
//           Fill in the details below, then publish or save as a draft.
//         </p>
//       </div>
//       <AssignmentForm mode="create" />
//     </div>
//   );
// }
