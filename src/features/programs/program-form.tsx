"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createProgram, updateProgram } from "@/lib/api/programs";
import { listCourses, type Course } from "@/lib/api/courses";
import { errorMessage, cn } from "@/lib/utils";
import {
  PROGRAM_LEVELS,
  PROGRAM_STATUSES,
  type Program,
  type ProgramLevel,
  type ProgramPayload,
  type ProgramStatus,
} from "@/types/program";

const SWATCHES = [
  "#4338ca",
  "#0f766e",
  "#1d4ed8",
  "#be123c",
  "#a1600a",
  "#7c3aed",
];

interface FormState {
  code: string;
  title: string;
  description: string;
  level: ProgramLevel;
  status: ProgramStatus;
  durationMonths: string;
  totalCredits: string;
  coordinator: string;
  company: string;
  color: string;
  courseIds: string[];
}

function initialState(program?: Program): FormState {
  return {
    code: program?.code ?? "",
    title: program?.title ?? "",
    description: program?.description ?? "",
    level: program?.level ?? "diploma",
    status: program?.status ?? "draft",
    durationMonths: String(program?.durationMonths ?? 12),
    totalCredits: String(program?.totalCredits ?? 30),
    coordinator: program?.coordinator ?? "",
    company: program?.company ?? "",
    color: program?.color ?? SWATCHES[0],
    courseIds: program?.courseIds ?? [],
  };
}

type Errors = Partial<Record<keyof FormState, string>>;

function validate(values: FormState): Errors {
  const errors: Errors = {};

  if (!values.title.trim()) {
    errors.title = "Program title is required.";
  } else if (values.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters.";
  }

  if (!values.code.trim()) {
    errors.code = "Program code is required.";
  } else if (!/^[A-Za-z0-9-]{2,8}$/.test(values.code.trim())) {
    errors.code = "Use 2–8 letters, numbers or hyphens (e.g. WEB, AI-2).";
  }

  if (!values.description.trim()) {
    errors.description = "Add a short description of the program.";
  }

  const months = Number(values.durationMonths);
  if (!Number.isFinite(months) || months < 1 || months > 72) {
    errors.durationMonths = "Enter a duration between 1 and 72 months.";
  }

  const credits = Number(values.totalCredits);
  if (!Number.isFinite(credits) || credits < 1 || credits > 300) {
    errors.totalCredits = "Enter credits between 1 and 300.";
  }

  return errors;
}

interface ProgramFormProps {
  mode: "create" | "edit";
  program?: Program;
}

