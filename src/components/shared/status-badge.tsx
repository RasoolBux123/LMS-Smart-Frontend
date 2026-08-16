import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileEdit,
  Award,
  Send,
  Archive,
} from "lucide-react";
import type { SubmissionStatus, AssignmentStatusMeta } from "@/types";
import { cn } from "@/lib/utils";

const submissionMap: Record<
  SubmissionStatus,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "secondary" | "info";
    icon: React.ElementType;
  }
> = {
  submitted: { label: "Submitted", variant: "success", icon: CheckCircle2 },
  graded: { label: "Graded", variant: "info", icon: Award },
  pending: { label: "Pending", variant: "warning", icon: Clock },
  late: { label: "Late", variant: "danger", icon: AlertTriangle },
  draft: { label: "Draft", variant: "secondary", icon: FileEdit },
};

const assignmentMap: Record<
  AssignmentStatusMeta,
  {
    label: string;
    variant: "success" | "secondary" | "outline";
    icon: React.ElementType;
  }
  > = {
  published: { label: "Published", variant: "success", icon: Send },
  draft: { label: "Draft", variant: "secondary", icon: FileEdit },
  archived: { label: "Archived", variant: "outline", icon: Archive },
};

export function SubmissionStatusBadge({
  status,
  className,
}: {
  status: SubmissionStatus;
  className?: string;
}) {
  const meta = submissionMap[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={cn(className)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

export function AssignmentStatusBadge({
  status,
  className,
}: {
  status: AssignmentStatusMeta;
  className?: string;
}) {
  const meta = assignmentMap[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={cn(className)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}
// import { Badge } from "@/components/ui/badge";
// import {
//   CheckCircle2,
//   Clock,
//   AlertTriangle,
//   FileEdit,
//   Award,
//   Send,
//   Archive,
// } from "lucide-react";
// import type { SubmissionStatus, AssignmentStatusMeta } from "@/types";
// import { cn } from "@/lib/utils";

// const submissionMap: Record<
//   SubmissionStatus,
//   {
//     label: string;
//     variant: "success" | "warning" | "danger" | "secondary" | "info";
//     icon: React.ElementType;
//   }
// > = {
//   submitted: { label: "Submitted", variant: "success", icon: CheckCircle2 },
//   graded: { label: "Graded", variant: "info", icon: Award },
//   pending: { label: "Pending", variant: "warning", icon: Clock },
//   late: { label: "Late", variant: "danger", icon: AlertTriangle },
//   draft: { label: "Draft", variant: "secondary", icon: FileEdit },
// };

// const assignmentMap: Record<
//   AssignmentStatusMeta,
//   {
//     label: string;
//     variant: "success" | "secondary" | "outline";
//     icon: React.ElementType;
//   }
// > = {
//   published: { label: "Published", variant: "success", icon: Send },
//   draft: { label: "Draft", variant: "secondary", icon: FileEdit },
//   archived: { label: "Archived", variant: "outline", icon: Archive },
// };

// export function SubmissionStatusBadge({
//   status,
//   className,
// }: {
//   status: SubmissionStatus;
//   className?: string;
// }) {
//   const meta = submissionMap[status];
//   const Icon = meta.icon;
//   return (
//     <Badge variant={meta.variant} className={cn(className)}>
//       <Icon className="h-3 w-3" />
//       {meta.label}
//     </Badge>
//   );
// }

// export function AssignmentStatusBadge({
//   status,
//   className,
// }: {
//   status: AssignmentStatusMeta;
//   className?: string;
// }) {
//   const meta = assignmentMap[status];
//   const Icon = meta.icon;
//   return (
//     <Badge variant={meta.variant} className={cn(className)}>
//       <Icon className="h-3 w-3" />
//       {meta.label}
//     </Badge>
//   );
// }
