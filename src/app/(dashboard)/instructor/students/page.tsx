"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Users, Loader2 } from "lucide-react";
import {
  listMyStudents,
  type InstructorStudent,
} from "@/lib/api/enrollments";
import { errorMessage, initials } from "@/lib/utils";
import { toast } from "sonner";

export default function InstructorStudentsPage() {
  const [rows, setRows] = useState<InstructorStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMyStudents()
      .then((res) => {
        if (!cancelled) setRows(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setRows([]);
          toast.error(errorMessage(err, "Could not load students."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-7">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold">Students</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Everyone enrolled across your courses.
        </p>
      </div>

      <div className="card-shadow overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading students…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students yet"
            description="Students will appear here once an admin enrolls them in one of your courses."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead className="text-right">Enrollments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3.5">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-xs text-white">
                          {initials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{student.name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        student.status === "active" ? "success" : "secondary"
                      }
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {student.courses.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        student.courses.map((c) => (
                          <Badge key={c.id} variant="outline">
                            {c.title}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {student.enrollmentCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}










// import {
//   Table,
//   TableHeader,
//   TableBody,
//   TableRow,
//   TableHead,
//   TableCell,
// } from "@/components/ui/table";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { EmptyState } from "@/components/shared/empty-state";
// import { Users } from "lucide-react";
// import { students } from "@/data/users";
// import { courses } from "@/data/courses";
// import { submissionsByStudent } from "@/data/submissions";
// import { initials } from "@/lib/utils";

// export default function InstructorStudentsPage() {
//   const rows = students.map((student) => {
//     const enrolled = courses.filter((c) => c.studentIds.includes(student.id));
//     const subs = submissionsByStudent(student.id);

//     const submitted = subs.filter(
//       (s) => s.status !== "pending" && s.status !== "draft",
//     ).length;

//     const graded = subs.filter((s) => s.marksAwarded !== null);

//     const average = graded.length
//       ? Math.round(
//           graded.reduce((acc, s) => acc + (s.marksAwarded ?? 0), 0) /
//             graded.length,
//         )
//       : null;

//     return { student, enrolled, submitted, average };
//   });

//   return (
//     <div className="space-y-7">
//       <div className="space-y-1.5">
//         <h1 className="font-display text-2xl font-semibold">Students</h1>
//         <p className="text-sm leading-relaxed text-muted-foreground">
//           Everyone enrolled across your courses, with their submission activity.
//         </p>
//       </div>

//       <div className="card-shadow overflow-hidden rounded-2xl border border-border bg-card">
//         {rows.length === 0 ? (
//           <EmptyState
//             icon={Users}
//             title="No students yet"
//             description="Students will appear here once they enrol in a course."
//           />
//         ) : (
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Student</TableHead>
//                 <TableHead>Roll number</TableHead>
//                 <TableHead>Courses</TableHead>
//                 <TableHead>Submissions</TableHead>
//                 <TableHead className="text-right">Average marks</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {rows.map(({ student, enrolled, submitted, average }) => (
//                 <TableRow key={student.id}>
//                   <TableCell>
//                     <div className="flex items-center gap-3.5">
//                       <Avatar className="h-9 w-9">
//                         <AvatarFallback
//                           style={{ backgroundColor: student.avatarColor }}
//                           className="text-xs text-white"
//                         >
//                           {initials(student.name)}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div className="min-w-0">
//                         <p className="truncate font-medium">{student.name}</p>
//                         <p className="mt-0.5 truncate text-xs text-muted-foreground">
//                           {student.email}
//                         </p>
//                       </div>
//                     </div>
//                   </TableCell>
//                   <TableCell className="whitespace-nowrap text-muted-foreground">
//                     {student.rollNumber}
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex flex-wrap gap-1.5">
//                       {enrolled.map((c) => (
//                         <Badge key={c.id} variant="outline">
//                           {c.code}
//                         </Badge>
//                       ))}
//                     </div>
//                   </TableCell>
//                   <TableCell className="whitespace-nowrap">
//                     {submitted} submitted
//                   </TableCell>
//                   <TableCell className="whitespace-nowrap text-right">
//                     {average === null ? "—" : `${average} pts`}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         )}
//       </div>
//     </div>
//   );
// }
