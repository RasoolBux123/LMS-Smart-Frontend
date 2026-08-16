"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Award, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";
import type { User } from "@/types";

const rubricItems = [
  "Meets all stated objectives",
  "Code / work is well organized",
  "Follows submission instructions",
  "Demonstrates original analysis",
];

export function GradingModal({
  open,
  onOpenChange,
  student,
  totalMarks,
  initialMarks,
  initialFeedback,
  initialHideMarks = false,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: User;
  totalMarks: number;
  initialMarks: number | null;
  initialFeedback: string | null;
  /** When true, student sees "Not graded yet" instead of marks */
  initialHideMarks?: boolean;
  onSave: (
    marks: number,
    feedback: string,
    passFail: "pass" | "fail",
    hideMarks: boolean,
  ) => void | Promise<void>;
}) {
  const [marks, setMarks] = useState(initialMarks?.toString() ?? "");
  const [feedback, setFeedback] = useState(initialFeedback ?? "");
  const [hideMarks, setHideMarks] = useState(initialHideMarks);
  const [rubric, setRubric] = useState<boolean[]>(rubricItems.map(() => false));
  const [saving, setSaving] = useState(false);

  const numericMarks = Number(marks) || 0;
  const passFail: "pass" | "fail" =
    numericMarks >= totalMarks * 0.5 ? "pass" : "fail";

  async function handleSave() {
    if (!marks) {
      toast.error("Enter a marks value before saving.");
      return;
    }
    setSaving(true);
    try {
      await onSave(numericMarks, feedback, passFail, hideMarks);
      toast.success(
        hideMarks
          ? `Grade saved for ${student.name}. Marks are hidden from the student.`
          : `Grade saved for ${student.name}.`,
      );
      onOpenChange(false);
    } catch {
      // parent already shows error toast
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback
                style={{
                  backgroundColor: `${student.avatarColor}1A`,
                  color: student.avatarColor,
                }}
              >
                {initials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{student.name}</DialogTitle>
              <DialogDescription>{student.rollNumber}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="marks">Marks (out of {totalMarks})</Label>
              <Input
                id="marks"
                type="number"
                max={totalMarks}
                min={0}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Result</Label>
              <div
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium",
                  passFail === "pass"
                    ? "bg-success-soft text-success"
                    : "bg-danger-soft text-danger",
                )}
              >
                {passFail === "pass" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {passFail === "pass" ? "Pass" : "Fail"}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Rubric checklist</Label>
            <div className="space-y-2 rounded-xl border border-border p-3">
              {rubricItems.map((item, i) => (
                <label key={item} className="flex items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={rubric[i]}
                    onCheckedChange={(c) =>
                      setRubric((prev) =>
                        prev.map((v, idx) => (idx === i ? !!c : v)),
                      )
                    }
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              rows={4}
              placeholder="Share specific, actionable feedback…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-border p-3 text-sm">
            <Checkbox
              checked={hideMarks}
              onCheckedChange={(c) => setHideMarks(c === true)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Hide marks from student</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Student will see &quot;Not graded yet&quot; until you uncheck
                this and save again.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Award className="h-4 w-4" />
            {saving ? "Saving…" : "Save grade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function passFailBadge(passFail: "pass" | "fail" | null) {
  if (!passFail) return <Badge variant="secondary">Ungraded</Badge>;
  return passFail === "pass" ? (
    <Badge variant="success">Pass</Badge>
  ) : (
    <Badge variant="danger">Fail</Badge>
  );
}







// "use client";

// import { useState } from "react";
// import { toast } from "sonner";
// import { Award, CheckCircle2, XCircle } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { initials, cn } from "@/lib/utils";
// import type { User } from "@/types";

// const rubricItems = [
//   "Meets all stated objectives",
//   "Code / work is well organized",
//   "Follows submission instructions",
//   "Demonstrates original analysis",
// ];

// export function GradingModal({
//   open,
//   onOpenChange,
//   student,
//   totalMarks,
//   initialMarks,
//   initialFeedback,
//   onSave,
// }: {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;
//   student: User;
//   totalMarks: number;
//   initialMarks: number | null;
//   initialFeedback: string | null;
//   onSave: (
//     marks: number,
//     feedback: string,
//     passFail: "pass" | "fail",
//   ) => void | Promise<void>;
// }) {
//   const [marks, setMarks] = useState(initialMarks?.toString() ?? "");
//   const [feedback, setFeedback] = useState(initialFeedback ?? "");
//   const [rubric, setRubric] = useState<boolean[]>(rubricItems.map(() => false));
//   const [saving, setSaving] = useState(false);

//   const numericMarks = Number(marks) || 0;
//   const passFail: "pass" | "fail" =
//     numericMarks >= totalMarks * 0.5 ? "pass" : "fail";

//   async function handleSave() {
//     if (!marks) {
//       toast.error("Enter a marks value before saving.");
//       return;
//     }
//     setSaving(true);
//     try {
//       await onSave(numericMarks, feedback, passFail);
//       toast.success(`Grade saved for ${student.name}.`);
//       onOpenChange(false);
//     } catch {
//       // parent already shows error toast
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <div className="flex items-center gap-3">
//             <Avatar className="h-10 w-10">
//               <AvatarFallback
//                 style={{
//                   backgroundColor: `${student.avatarColor}1A`,
//                   color: student.avatarColor,
//                 }}
//               >
//                 {initials(student.name)}
//               </AvatarFallback>
//             </Avatar>
//             <div>
//               <DialogTitle>{student.name}</DialogTitle>
//               <DialogDescription>{student.rollNumber}</DialogDescription>
//             </div>
//           </div>
//         </DialogHeader>

//         <div className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-1.5">
//               <Label htmlFor="marks">Marks (out of {totalMarks})</Label>
//               <Input
//                 id="marks"
//                 type="number"
//                 max={totalMarks}
//                 min={0}
//                 value={marks}
//                 onChange={(e) => setMarks(e.target.value)}
//               />
//             </div>
//             <div className="space-y-1.5">
//               <Label>Result</Label>
//               <div
//                 className={cn(
//                   "flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium",
//                   passFail === "pass"
//                     ? "bg-success-soft text-success"
//                     : "bg-danger-soft text-danger",
//                 )}
//               >
//                 {passFail === "pass" ? (
//                   <CheckCircle2 className="h-4 w-4" />
//                 ) : (
//                   <XCircle className="h-4 w-4" />
//                 )}
//                 {passFail === "pass" ? "Pass" : "Fail"}
//               </div>
//             </div>
//           </div>

//           <div className="space-y-1.5">
//             <Label>Rubric checklist</Label>
//             <div className="space-y-2 rounded-xl border border-border p-3">
//               {rubricItems.map((item, i) => (
//                 <label key={item} className="flex items-center gap-2.5 text-sm">
//                   <Checkbox
//                     checked={rubric[i]}
//                     onCheckedChange={(c) =>
//                       setRubric((prev) =>
//                         prev.map((v, idx) => (idx === i ? !!c : v)),
//                       )
//                     }
//                   />
//                   {item}
//                 </label>
//               ))}
//             </div>
//           </div>

//           <div className="space-y-1.5">
//             <Label htmlFor="feedback">Feedback</Label>
//             <Textarea
//               id="feedback"
//               rows={4}
//               placeholder="Share specific, actionable feedback…"
//               value={feedback}
//               onChange={(e) => setFeedback(e.target.value)}
//             />
//           </div>
//         </div>

//         <DialogFooter>
//           <Button
//             variant="outline"
//             onClick={() => onOpenChange(false)}
//             disabled={saving}
//           >
//             Cancel
//           </Button>
//           <Button onClick={handleSave} disabled={saving}>
//             <Award className="h-4 w-4" />
//             {saving ? "Saving…" : "Save grade"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// export function passFailBadge(passFail: "pass" | "fail" | null) {
//   if (!passFail) return <Badge variant="secondary">Ungraded</Badge>;
//   return passFail === "pass" ? (
//     <Badge variant="success">Pass</Badge>
//   ) : (
//     <Badge variant="danger">Fail</Badge>
//   );
// }