export function ProgramForm({ mode, program }: ProgramFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormState>(() => initialState(program));
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    listCourses()
      .then((res) => setCourses(res.data ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function toggleCourse(courseId: string) {
    setValues((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: ProgramPayload = {
      code: values.code.trim().toUpperCase(),
      title: values.title.trim(),
      description: values.description.trim(),
      level: values.level,
      status: values.status,
      durationMonths: Number(values.durationMonths),
      totalCredits: Number(values.totalCredits),
      coordinator: values.coordinator.trim() || undefined,
      company: values.company.trim() || undefined,
      color: values.color,
      courseIds: values.courseIds,
    };

    setSubmitting(true);
    try {
      if (mode === "create") {
        await createProgram(payload);
        toast.success(`Program "${payload.title}" created.`);
      } else if (program) {
        await updateProgram(program.id, payload);
        toast.success(`Program "${payload.title}" updated.`);
      }
      router.push("/admin/programs");
      router.refresh();
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not save the program."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Program details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 1. Company FIRST */}
          <Field
            id="company"
            label="Company / Institute"
            hint="Who is running this program (e.g. Mari Energies, FFC, OGDCL)"
          >
            <Input
              id="company"
              value={values.company}
              onChange={(e) => setField("company", e.target.value)}
              placeholder="Mari Energies"
            />
          </Field>

          {/* 2. Code + Title */}
          <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
            <Field id="code" label="Code" error={errors.code} hint="Short identifier">
              <Input
                id="code"
                value={values.code}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
                placeholder="MEBDB"
                maxLength={8}
                aria-invalid={Boolean(errors.code)}
              />
            </Field>

            <Field id="title" label="Program title" error={errors.title}>
              <Input
                id="title"
                value={values.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Mari Employment Based Digital Bootcamp I"
                aria-invalid={Boolean(errors.title)}
              />
            </Field>
          </div>

          {/* 3. Description */}
          <Field
            id="description"
            label="Description"
            error={errors.description}
            hint="Short description shown on the program card"
          >
            <Textarea
              id="description"
              rows={4}
              value={values.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="A CSR-focused training initiative aimed at equipping participants with practical, industry-relevant skills…"
              aria-invalid={Boolean(errors.description)}
            />
          </Field>

          {/* 4. Level + Status */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="level" label="Level">
              <select
                id="level"
                value={values.level}
                onChange={(e) => setField("level", e.target.value as ProgramLevel)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PROGRAM_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="status" label="Status" hint="Drafts stay hidden from students">
              <select
                id="status"
                value={values.status}
                onChange={(e) => setField("status", e.target.value as ProgramStatus)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PROGRAM_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* 5. Duration / Credits / Coordinator */}
          <div className="grid gap-5 sm:grid-cols-3">
            <Field id="durationMonths" label="Duration (months)" error={errors.durationMonths}>
              <Input
                id="durationMonths"
                type="number"
                min={1}
                max={72}
                value={values.durationMonths}
                onChange={(e) => setField("durationMonths", e.target.value)}
              />
            </Field>

            <Field id="totalCredits" label="Total credits" error={errors.totalCredits}>
              <Input
                id="totalCredits"
                type="number"
                min={1}
                max={300}
                value={values.totalCredits}
                onChange={(e) => setField("totalCredits", e.target.value)}
              />
            </Field>

            <Field id="coordinator" label="Coordinator" hint="Optional">
              <Input
                id="coordinator"
                value={values.coordinator}
                onChange={(e) => setField("coordinator", e.target.value)}
                placeholder="Dr. Ayesha Khan"
              />
            </Field>
          </div>

          {/* 6. Accent colour */}
          <div>
            <Label className="mb-2 block">Accent colour</Label>
            <div className="flex flex-wrap gap-2.5">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setField("color", swatch)}
                  aria-label={`Use accent colour ${swatch}`}
                  aria-pressed={values.color === swatch}
                  className={cn(
                    "h-9 w-9 rounded-xl border-2 transition-transform",
                    values.color === swatch
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses selector */}
      <Card>
        <CardHeader>
          <CardTitle>Courses in this program</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCourses ? (
            <p className="text-sm text-muted-foreground">Loading courses…</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No courses available. Create courses first from the Courses page.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="mb-3 text-xs text-muted-foreground">
                Select the courses that belong to this program. Selected:{" "}
                <span className="font-medium text-foreground">
                  {values.courseIds.length}
                </span>
              </p>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {courses.map((course) => {
                  const checked = values.courseIds.includes(course.id);
                  return (
                    <label
                      key={course.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        checked ? "bg-primary/10" : "hover:bg-muted/50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCourse(course.id)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {course.title}
                      </span>
                      <span className="text-xs capitalize text-muted-foreground">
                        {course.status}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mode === "create" ? "Create program" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint-foreground">{hint}</p>
      ) : null}
    </div>
  );
}


// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { Save, Loader2, AlertCircle } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { createProgram, updateProgram } from "@/lib/api/programs";
// import { errorMessage, cn } from "@/lib/utils";
// import {
//   PROGRAM_LEVELS,
//   PROGRAM_STATUSES,
//   type Program,
//   type ProgramLevel,
//   type ProgramPayload,
//   type ProgramStatus,
// } from "@/types/program";

// const SWATCHES = [
//   "#4338ca",
//   "#0f766e",
//   "#1d4ed8",
//   "#be123c",
//   "#a1600a",
//   "#7c3aed",
// ];

// interface FormState {
//   code: string;
//   title: string;
//   description: string;
//   level: ProgramLevel;
//   status: ProgramStatus;
//   durationMonths: string;
//   totalCredits: string;
//   coordinator: string;
//   company: string;
//   color: string;
// }

// function initialState(program?: Program): FormState {
//   return {
//     code: program?.code ?? "",
//     title: program?.title ?? "",
//     description: program?.description ?? "",
//     level: program?.level ?? "diploma",
//     status: program?.status ?? "draft",
//     durationMonths: String(program?.durationMonths ?? 12),
//     totalCredits: String(program?.totalCredits ?? 30),
//     coordinator: program?.coordinator ?? "",
//     company: program?.company ?? "",
//     color: program?.color ?? SWATCHES[0],
//   };
// }

// type Errors = Partial<Record<keyof FormState, string>>;

// function validate(values: FormState): Errors {
//   const errors: Errors = {};

//   if (!values.title.trim()) {
//     errors.title = "Program title is required.";
//   } else if (values.title.trim().length < 3) {
//     errors.title = "Title must be at least 3 characters.";
//   }

//   if (!values.code.trim()) {
//     errors.code = "Program code is required.";
//   } else if (!/^[A-Za-z0-9-]{2,8}$/.test(values.code.trim())) {
//     errors.code = "Use 2–8 letters, numbers or hyphens (e.g. WEB, AI-2).";
//   }

//   if (!values.description.trim()) {
//     errors.description = "Add a short description of the program.";
//   }

//   const months = Number(values.durationMonths);
//   if (!Number.isFinite(months) || months < 1 || months > 72) {
//     errors.durationMonths = "Enter a duration between 1 and 72 months.";
//   }

//   const credits = Number(values.totalCredits);
//   if (!Number.isFinite(credits) || credits < 1 || credits > 300) {
//     errors.totalCredits = "Enter credits between 1 and 300.";
//   }

//   return errors;
// }

// interface ProgramFormProps {
//   mode: "create" | "edit";
//   program?: Program;
// }

// export function ProgramForm({ mode, program }: ProgramFormProps) {
//   const router = useRouter();
//   const [values, setValues] = useState<FormState>(() => initialState(program));
//   const [errors, setErrors] = useState<Errors>({});
//   const [submitting, setSubmitting] = useState(false);

//   function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
//     setValues((prev) => ({ ...prev, [key]: value }));
//     setErrors((prev) => {
//       const next = { ...prev };
//       delete next[key];
//       return next;
//     });
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     const nextErrors = validate(values);
//     setErrors(nextErrors);
//     if (Object.keys(nextErrors).length > 0) return;

//     const payload: ProgramPayload = {
//       code: values.code.trim().toUpperCase(),
//       title: values.title.trim(),
//       description: values.description.trim(),
//       level: values.level,
//       status: values.status,
//       durationMonths: Number(values.durationMonths),
//       totalCredits: Number(values.totalCredits),
//       coordinator: values.coordinator.trim() || undefined,
//       company: values.company.trim() || undefined,
//       color: values.color,
//       // keep existing courseIds on edit so we don't wipe them
//       courseIds: mode === "edit" && program ? program.courseIds : [],
//     };

//     setSubmitting(true);
//     try {
//       if (mode === "create") {
//         await createProgram(payload);
//         toast.success(`Program "${payload.title}" created.`);
//       } else if (program) {
//         await updateProgram(program.id, payload);
//         toast.success(`Program "${payload.title}" updated.`);
//       }
//       router.push("/admin/programs");
//       router.refresh();
//     } catch (err: unknown) {
//       toast.error(errorMessage(err, "Could not save the program."));
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-5" noValidate>
//       <Card>
//         <CardHeader>
//           <CardTitle>Program details</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-5">
//           {/* 1. Company FIRST */}
//           <Field
//             id="company"
//             label="Company / Institute"
//             hint="Who is running this program (e.g. Mari Energies, FFC, OGDCL)"
//           >
//             <Input
//               id="company"
//               value={values.company}
//               onChange={(e) => setField("company", e.target.value)}
//               placeholder="Mari Energies"
//             />
//           </Field>

//           {/* 2. Code + Title */}
//           <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
//             <Field id="code" label="Code" error={errors.code} hint="Short identifier">
//               <Input
//                 id="code"
//                 value={values.code}
//                 onChange={(e) => setField("code", e.target.value.toUpperCase())}
//                 placeholder="MEBDB"
//                 maxLength={8}
//                 aria-invalid={Boolean(errors.code)}
//               />
//             </Field>

//             <Field id="title" label="Program title" error={errors.title}>
//               <Input
//                 id="title"
//                 value={values.title}
//                 onChange={(e) => setField("title", e.target.value)}
//                 placeholder="Mari Employment Based Digital Bootcamp I"
//                 aria-invalid={Boolean(errors.title)}
//               />
//             </Field>
//           </div>

//           {/* 3. Description */}
//           <Field
//             id="description"
//             label="Description"
//             error={errors.description}
//             hint="Short description shown on the program card"
//           >
//             <Textarea
//               id="description"
//               rows={4}
//               value={values.description}
//               onChange={(e) => setField("description", e.target.value)}
//               placeholder="A CSR-focused training initiative aimed at equipping participants with practical, industry-relevant skills…"
//               aria-invalid={Boolean(errors.description)}
//             />
//           </Field>

//           {/* 4. Level + Status */}
//           <div className="grid gap-5 sm:grid-cols-2">
//             <Field id="level" label="Level">
//               <select
//                 id="level"
//                 value={values.level}
//                 onChange={(e) => setField("level", e.target.value as ProgramLevel)}
//                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
//               >
//                 {PROGRAM_LEVELS.map((l) => (
//                   <option key={l.value} value={l.value}>
//                     {l.label}
//                   </option>
//                 ))}
//               </select>
//             </Field>

//             <Field id="status" label="Status" hint="Drafts stay hidden from students">
//               <select
//                 id="status"
//                 value={values.status}
//                 onChange={(e) => setField("status", e.target.value as ProgramStatus)}
//                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
//               >
//                 {PROGRAM_STATUSES.map((s) => (
//                   <option key={s.value} value={s.value}>
//                     {s.label}
//                   </option>
//                 ))}
//               </select>
//             </Field>
//           </div>

//           {/* 5. Duration / Credits / Coordinator */}
//           <div className="grid gap-5 sm:grid-cols-3">
//             <Field id="durationMonths" label="Duration (months)" error={errors.durationMonths}>
//               <Input
//                 id="durationMonths"
//                 type="number"
//                 min={1}
//                 max={72}
//                 value={values.durationMonths}
//                 onChange={(e) => setField("durationMonths", e.target.value)}
//               />
//             </Field>

//             <Field id="totalCredits" label="Total credits" error={errors.totalCredits}>
//               <Input
//                 id="totalCredits"
//                 type="number"
//                 min={1}
//                 max={300}
//                 value={values.totalCredits}
//                 onChange={(e) => setField("totalCredits", e.target.value)}
//               />
//             </Field>

//             <Field id="coordinator" label="Coordinator" hint="Optional">
//               <Input
//                 id="coordinator"
//                 value={values.coordinator}
//                 onChange={(e) => setField("coordinator", e.target.value)}
//                 placeholder="Dr. Ayesha Khan"
//               />
//             </Field>
//           </div>

//           {/* 6. Accent colour */}
//           <div>
//             <Label className="mb-2 block">Accent colour</Label>
//             <div className="flex flex-wrap gap-2.5">
//               {SWATCHES.map((swatch) => (
//                 <button
//                   key={swatch}
//                   type="button"
//                   onClick={() => setField("color", swatch)}
//                   aria-label={`Use accent colour ${swatch}`}
//                   aria-pressed={values.color === swatch}
//                   className={cn(
//                     "h-9 w-9 rounded-xl border-2 transition-transform",
//                     values.color === swatch
//                       ? "scale-110 border-foreground"
//                       : "border-transparent hover:scale-105",
//                   )}
//                   style={{ backgroundColor: swatch }}
//                 />
//               ))}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
//         <Button
//           type="button"
//           variant="outline"
//           onClick={() => router.back()}
//           disabled={submitting}
//           className="w-full sm:w-auto"
//         >
//           Cancel
//         </Button>
//         <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
//           {submitting ? (
//             <Loader2 className="h-4 w-4 animate-spin" />
//           ) : (
//             <Save className="h-4 w-4" />
//           )}
//           {mode === "create" ? "Create program" : "Save changes"}
//         </Button>
//       </div>
//     </form>
//   );
// }

// function Field({
//   id,
//   label,
//   hint,
//   error,
//   children,
// }: {
//   id: string;
//   label: string;
//   hint?: string;
//   error?: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div>
//       <Label htmlFor={id} className="mb-1.5 block">
//         {label}
//       </Label>
//       {children}
//       {error ? (
//         <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
//           <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
//           {error}
//         </p>
//       ) : hint ? (
//         <p className="mt-1.5 text-xs text-faint-foreground">{hint}</p>
//       ) : null}
//     </div>
//   );
// }
