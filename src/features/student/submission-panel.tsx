"use client";

import { useState } from "react";
import { CheckCircle2, History, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadDropzone, type StagedFile } from "./upload-dropzone";
import { SubmissionSuccessModal } from "./success-modal";
import { courseworkLabels } from "./coursework-config";
import { FileTypeIcon } from "@/components/shared/file-icon";
import { formatBytes, formatDateTime, errorMessage } from "@/lib/utils";
import { apiFetch, type ApiEnvelope } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import type { CourseworkKind, DerivedCourseworkRow, Submission } from "@/types";

/** UI kind ("quiz") -> API collection ("quizzes"). */
const KIND_TO_PATH: Record<CourseworkKind, string> = {
  assignment: "assignments",
  quiz: "quizzes",
  exam: "exams",
  project: "projects",
};

export function SubmissionPanel({
  row,
  onSubmitted,
}: {
  row: DerivedCourseworkRow;
  /** Lets the detail page refetch so the header status stays in step. */
  onSubmitted?: () => void;
}) {
  const labels = courseworkLabels[row.kind];
  const { user } = useAuth();

  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [submitted, setSubmitted] = useState(
    row.studentStatus === "submitted" || row.studentStatus === "graded",
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  /* The saved submission is mirrored locally so the panel can show the new
     receipt straight after a successful upload, before any refetch. */
  const [saved, setSaved] = useState<Submission | null>(row.submission ?? null);

  const allUploaded =
    staged.length > 0 && staged.every((f) => f.status === "done");
  const attemptsUsed = saved?.attemptNumber ?? 0;
  const canResubmit = row.resubmissionAllowed
    ? attemptsUsed < row.maxAttempts
    : attemptsUsed === 0;

  const deadlinePassed = (() => {
    if (!row.deadline) return false;
    const d = new Date(row.deadline);
    if (Number.isNaN(d.getTime())) return false;
    return Date.now() > d.getTime();
  })();

  const canSubmitNow = !deadlinePassed && (attemptsUsed === 0 || canResubmit);

  async function handleSubmit() {
    const file = staged[0]?.file;

    if (!file) {
      toast.error("Attach a file before submitting.");
      return;
    }

    if (!user) {
      toast.error("Your session has expired. Please sign in again.");
      return;
    }

    if (deadlinePassed) {
      toast.error("Deadline has passed. Submissions are no longer accepted.");
      return;
    }

    /*
     * This used to flip local state and show a success toast without
     * contacting the server at all — so a student saw "submitted
     * successfully" while nothing was ever saved. It now uploads for real
     * and only reports success once the API confirms it.
     */
    const path = KIND_TO_PATH[row.kind];
    const studentId = user.email || user.id;

    if (!studentId) {
      toast.error("Your session has expired. Please sign in again.");
      setSending(false);
      return;
    }

    const form = new FormData();
    form.append("file", file);

    setSending(true);
    try {
      const res = await apiFetch<ApiEnvelope<Submission>>(
        `/${path}/${row.id}/submissions?studentId=${encodeURIComponent(studentId)}`,
        { method: "POST", body: form },
      );

      setSaved(res.data);
      setStaged([]);
      setSubmitted(true);
      setShowSuccess(true);
      toast.success(`Your ${labels.singular} was submitted successfully.`);
      onSubmitted?.();
    } catch (err: unknown) {
      toast.error(
        errorMessage(err, `Could not submit your ${labels.singular}.`),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <SubmissionSuccessModal
        open={showSuccess}
        onOpenChange={setShowSuccess}
        title={row.title}
        backHref={labels.basePath}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Your submission</CardTitle>
          {row.resubmissionAllowed && (
            <Badge variant="outline">
              Attempt{" "}
              {Math.min(attemptsUsed + (submitted ? 0 : 1), row.maxAttempts)} of{" "}
              {row.maxAttempts}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {submitted && saved ? (
            <div className="rounded-xl border border-success/30 bg-success-soft p-5">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-medium">
                  Submitted{" "}
                  {formatDateTime(saved.submittedAt ?? row.createdAt)}
                </p>
              </div>

              <div className="mt-4 space-y-2.5">
                {(saved.files ?? []).map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg bg-card p-3"
                  >
                    <FileTypeIcon kind={f.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatBytes(f.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {saved.marksAwarded !== null && saved.marksAwarded !== undefined && (
                <p className="mt-4 text-sm">
                  Grade:{" "}
                  <span className="font-semibold">
                    {saved.marksAwarded}/{row.totalMarks}
                  </span>
                </p>
              )}

              {saved.feedback && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {saved.feedback}
                </p>
              )}

              {canResubmit && !deadlinePassed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSubmitted(false)}
                >
                  Submit a new attempt
                </Button>
              )}
              {deadlinePassed && (
                <p className="mt-4 text-sm text-danger">
                  Deadline has passed. No further submissions are accepted.
                </p>
              )}
            </div>
          ) : deadlinePassed ? (
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-5 text-center">
              <p className="text-sm font-medium text-danger">
                Deadline has passed
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                You can no longer submit this {labels.singular}.
              </p>
            </div>
          ) : (
            <>
              <UploadDropzone
                allowedExt={row.allowedFileTypes}
                maxSizeMb={row.maxFileSizeMb}
                staged={staged}
                onChange={setStaged}
              />
              <Button
                className="w-full"
                disabled={!allUploaded || sending || !canSubmitNow}
                onClick={handleSubmit}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending ? "Submitting…" : `Submit ${labels.singular}`}
              </Button>
              {!row.resubmissionAllowed && (
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  Resubmission is not allowed for this {labels.singular}.
                </p>
              )}
              {row.resubmissionAllowed && (
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  Attempts used: {attemptsUsed} / {row.maxAttempts}
                </p>
              )}
            </>
          )}

          <div className="border-t border-border pt-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Submission history
            </p>
            {saved ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  Attempt {saved.attemptNumber} ·{" "}
                  {saved.submittedAt
                    ? formatDateTime(saved.submittedAt)
                    : "Not submitted"}
                </span>
                <Badge
                  variant={
                    saved.status === "late" ? "danger" : "success"
                  }
                >
                  {saved.status}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No previous attempts.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}









// "use client";

// import { useState } from "react";
// import { CheckCircle2, History, Send, Loader2 } from "lucide-react";
// import { toast } from "sonner";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { UploadDropzone, type StagedFile } from "./upload-dropzone";
// import { SubmissionSuccessModal } from "./success-modal";
// import { courseworkLabels } from "./coursework-config";
// import { FileTypeIcon } from "@/components/shared/file-icon";
// import { formatBytes, formatDateTime, errorMessage } from "@/lib/utils";
// import { apiFetch, type ApiEnvelope } from "@/lib/api/client";
// import { useAuth } from "@/hooks/useAuth";
// import type { CourseworkKind, DerivedCourseworkRow, Submission } from "@/types";

// /** UI kind ("quiz") -> API collection ("quizzes"). */
// const KIND_TO_PATH: Record<CourseworkKind, string> = {
//   assignment: "assignments",
//   quiz: "quizzes",
//   exam: "exams",
//   project: "projects",
// };

// export function SubmissionPanel({
//   row,
//   onSubmitted,
// }: {
//   row: DerivedCourseworkRow;
//   /** Lets the detail page refetch so the header status stays in step. */
//   onSubmitted?: () => void;
// }) {
//   const labels = courseworkLabels[row.kind];
//   const { user } = useAuth();

//   const [staged, setStaged] = useState<StagedFile[]>([]);
//   const [submitted, setSubmitted] = useState(
//     row.studentStatus === "submitted" || row.studentStatus === "graded",
//   );
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [sending, setSending] = useState(false);

//   /* The saved submission is mirrored locally so the panel can show the new
//      receipt straight after a successful upload, before any refetch. */
//   const [saved, setSaved] = useState<Submission | null>(row.submission ?? null);

//   const allUploaded =
//     staged.length > 0 && staged.every((f) => f.status === "done");
//   const attemptsUsed = saved?.attemptNumber ?? 0;
//   const canResubmit = row.resubmissionAllowed
//     ? attemptsUsed < row.maxAttempts
//     : attemptsUsed === 0;

//   async function handleSubmit() {
//     const file = staged[0]?.file;

//     if (!file) {
//       toast.error("Attach a file before submitting.");
//       return;
//     }

//     if (!user) {
//       toast.error("Your session has expired. Please sign in again.");
//       return;
//     }

//     /*
//      * This used to flip local state and show a success toast without
//      * contacting the server at all — so a student saw "submitted
//      * successfully" while nothing was ever saved. It now uploads for real
//      * and only reports success once the API confirms it.
//      */
//     const path = KIND_TO_PATH[row.kind];
//     const studentId = user.email || user.id;

//     if (!studentId) {
//       toast.error("Your session has expired. Please sign in again.");
//       setSending(false);
//       return;
//     }

//     const form = new FormData();
//     form.append("file", file);

//     setSending(true);
//     try {
//       const res = await apiFetch<ApiEnvelope<Submission>>(
//         `/${path}/${row.id}/submissions?studentId=${encodeURIComponent(studentId)}`,
//         { method: "POST", body: form },
//       );

//       setSaved(res.data);
//       setStaged([]);
//       setSubmitted(true);
//       setShowSuccess(true);

//       /* The server decides whether it counts as late — trust it over the
//          clock on the student's own machine. */
//       if (res.data.status === "late") {
//         toast.warning(`Your ${labels.singular} was submitted after the deadline.`);
//       } else {
//         toast.success(`Your ${labels.singular} was submitted successfully.`);
//       }

//       onSubmitted?.();
//     } catch (err: unknown) {
//       toast.error(
//         errorMessage(err, `Could not submit your ${labels.singular}.`),
//       );
//     } finally {
//       setSending(false);
//     }
//   }

//   return (
//     <>
//       <SubmissionSuccessModal
//         open={showSuccess}
//         onOpenChange={setShowSuccess}
//         title={row.title}
//         backHref={labels.basePath}
//       />

//       <Card>
//         <CardHeader className="flex-row items-center justify-between space-y-0">
//           <CardTitle>Your submission</CardTitle>
//           {row.resubmissionAllowed && (
//             <Badge variant="outline">
//               Attempt{" "}
//               {Math.min(attemptsUsed + (submitted ? 0 : 1), row.maxAttempts)} of{" "}
//               {row.maxAttempts}
//             </Badge>
//           )}
//         </CardHeader>

//         <CardContent className="space-y-6">
//           {submitted && saved ? (
//             <div className="rounded-xl border border-success/30 bg-success-soft p-5">
//               <div className="flex items-center gap-2 text-success">
//                 <CheckCircle2 className="h-4 w-4" />
//                 <p className="text-sm font-medium">
//                   Submitted{" "}
//                   {formatDateTime(saved.submittedAt ?? row.createdAt)}
//                 </p>
//               </div>

//               <div className="mt-4 space-y-2.5">
//                 {(saved.files ?? []).map((f) => (
//                   <div
//                     key={f.id}
//                     className="flex items-center gap-3 rounded-lg bg-card p-3"
//                   >
//                     <FileTypeIcon kind={f.kind} />
//                     <div className="min-w-0 flex-1">
//                       <p className="truncate text-sm font-medium">{f.name}</p>
//                       <p className="mt-0.5 text-xs text-muted-foreground">
//                         {formatBytes(f.size)}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {saved.marksAwarded !== null && saved.marksAwarded !== undefined && (
//                 <p className="mt-4 text-sm">
//                   Grade:{" "}
//                   <span className="font-semibold">
//                     {saved.marksAwarded}/{row.totalMarks}
//                   </span>
//                 </p>
//               )}

//               {saved.feedback && (
//                 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
//                   {saved.feedback}
//                 </p>
//               )}

//               {canResubmit && (
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="mt-4"
//                   onClick={() => setSubmitted(false)}
//                 >
//                   Submit a new attempt
//                 </Button>
//               )}
//             </div>
//           ) : (
//             <>
//               <UploadDropzone
//                 allowedExt={row.allowedFileTypes}
//                 maxSizeMb={row.maxFileSizeMb}
//                 staged={staged}
//                 onChange={setStaged}
//               />
//               <Button
//                 className="w-full"
//                 disabled={!allUploaded || sending}
//                 onClick={handleSubmit}
//               >
//                 {sending ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Send className="h-4 w-4" />
//                 )}
//                 {sending ? "Submitting…" : `Submit ${labels.singular}`}
//               </Button>
//               {!row.resubmissionAllowed && (
//                 <p className="text-center text-xs leading-relaxed text-muted-foreground">
//                   Resubmission is not allowed for this {labels.singular}.
//                 </p>
//               )}
//             </>
//           )}

//           <div className="border-t border-border pt-5">
//             <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
//               <History className="h-3.5 w-3.5" /> Submission history
//             </p>
//             {saved ? (
//               <div className="flex items-center justify-between gap-3 text-sm">
//                 <span className="text-muted-foreground">
//                   Attempt {saved.attemptNumber} ·{" "}
//                   {saved.submittedAt
//                     ? formatDateTime(saved.submittedAt)
//                     : "Not submitted"}
//                 </span>
//                 <Badge
//                   variant={
//                     saved.status === "late" ? "danger" : "success"
//                   }
//                 >
//                   {saved.status}
//                 </Badge>
//               </div>
//             ) : (
//               <p className="text-sm text-muted-foreground">
//                 No previous attempts.
//               </p>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </>
//   );
// }



