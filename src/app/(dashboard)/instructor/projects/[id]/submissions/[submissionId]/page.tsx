"use client";

import Link from "next/link";

import { ArrowLeft, FileText, Download, Save } from "lucide-react";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";

export default function ProjectGradePage() {
  const [marks, setMarks] = useState("");

  const [feedback, setFeedback] = useState("");

  function saveGrade() {
    toast.success("Project grade saved.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/instructor/projects"

        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Grade Project</h1>

        <p className="text-sm text-muted-foreground">
          Review student submission and provide marks.
        </p>
      </div>

      <div className="rounded-xl border p-6 space-y-5">
        <div>
          <h2 className="font-semibold">Student</h2>

          <p className="text-sm text-muted-foreground">—</p>
        </div>

        <div>
          <h2 className="font-semibold">Project</h2>

          <p className="text-sm text-muted-foreground">
            AI Chatbot Development Project
          </p>
        </div>

        <div className="rounded-lg border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" />

            <div>
              <p className="font-medium">AI_Chatbot_Project.zip</p>

              <p className="text-xs text-muted-foreground">Submitted File</p>
            </div>
          </div>

          <Button
            variant="outline"

            className="flex gap-2"
          >
            <Download className="h-4 w-4" />
            View File
          </Button>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Marks</h2>

          <Input
            type="number"

            placeholder="Enter marks"

            value={marks}

            onChange={(e) => setMarks(e.target.value)}
          />
        </div>

        <div>
          <h2 className="font-semibold mb-2">Feedback</h2>

          <Textarea
            rows={5}

            placeholder="Write feedback for student..."

            value={feedback}

            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        <Button
          onClick={saveGrade}

          className="flex gap-2"
        >
          <Save className="h-4 w-4" />
          Save Grade
        </Button>
      </div>
    </div>
  );
}
