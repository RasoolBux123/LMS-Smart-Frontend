"use client";

import Link from "next/link";
import { BookOpen, Users, Clock, Award, ArrowRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PROGRAM_LEVEL_LABEL, type Program } from "@/types/program";

const STATUS_VARIANT = {
  active: "success",
  draft: "warning",
  archived: "secondary",
} as const;

interface ProgramCardProps {
  program: Program;
  /** Where the card links to. Omit to render a non-interactive card. */
  href?: string;
  /** Extra controls rendered in the footer (admin edit/delete, etc.). */
  actions?: React.ReactNode;
  className?: string;
}

export function ProgramCard({
  program,
  href,
  actions,
  className,
}: ProgramCardProps) {
  const accent = program.color ?? "var(--primary)";

  const body = (
    <>
      {/* Accent strip carries the program's colour without tinting text */}
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accent }}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-[13px] font-bold tracking-wide text-white"
          style={{ backgroundColor: accent }}
        >
          {program.code}
        </div>

        <Badge variant={STATUS_VARIANT[program.status] ?? "secondary"}>
          {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
        </Badge>
      </div>

      <div className="mt-4 min-w-0">
        <h3 className="clamp-2 font-display text-base font-semibold text-foreground">
          {program.title}
        </h3>

        {/* Company / Institute */}
        {program.company && (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary">
            <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {program.company}
          </p>
        )}

        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {PROGRAM_LEVEL_LABEL[program.level]}
          {program.coordinator ? ` · ${program.coordinator}` : ""}
        </p>
      </div>

      <p className="clamp-3 mt-2.5 text-sm leading-relaxed text-muted-foreground">
        {program.description}
      </p>

      {/* Stats */}
      <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Courses</dt>
          <dd>
            <span className="font-semibold text-foreground">
              {program.courseCount ?? program.courseIds.length}
            </span>{" "}
            courses
          </dd>
        </div>

        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Students</dt>
          <dd>
            <span className="font-semibold text-foreground">
              {program.studentCount ?? 0}
            </span>{" "}
            students
          </dd>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Duration</dt>
          <dd>
            <span className="font-semibold text-foreground">
              {program.durationMonths}
            </span>{" "}
            months
          </dd>
        </div>

        <div className="flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Credits</dt>
          <dd>
            <span className="font-semibold text-foreground">
              {program.totalCredits}
            </span>{" "}
            credits
          </dd>
        </div>
      </dl>
    </>
  );

  const shell = cn(
    "relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 card-shadow transition-all",
    href && "hover:border-border-strong hover:card-shadow-lg",
    className,
  );

  if (href && !actions) {
    return (
      <Link href={href} className={cn(shell, "group")}>
        {body}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          View program
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }

  return (
    <div className={shell}>
      {href ? (
        <Link href={href} className="group flex flex-1 flex-col">
          {body}
        </Link>
      ) : (
        body
      )}
      {actions && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3.5">
          {actions}
        </div>
      )}
    </div>
  );
}




// "use client";

// import Link from "next/link";
// import { BookOpen, Users, Clock, Award, ArrowRight } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { cn } from "@/lib/utils";
// import { PROGRAM_LEVEL_LABEL, type Program } from "@/types/program";

// const STATUS_VARIANT = {
//   active: "success",
//   draft: "warning",
//   archived: "secondary",
// } as const;

// interface ProgramCardProps {
//   program: Program;
//   /** Where the card links to. Omit to render a non-interactive card. */
//   href?: string;
//   /** Extra controls rendered in the footer (admin edit/delete, etc.). */
//   actions?: React.ReactNode;
//   className?: string;
// }

// export function ProgramCard({
//   program,
//   href,
//   actions,
//   className,
// }: ProgramCardProps) {
//   const accent = program.color ?? "var(--primary)";

//   const body = (
//     <>
//       {/* Accent strip carries the program's colour without tinting text */}
//       <span
//         className="absolute inset-x-0 top-0 h-1"
//         style={{ backgroundColor: accent }}
//         aria-hidden
//       />

//       <div className="flex items-start justify-between gap-3">
//         <div
//           className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-[13px] font-bold tracking-wide text-white"
//           style={{ backgroundColor: accent }}
//         >
//           {program.code}
//         </div>

//         <Badge variant={STATUS_VARIANT[program.status] ?? "secondary"}>
//           {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
//         </Badge>
//       </div>

//       <div className="mt-4 min-w-0">
//         <h3 className="clamp-2 font-display text-base font-semibold text-foreground">
//           {program.title}
//         </h3>
//         <p className="mt-1 text-xs font-medium text-muted-foreground">
//           {PROGRAM_LEVEL_LABEL[program.level]}
//           {program.coordinator ? ` · ${program.coordinator}` : ""}
//         </p>
//       </div>

//       <p className="clamp-3 mt-2.5 text-sm leading-relaxed text-muted-foreground">
//         {program.description}
//       </p>

//       {/* Stats wrap naturally on narrow screens instead of overflowing */}
//       <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3.5 text-xs text-muted-foreground">
//         <div className="flex items-center gap-1.5">
//           <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
//           <dt className="sr-only">Courses</dt>
//           <dd>
//             <span className="font-semibold text-foreground">
//               {program.courseCount ?? program.courseIds.length}
//             </span>{" "}
//             courses
//           </dd>
//         </div>

//         <div className="flex items-center gap-1.5">
//           <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
//           <dt className="sr-only">Students</dt>
//           <dd>
//             <span className="font-semibold text-foreground">
//               {program.studentCount ?? 0}
//             </span>{" "}
//             students
//           </dd>
//         </div>

//         <div className="flex items-center gap-1.5">
//           <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
//           <dt className="sr-only">Duration</dt>
//           <dd>
//             <span className="font-semibold text-foreground">
//               {program.durationMonths}
//             </span>{" "}
//             months
//           </dd>
//         </div>

//         <div className="flex items-center gap-1.5">
//           <Award className="h-3.5 w-3.5 shrink-0" aria-hidden />
//           <dt className="sr-only">Credits</dt>
//           <dd>
//             <span className="font-semibold text-foreground">
//               {program.totalCredits}
//             </span>{" "}
//             credits
//           </dd>
//         </div>
//       </dl>
//     </>
//   );

//   const shell = cn(
//     "relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 card-shadow transition-all",
//     href && "hover:border-border-strong hover:card-shadow-lg",
//     className,
//   );

//   if (href && !actions) {
//     return (
//       <Link href={href} className={cn(shell, "group")}>
//         {body}
//         <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
//           View program
//           <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
//         </span>
//       </Link>
//     );
//   }

//   return (
//     <div className={shell}>
//       {href ? (
//         <Link href={href} className="group flex flex-1 flex-col">
//           {body}
//         </Link>
//       ) : (
//         body
//       )}
//       {actions && (
//         <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3.5">
//           {actions}
//         </div>
//       )}
//     </div>
//   );
// }
