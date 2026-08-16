import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong py-16 px-6 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}


// import type { LucideIcon } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface EmptyStateProps {
//   icon: LucideIcon;
//   title: string;
//   description?: string;
//   action?: React.ReactNode;
//   className?: string;
// }

// export function EmptyState({
//   icon: Icon,
//   title,
//   description,
//   action,
//   className,
// }: EmptyStateProps) {
//   return (
//     <div
//       className={cn(
//         "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong py-16 px-6 text-center",
//         className,
//       )}
//     >
//       <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
//         <Icon className="h-6 w-6 text-primary" />
//       </div>
//       <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
//       {description && (
//         <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
//           {description}
//         </p>
//       )}
//       {action && <div className="mt-5">{action}</div>}
//     </div>
//   );
// }
