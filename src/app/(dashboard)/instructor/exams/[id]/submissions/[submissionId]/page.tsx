"use client";

import { FileText, Download, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function ExamGradePage() {
  const [marks, setMarks] = useState("");

  const [feedback, setFeedback] = useState("");

  function saveGrade() {
    console.log({
      marks,
      feedback,
    });

    toast.success("Grade saved");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Grade Exam Submission</h1>
        <p className="text-sm text-muted-foreground">
          Review student exam answer and give marks.
        </p>
      </div>

      <div className="rounded-xl border p-5 space-y-5">
        <div>
          <h2 className="font-semibold">Student</h2>

          <p className="text-sm text-muted-foreground">—</p>
        </div>

        <div className="rounded-lg border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" />

            <div>
              <p className="font-medium">—</p>

              <p className="text-xs text-muted-foreground">No file</p>
            </div>
          </div>

          <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <Download className="h-4 w-4" />
            View
          </button>
        </div>

        <div>
          <label className="text-sm font-medium">Marks</label>

          <Input
            type="number"
            placeholder="Enter marks"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Feedback</label>

          <Textarea
            rows={4}
            placeholder="Write feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        <Button onClick={saveGrade} className="w-full">
          <Save className="h-4 w-4" />
          Save Grade
        </Button>
      </div>
    </div>
  );
}
