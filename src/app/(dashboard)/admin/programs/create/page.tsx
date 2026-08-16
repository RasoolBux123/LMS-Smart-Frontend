import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProgramForm } from "@/features/programs/program-form";

export const metadata = { title: "Create program · SmartLMS" };

export default function CreateProgramPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to programs
      </Link>

      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Create program
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Set up a new degree or diploma track. Save it as a draft while you
          plan, then switch it to active to publish it for students and
          instructors.
        </p>
      </div>

      <ProgramForm mode="create" />
    </div>
  );
}
