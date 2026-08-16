"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Users,
  Clock,
  Award,
  UserCircle,
  Building2,
  Loader2,
  Layers,
} from "lucide-react";
import { getProgram, listProgramCourses } from "@/lib/api/programs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PROGRAM_LEVEL_LABEL, type Program } from "@/types/program";

const STATUS_VARIANT = {
  active: "success",
  draft: "warning",
  archived: "secondary",
} as const;

interface ProgramDetailProps {
  programId: string;
  /** Path back to the role's program list. */
  backHref: string;
  backLabel: string;
  /**
   * Optional base path for course cards.
   * When provided, each course becomes a clickable link to `${courseBasePath}/${course.id}`.
   */
  courseBasePath?: string;
}

export function ProgramDetail({
  programId,
  backHref,
  backLabel,
  courseBasePath,
}: ProgramDetailProps) {
  const [program, setProgram] = useState<Program | null>(null);
  const [courses, setCourses] = useState<
    { id: string; title: string; status: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getProgram(programId)
      .then((res) => {
        if (cancelled) return;
        setProgram(res.data);
        return listProgramCourses(programId);
      })
      .then((res) => {
        if (!cancelled && res) setCourses(res.data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [programId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading program…
      </div>
    );
  }

  if (notFound || !program) {
    return (
      <div className="space-y-6">
        <BackLink href={backHref} label={backLabel} />
        <EmptyState
          icon={Layers}
          title="Program not found"
          description="This program may have been removed or is not available to your account."
        />
      </div>
    );
  }

  const accent = program.color ?? "var(--primary)";

  const stats = [
    {
      icon: BookOpen,
      label: "Courses",
      value: program.courseCount ?? program.courseIds.length,
    },
    { icon: Users, label: "Students", value: program.studentCount ?? 0 },
    { icon: Clock, label: "Months", value: program.durationMonths },
    { icon: Award, label: "Credits", value: program.totalCredits },
  ];

  return (
    <div className="space-y-6">
      <BackLink href={backHref} label={backLabel} />

      {/* Header */}
      <Card className="overflow-hidden">
        <span
          className="block h-1.5 w-full"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <CardContent className="p-5 pt-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-sm font-bold tracking-wide text-white"
              style={{ backgroundColor: accent }}
            >
              {program.code}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl font-semibold text-foreground">
                  {program.title}
                </h1>
                <Badge variant={STATUS_VARIANT[program.status] ?? "secondary"}>
                  {program.status.charAt(0).toUpperCase() +
                    program.status.slice(1)}
                </Badge>
                <Badge variant="outline">
                  {PROGRAM_LEVEL_LABEL[program.level]}
                </Badge>
              </div>

              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {program.description}
              </p>

              {/* Company */}
              {program.company && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" aria-hidden />
                  Company:{" "}
                  <span className="font-medium text-foreground">
                    {program.company}
                  </span>
                </p>
              )}

              {/* Coordinator */}
              {program.coordinator && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UserCircle className="h-4 w-4 shrink-0" aria-hidden />
                  Coordinated by{" "}
                  <span className="font-medium text-foreground">
                    {program.coordinator}
                  </span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 pt-4">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                <p className="mt-2 font-display text-xl font-semibold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Courses in this program */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          Courses in this program
        </h2>

        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses linked yet"
            description="Courses assigned to this program will be listed here."
          />
        ) : (
          <div className="auto-grid">
            {courses.map((course) => {
              const content = (
                <CardContent className="p-4 pt-4">
                  <p className="clamp-2 font-medium text-foreground">
                    {course.title}
                  </p>
                  <Badge
                    variant={
                      course.status === "active" ? "success" : "secondary"
                    }
                    className="mt-2"
                  >
                    {course.status.charAt(0).toUpperCase() +
                      course.status.slice(1)}
                  </Badge>
                </CardContent>
              );

              if (courseBasePath) {
                return (
                  <Link
                    key={course.id}
                    href={`${courseBasePath}/${course.id}`}
                    className="group block transition-opacity hover:opacity-90"
                  >
                    <Card className="h-full transition-colors group-hover:border-border-strong">
                      {content}
                    </Card>
                  </Link>
                );
              }

              return <Card key={course.id}>{content}</Card>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Link>
  );
}






// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import {
//   ArrowLeft,
//   BookOpen,
//   Users,
//   Clock,
//   Award,
//   UserCircle,
//   Loader2,
//   Layers,
// } from "lucide-react";
// import { getProgram, listProgramCourses } from "@/lib/api/programs";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { EmptyState } from "@/components/shared/empty-state";
// import { PROGRAM_LEVEL_LABEL, type Program } from "@/types/program";

// const STATUS_VARIANT = {
//   active: "success",
//   draft: "warning",
//   archived: "secondary",
// } as const;

// interface ProgramDetailProps {
//   programId: string;
//   /** Path back to the role's program list. */
//   backHref: string;
//   backLabel: string;
// }

// export function ProgramDetail({
//   programId,
//   backHref,
//   backLabel,
// }: ProgramDetailProps) {
//   const [program, setProgram] = useState<Program | null>(null);
//   const [courses, setCourses] = useState<
//     { id: string; title: string; status: string }[]
//   >([]);
//   const [loading, setLoading] = useState(true);
//   const [notFound, setNotFound] = useState(false);

//   useEffect(() => {
//     let cancelled = false;

//     getProgram(programId)
//       .then((res) => {
//         if (cancelled) return;
//         setProgram(res.data);
//         return listProgramCourses(programId);
//       })
//       .then((res) => {
//         if (!cancelled && res) setCourses(res.data);
//       })
//       .catch(() => {
//         if (!cancelled) setNotFound(true);
//       })
//       .finally(() => {
//         if (!cancelled) setLoading(false);
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [programId]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center gap-2.5 py-20 text-sm text-muted-foreground">
//         <Loader2 className="h-4 w-4 animate-spin" />
//         Loading program…
//       </div>
//     );
//   }

//   if (notFound || !program) {
//     return (
//       <div className="space-y-6">
//         <BackLink href={backHref} label={backLabel} />
//         <EmptyState
//           icon={Layers}
//           title="Program not found"
//           description="This program may have been removed or is not available to your account."
//         />
//       </div>
//     );
//   }

//   const accent = program.color ?? "var(--primary)";

//   const stats = [
//     {
//       icon: BookOpen,
//       label: "Courses",
//       value: program.courseCount ?? program.courseIds.length,
//     },
//     { icon: Users, label: "Students", value: program.studentCount ?? 0 },
//     { icon: Clock, label: "Months", value: program.durationMonths },
//     { icon: Award, label: "Credits", value: program.totalCredits },
//   ];

//   return (
//     <div className="space-y-6">
//       <BackLink href={backHref} label={backLabel} />

//       {/* Header */}
//       <Card className="overflow-hidden">
//         <span
//           className="block h-1.5 w-full"
//           style={{ backgroundColor: accent }}
//           aria-hidden
//         />
//         <CardContent className="p-5 pt-5 sm:p-6">
//           <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
//             <div
//               className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-sm font-bold tracking-wide text-white"
//               style={{ backgroundColor: accent }}
//             >
//               {program.code}
//             </div>

//             <div className="min-w-0 flex-1">
//               <div className="flex flex-wrap items-center gap-2.5">
//                 <h1 className="font-display text-2xl font-semibold text-foreground">
//                   {program.title}
//                 </h1>
//                 <Badge variant={STATUS_VARIANT[program.status] ?? "secondary"}>
//                   {program.status.charAt(0).toUpperCase() +
//                     program.status.slice(1)}
//                 </Badge>
//                 <Badge variant="outline">
//                   {PROGRAM_LEVEL_LABEL[program.level]}
//                 </Badge>
//               </div>

//               <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
//                 {program.description}
//               </p>

//               {program.coordinator && (
//                 <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
//                   <UserCircle className="h-4 w-4 shrink-0" aria-hidden />
//                   Coordinated by{" "}
//                   <span className="font-medium text-foreground">
//                     {program.coordinator}
//                   </span>
//                 </p>
//               )}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Stats — 2 across on phones, 4 from `sm` */}
//       <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
//         {stats.map((stat) => {
//           const Icon = stat.icon;
//           return (
//             <Card key={stat.label}>
//               <CardContent className="p-4 pt-4">
//                 <Icon
//                   className="h-4 w-4 text-muted-foreground"
//                   aria-hidden
//                 />
//                 <p className="mt-2 font-display text-xl font-semibold text-foreground">
//                   {stat.value}
//                 </p>
//                 <p className="text-xs text-muted-foreground">{stat.label}</p>
//               </CardContent>
//             </Card>
//           );
//         })}
//       </div>

//       {/* Courses in this program */}
//       <section>
//         <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
//           Courses in this program
//         </h2>

//         {courses.length === 0 ? (
//           <EmptyState
//             icon={BookOpen}
//             title="No courses linked yet"
//             description="Courses assigned to this program will be listed here."
//           />
//         ) : (
//           <div className="auto-grid">
//             {courses.map((course) => (
//               <Card key={course.id}>
//                 <CardContent className="p-4 pt-4">
//                   <p className="clamp-2 font-medium text-foreground">
//                     {course.title}
//                   </p>
//                   <Badge variant="secondary" className="mt-2">
//                     {course.status}
//                   </Badge>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }

// function BackLink({ href, label }: { href: string; label: string }) {
//   return (
//     <Link
//       href={href}
//       className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
//     >
//       <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
//       {label}
//     </Link>
//   );
// }
