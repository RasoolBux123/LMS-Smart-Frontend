"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, FileX2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SubmissionStatusBadge } from "@/components/shared/status-badge";
import { DeadlineRing } from "@/components/shared/deadline-ring";
import { EmptyState } from "@/components/shared/empty-state";
import { courseworkLabels } from "./coursework-config";
import { formatDate } from "@/lib/utils";
import type { CourseworkKind, DerivedCourseworkRow } from "@/types";

export function StudentCourseworkTable({
  rows,
  kind,
}: {
  rows: DerivedCourseworkRow[];
  kind: CourseworkKind;
}) {
  const labels = courseworkLabels[kind];

  const [search, setSearch] = useState("");
  const [course, setCourse] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const courses = useMemo(
    () => Array.from(new Set(rows.map((r) => r.courseCode))),
    [rows],
  );

  const filtered = useMemo(() => {
    let out = rows.filter((r) =>
      r.title.toLowerCase().includes(search.toLowerCase()),
    );
    if (course !== "all") out = out.filter((r) => r.courseCode === course);
    if (status !== "all") out = out.filter((r) => r.studentStatus === status);
    out = [...out].sort((a, b) => {
      const diff =
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
    return out;
  }, [rows, search, course, status, sortDir]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${labels.plural.toLowerCase()}…`}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={course} onValueChange={setCourse}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="shrink-0"
        >
          <ArrowUpDown className="h-3.5 w-3.5" /> Due date
        </Button>
      </div>

      <div className="card-shadow overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileX2}
            title={`No ${labels.plural.toLowerCase()} found`}
            description="Try adjusting your search or filters."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.plural.replace(/e?s$/, "")}</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-[240px]">
                    <p className="truncate font-medium">{row.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {formatDate(row.createdAt)}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {row.courseCode}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {row.instructorName}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(row.deadline)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.totalMarks} pts
                  </TableCell>
                  <TableCell>
                    <SubmissionStatusBadge status={row.studentStatus} />
                  </TableCell>
                  <TableCell>
                    <DeadlineRing
                      createdAt={row.createdAt}
                      deadline={row.deadline}
                      size={30}
                      strokeWidth={3}
                      submitted={
                        row.studentStatus === "submitted" ||
                        row.studentStatus === "graded"
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`${labels.basePath}/${row.id}`}>View</Link>
                    </Button>
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


// "use client";

// import { useMemo, useState } from "react";
// import Link from "next/link";
// import { Search, ArrowUpDown, FileX2 } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import {
//   Table,
//   TableHeader,
//   TableBody,
//   TableRow,
//   TableHead,
//   TableCell,
// } from "@/components/ui/table";
// import { SubmissionStatusBadge } from "@/components/shared/status-badge";
// import { DeadlineRing } from "@/components/shared/deadline-ring";
// import { EmptyState } from "@/components/shared/empty-state";
// import { courseworkLabels } from "./coursework-config";
// import { formatDate } from "@/lib/utils";
// import type { CourseworkKind, DerivedCourseworkRow } from "@/types";

// export function StudentCourseworkTable({
//   rows,
//   kind,
// }: {
//   rows: DerivedCourseworkRow[];
//   kind: CourseworkKind;
// }) {
//   const labels = courseworkLabels[kind];

//   const [search, setSearch] = useState("");
//   const [course, setCourse] = useState<string>("all");
//   const [status, setStatus] = useState<string>("all");
//   const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

//   const courses = useMemo(
//     () => Array.from(new Set(rows.map((r) => r.courseCode))),
//     [rows],
//   );

//   const filtered = useMemo(() => {
//     let out = rows.filter((r) =>
//       r.title.toLowerCase().includes(search.toLowerCase()),
//     );
//     if (course !== "all") out = out.filter((r) => r.courseCode === course);
//     if (status !== "all") out = out.filter((r) => r.studentStatus === status);
//     out = [...out].sort((a, b) => {
//       const diff =
//         new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
//       return sortDir === "asc" ? diff : -diff;
//     });
//     return out;
//   }, [rows, search, course, status, sortDir]);

//   return (
//     <div className="space-y-5">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
//         <div className="relative flex-1">
//           <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//           <Input
//             placeholder={`Search ${labels.plural.toLowerCase()}…`}
//             className="pl-10"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         <Select value={course} onValueChange={setCourse}>
//           <SelectTrigger className="w-full sm:w-44">
//             <SelectValue placeholder="Course" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All courses</SelectItem>
//             {courses.map((c) => (
//               <SelectItem key={c} value={c}>
//                 {c}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>

//         <Select value={status} onValueChange={setStatus}>
//           <SelectTrigger className="w-full sm:w-40">
//             <SelectValue placeholder="Status" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All statuses</SelectItem>
//             <SelectItem value="submitted">Submitted</SelectItem>
//             <SelectItem value="graded">Graded</SelectItem>
//             <SelectItem value="pending">Pending</SelectItem>
//             <SelectItem value="late">Late</SelectItem>
//             <SelectItem value="draft">Draft</SelectItem>
//           </SelectContent>
//         </Select>

//         <Button
//           variant="outline"
//           onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
//           className="shrink-0"
//         >
//           <ArrowUpDown className="h-3.5 w-3.5" /> Due date
//         </Button>
//       </div>

//       <div className="card-shadow overflow-hidden rounded-2xl border border-border bg-card">
//         {filtered.length === 0 ? (
//           <EmptyState
//             icon={FileX2}
//             title={`No ${labels.plural.toLowerCase()} found`}
//             description="Try adjusting your search or filters."
//           />
//         ) : (
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>{labels.plural.replace(/e?s$/, "")}</TableHead>
//                 <TableHead>Course</TableHead>
//                 <TableHead>Instructor</TableHead>
//                 <TableHead>Due date</TableHead>
//                 <TableHead>Marks</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Remaining</TableHead>
//                 <TableHead className="text-right">Action</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filtered.map((row) => (
//                 <TableRow key={row.id}>
//                   <TableCell className="max-w-[240px]">
//                     <p className="truncate font-medium">{row.title}</p>
//                     <p className="mt-1 text-xs text-muted-foreground">
//                       Created {formatDate(row.createdAt)}
//                     </p>
//                   </TableCell>
//                   <TableCell className="whitespace-nowrap text-muted-foreground">
//                     {row.courseCode}
//                   </TableCell>
//                   <TableCell className="whitespace-nowrap text-muted-foreground">
//                     {row.instructorName}
//                   </TableCell>
//                   <TableCell className="whitespace-nowrap">
//                     {formatDate(row.deadline)}
//                   </TableCell>
//                   <TableCell className="whitespace-nowrap">
//                     {row.totalMarks} pts
//                   </TableCell>
//                   <TableCell>
//                     <SubmissionStatusBadge status={row.studentStatus} />
//                   </TableCell>
//                   <TableCell>
//                     <DeadlineRing
//                       createdAt={row.createdAt}
//                       deadline={row.deadline}
//                       size={30}
//                       strokeWidth={3}
//                       submitted={
//                         row.studentStatus === "submitted" ||
//                         row.studentStatus === "graded"
//                       }
//                     />
//                   </TableCell>
//                   <TableCell className="text-right">
//                     <Button size="sm" variant="outline" asChild>
//                       <Link href={`${labels.basePath}/${row.id}`}>View</Link>
//                     </Button>
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
