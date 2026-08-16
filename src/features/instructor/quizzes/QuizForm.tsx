"use client";

import { useState } from "react";

import { useForm, Controller } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";

import { Save, Send } from "lucide-react";

import { useCourseOptions } from "@/hooks/useCourseOptions";

import { useAuth } from "@/hooks/useAuth"; // <-- ADDED

import {
  quizzesApi,
  type Coursework,
  type CourseworkPayload,
} from "@/lib/api/coursework";

import { errorMessage, cn } from "@/lib/utils";

import FileUpload from "@/components/instructor/FileUpload";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fileTypes = [
  {
    value: "pdf",
    label: "PDF",
  },

  {
    value: "docx",
    label: "DOCX",
  },

  {
    value: "xls",
    label: "Excel",
  },

  {
    value: "ppt",
    label: "PowerPoint",
  },

  {
    value: "txt",
    label: "TXT",
  },

  {
    value: "zip",
    label: "ZIP",
  },

  {
    value: "other",
    label: "Other",
  },
];

const schema = z.object({
  title: z
    .string()
    .min(1, "Quiz title is required.")
    .min(5, "Title must be at least 5 characters."),
  courseId: z.string().min(1, "Please select a course."),
  description: z
    .string()
    .min(1, "Description is required.")
    .min(10, "Description must be at least 10 characters."),
  instructions: z
    .string()
    .min(1, "Instructions are required.")
    .min(5, "Instructions must be at least 5 characters."),
  deadline: z.string().min(1, "Please set a deadline."),
  totalMarks: z.coerce
    .number({ invalid_type_error: "Total marks must be a number." })
    .min(1, "Total marks must be at least 1."),
  allowedFileTypes: z
    .array(z.string())
    .min(1, "Select at least one allowed file type."),
  maxFileSizeMb: z.coerce
    .number({ invalid_type_error: "Max file size must be a number." })
    .min(1, "Max file size must be at least 1 MB."),
});

type QuizFormValues = z.infer<typeof schema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-danger">{message}</p>;
}

export interface QuizFormProps {
  mode: "create" | "edit";
  /** Required in edit mode — the quiz being updated. */
  quizId?: string;
  /** Existing values used to prefill the form in edit mode. */
  defaultValues?: Coursework;
}

export default function QuizForm({
  mode,
  quizId,
  defaultValues,
}: QuizFormProps) {
  const router = useRouter();

  const { user } = useAuth(); // <-- ADDED

  /* Real courses from the API — the old static import was an empty array. */
  const {
    courses,
    loading: coursesLoading,
    error: coursesError,
  } = useCourseOptions();

  const [quizFile, setQuizFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);

  function onInvalid() {
    toast.error("Please fix the highlighted fields before saving.");
  }

  /*
   * In edit mode the deadline arrives as an ISO string; the picker needs a
   * Date. Guard against an unparseable value so a bad record cannot crash
   * the page with an Invalid Date.
   */
  const [deadline, setDeadline] = useState<Date | null>(() => {
    if (!defaultValues?.deadline) return null;
    const parsed = new Date(defaultValues.deadline);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  });

  const {
    register,

    control,

    handleSubmit, formState: { errors } } =
    useForm<QuizFormValues>({
      resolver: zodResolver(schema),

      defaultValues: {
        title: defaultValues?.title ?? "",

        courseId: defaultValues?.courseId ?? "",

        description: defaultValues?.description ?? "",

        instructions: defaultValues?.instructions ?? "",

        deadline: defaultValues?.deadline ?? "",

        allowedFileTypes: defaultValues?.allowedFileTypes ?? ["pdf"],

        maxFileSizeMb: defaultValues?.maxFileSizeMb ?? 25,

        totalMarks: defaultValues?.totalMarks ?? 100,
      },
    });

  async function submit(values: QuizFormValues, publish: boolean) {
    const payload: CourseworkPayload = {
      title: values.title,
      courseId: values.courseId,
      instructorId: user?.id, // <-- ADDED — without this the quiz saves with no owner and never shows in the instructor's list
      description: values.description,
      instructions: values.instructions,
      deadline: values.deadline,
      totalMarks: values.totalMarks,
      allowedFileTypes:
        values.allowedFileTypes as CourseworkPayload["allowedFileTypes"],
      maxFileSizeMb: values.maxFileSizeMb,
      objectives: defaultValues?.objectives ?? [],
      resubmissionAllowed: defaultValues?.resubmissionAllowed ?? false,
      maxAttempts: defaultValues?.maxAttempts ?? 1,
      status: publish ? "published" : "draft",
    };

    setSaving(true);
    try {
      const saved =
        mode === "edit" && quizId
          ? await quizzesApi.update(quizId, payload)
          : await quizzesApi.create(payload);

      /*
       * The attachment goes up in a second request, because the quiz has to
       * exist before a file can attach to it. A failure here must not read
       * as a total failure — the quiz itself is saved.
       */
      if (quizFile) {
        try {
          await quizzesApi.uploadAttachment(saved.id, quizFile);
        } catch (err: unknown) {
          toast.error(
            errorMessage(
              err,
              "Quiz saved, but the attachment failed to upload.",
            ),
          );
        }
      }

      toast.success(
        mode === "edit"
          ? "Quiz updated"
          : publish
            ? "Quiz published"
            : "Quiz saved as draft",
      );

      router.push("/instructor/quizzes");
      router.refresh();
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Could not save the quiz."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="space-y-6"

      onSubmit={(e) => e.preventDefault()}
    >
      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label>Quiz Title</Label>

            <Input
              placeholder="Python Assignment Quiz"

              {...register("title")}
            />
            <FieldError message={errors.title?.message} />
          </div>

          <div>
            <Label>Course</Label>

            <Controller
              control={control}

              name="courseId"

              render={({ field }) => (
                <Select
                  value={field.value}

                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>

                  <SelectContent>
                    {coursesLoading && (
                      <p className="px-2.5 py-3 text-sm text-muted-foreground">
                        Loading courses…
                      </p>
                    )}
                    {!coursesLoading && coursesError && (
                      <p className="px-2.5 py-3 text-sm text-danger">
                        Could not load courses. Please retry.
                      </p>
                    )}
                    {!coursesLoading && !coursesError && courses.length === 0 && (
                      <p className="px-2.5 py-3 text-sm text-muted-foreground">
                        No courses assigned to you yet.
                      </p>
                    )}
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label>Description</Label>

            <Textarea
              rows={3}

              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>

          <div>
            <Label>Instructions</Label>

            <Textarea
              rows={3}

              {...register("instructions")}
            />
            <FieldError message={errors.instructions?.message} />
          </div>

          <div>
            <Label>Deadline</Label>

            <Controller
              control={control}

              name="deadline"

              render={({ field }) => (
                <DatePicker
                  selected={deadline}

                  onChange={(date: Date | null) => {
                    setDeadline(date);

                    field.onChange(date ? date.toISOString() : "");
                  }}

                  showTimeSelect

                  timeIntervals={15}

                  dateFormat="MMMM d, yyyy h:mm aa"

                  minDate={new Date()}

                  isClearable

                  placeholderText="Select quiz deadline"

                  className="w-full rounded-xl border px-4 py-3 bg-background text-sm"
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission Rules</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div>
            <Label>Allowed Answer File Types</Label>

            <Controller
              control={control}

              name="allowedFileTypes"

              render={({ field }) => (
                <div className="flex flex-wrap gap-4 mt-3">
                  {fileTypes.map((type) => (
                    <label
                      key={type.value}

                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={field.value.includes(type.value)}

                        onCheckedChange={(checked) => {
                          field.onChange(
                            checked
                              ? [...field.value, type.value]
                              : field.value.filter(
                                (item) => item !== type.value,
                              ),
                          );
                        }}
                      />

                      {type.label}
                    </label>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Maximum File Size (MB)</Label>

              <Input
                type="number"

                {...register("maxFileSizeMb")}
              />
            </div>

            <div>
              <Label>Total Marks</Label>

              <Input
                type="number"

                {...register("totalMarks")}
              />
            </div>
          </div>

          <div>
            <FileUpload
              title="Quiz Attachment"

              onFileSelect={setQuizFile}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"

          variant="outline"

          disabled={saving}

          className="w-full sm:w-auto"

          onClick={handleSubmit((values) => submit(values, false), onInvalid)}
        >
          <Save className="h-4 w-4" />
          Save Draft
        </Button>

        <Button
          type="button"

          disabled={saving}

          className="w-full sm:w-auto"

          onClick={handleSubmit((values) => submit(values, true), onInvalid)}
        >
          <Send className="h-4 w-4" />
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Publish Quiz"
              : "Save & Publish"}
        </Button>
      </div>
    </form>
  );
}















// "use client";

// import { useState } from "react";

// import { useForm, Controller } from "react-hook-form";

// import { zodResolver } from "@hookform/resolvers/zod";

// import { z } from "zod";

// import { useRouter } from "next/navigation";

// import { toast } from "sonner";

// import DatePicker from "react-datepicker";

// import "react-datepicker/dist/react-datepicker.css";

// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// import { Input } from "@/components/ui/input";

// import { Textarea } from "@/components/ui/textarea";

// import { Label } from "@/components/ui/label";

// import { Button } from "@/components/ui/button";

// import { Checkbox } from "@/components/ui/checkbox";

// import { Save, Send } from "lucide-react";

// import { useCourseOptions } from "@/hooks/useCourseOptions";

// import { useAuth } from "@/hooks/useAuth"; // <-- ADDED

// import {
//   quizzesApi,
//   type Coursework,
//   type CourseworkPayload,
// } from "@/lib/api/coursework";

// import { errorMessage } from "@/lib/utils";

// import FileUpload from "@/components/instructor/FileUpload";

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// const fileTypes = [
//   {
//     value: "pdf",
//     label: "PDF",
//   },

//   {
//     value: "docx",
//     label: "DOCX",
//   },

//   {
//     value: "xls",
//     label: "Excel",
//   },

//   {
//     value: "ppt",
//     label: "PowerPoint",
//   },

//   {
//     value: "txt",
//     label: "TXT",
//   },

//   {
//     value: "zip",
//     label: "ZIP",
//   },

//   {
//     value: "other",
//     label: "Other",
//   },
// ];

// const schema = z.object({
//   title: z.string().min(5),

//   courseId: z.string().min(1),

//   description: z.string().min(10),

//   instructions: z.string().min(5),

//   deadline: z.string().min(1),

//   totalMarks: z.coerce.number().min(1),

//   allowedFileTypes: z.array(z.string()).min(1),

//   maxFileSizeMb: z.coerce.number().min(1),
// });

// type QuizFormValues = z.infer<typeof schema>;

// export interface QuizFormProps {
//   mode: "create" | "edit";
//   /** Required in edit mode — the quiz being updated. */
//   quizId?: string;
//   /** Existing values used to prefill the form in edit mode. */
//   defaultValues?: Coursework;
// }

// export default function QuizForm({
//   mode,
//   quizId,
//   defaultValues,
// }: QuizFormProps) {
//   const router = useRouter();

//   const { user } = useAuth(); // <-- ADDED

//   /* Real courses from the API — the old static import was an empty array. */
//   const {
//     courses,
//     loading: coursesLoading,
//     error: coursesError,
//   } = useCourseOptions();

//   const [quizFile, setQuizFile] = useState<File | null>(null);

//   const [saving, setSaving] = useState(false);

//   /*
//    * In edit mode the deadline arrives as an ISO string; the picker needs a
//    * Date. Guard against an unparseable value so a bad record cannot crash
//    * the page with an Invalid Date.
//    */
//   const [deadline, setDeadline] = useState<Date | null>(() => {
//     if (!defaultValues?.deadline) return null;
//     const parsed = new Date(defaultValues.deadline);
//     return Number.isNaN(parsed.getTime()) ? null : parsed;
//   });

//   const {
//     register,

//     control,

//     handleSubmit,
//   } = useForm<QuizFormValues>({
//     resolver: zodResolver(schema),

//     defaultValues: {
//       title: defaultValues?.title ?? "",

//       courseId: defaultValues?.courseId ?? "",

//       description: defaultValues?.description ?? "",

//       instructions: defaultValues?.instructions ?? "",

//       deadline: defaultValues?.deadline ?? "",

//       allowedFileTypes: defaultValues?.allowedFileTypes ?? ["pdf"],

//       maxFileSizeMb: defaultValues?.maxFileSizeMb ?? 25,

//       totalMarks: defaultValues?.totalMarks ?? 100,
//     },
//   });

//   async function submit(values: QuizFormValues, publish: boolean) {
//     const payload: CourseworkPayload = {
//       title: values.title,
//       courseId: values.courseId,
//       instructorId: user?.id, // <-- ADDED — without this the quiz saves with no owner and never shows in the instructor's list
//       description: values.description,
//       instructions: values.instructions,
//       deadline: values.deadline,
//       totalMarks: values.totalMarks,
//       allowedFileTypes:
//         values.allowedFileTypes as CourseworkPayload["allowedFileTypes"],
//       maxFileSizeMb: values.maxFileSizeMb,
//       objectives: defaultValues?.objectives ?? [],
//       resubmissionAllowed: defaultValues?.resubmissionAllowed ?? false,
//       maxAttempts: defaultValues?.maxAttempts ?? 1,
//       status: publish ? "published" : "draft",
//     };

//     setSaving(true);
//     try {
//       const saved =
//         mode === "edit" && quizId
//           ? await quizzesApi.update(quizId, payload)
//           : await quizzesApi.create(payload);

//       /*
//        * The attachment goes up in a second request, because the quiz has to
//        * exist before a file can attach to it. A failure here must not read
//        * as a total failure — the quiz itself is saved.
//        */
//       if (quizFile) {
//         try {
//           await quizzesApi.uploadAttachment(saved.id, quizFile);
//         } catch (err: unknown) {
//           toast.error(
//             errorMessage(
//               err,
//               "Quiz saved, but the attachment failed to upload.",
//             ),
//           );
//         }
//       }

//       toast.success(
//         mode === "edit"
//           ? "Quiz updated"
//           : publish
//             ? "Quiz published"
//             : "Quiz saved as draft",
//       );

//       router.push("/instructor/quizzes");
//       router.refresh();
//     } catch (err: unknown) {
//       toast.error(errorMessage(err, "Could not save the quiz."));
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <form
//       className="space-y-6"

//       onSubmit={(e) => e.preventDefault()}
//     >
//       <Card>
//         <CardHeader>
//           <CardTitle>Quiz Details</CardTitle>
//         </CardHeader>

//         <CardContent className="space-y-4">
//           <div>
//             <Label>Quiz Title</Label>

//             <Input
//               placeholder="Python Assignment Quiz"

//               {...register("title")}
//             />
//           </div>

//           <div>
//             <Label>Course</Label>

//             <Controller
//               control={control}

//               name="courseId"

//               render={({ field }) => (
//                 <Select
//                   value={field.value}

//                   onValueChange={field.onChange}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select Course" />
//                   </SelectTrigger>

//                   <SelectContent>
//                     {coursesLoading && (
//                       <p className="px-2.5 py-3 text-sm text-muted-foreground">
//                         Loading courses…
//                       </p>
//                     )}
//                     {!coursesLoading && coursesError && (
//                       <p className="px-2.5 py-3 text-sm text-danger">
//                         Could not load courses. Please retry.
//                       </p>
//                     )}
//                     {!coursesLoading && !coursesError && courses.length === 0 && (
//                       <p className="px-2.5 py-3 text-sm text-muted-foreground">
//                         No courses assigned to you yet.
//                       </p>
//                     )}
//                     {courses.map((course) => (
//                       <SelectItem key={course.id} value={course.id}>
//                         {course.title}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               )}
//             />
//           </div>

//           <div>
//             <Label>Description</Label>

//             <Textarea
//               rows={3}

//               {...register("description")}
//             />
//           </div>

//           <div>
//             <Label>Instructions</Label>

//             <Textarea
//               rows={3}

//               {...register("instructions")}
//             />
//           </div>

//           <div>
//             <Label>Deadline</Label>

//             <Controller
//               control={control}

//               name="deadline"

//               render={({ field }) => (
//                 <DatePicker
//                   selected={deadline}

//                   onChange={(date: Date | null) => {
//                     setDeadline(date);

//                     field.onChange(date ? date.toISOString() : "");
//                   }}

//                   showTimeSelect

//                   timeIntervals={15}

//                   dateFormat="MMMM d, yyyy h:mm aa"

//                   minDate={new Date()}

//                   isClearable

//                   placeholderText="Select quiz deadline"

//                   className="w-full rounded-xl border px-4 py-3 bg-background text-sm"
//                 />
//               )}
//             />
//           </div>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle>Submission Rules</CardTitle>
//         </CardHeader>

//         <CardContent className="space-y-5">
//           <div>
//             <Label>Allowed Answer File Types</Label>

//             <Controller
//               control={control}

//               name="allowedFileTypes"

//               render={({ field }) => (
//                 <div className="flex flex-wrap gap-4 mt-3">
//                   {fileTypes.map((type) => (
//                     <label
//                       key={type.value}

//                       className="flex items-center gap-2 text-sm"
//                     >
//                       <Checkbox
//                         checked={field.value.includes(type.value)}

//                         onCheckedChange={(checked) => {
//                           field.onChange(
//                             checked
//                               ? [...field.value, type.value]
//                               : field.value.filter(
//                                 (item) => item !== type.value,
//                               ),
//                           );
//                         }}
//                       />

//                       {type.label}
//                     </label>
//                   ))}
//                 </div>
//               )}
//             />
//           </div>

//           <div className="grid sm:grid-cols-2 gap-4">
//             <div>
//               <Label>Maximum File Size (MB)</Label>

//               <Input
//                 type="number"

//                 {...register("maxFileSizeMb")}
//               />
//             </div>

//             <div>
//               <Label>Total Marks</Label>

//               <Input
//                 type="number"

//                 {...register("totalMarks")}
//               />
//             </div>
//           </div>

//           <div>
//             <FileUpload
//               title="Quiz Attachment"

//               onFileSelect={setQuizFile}
//             />
//           </div>
//         </CardContent>
//       </Card>

//       <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
//         <Button
//           type="button"

//           variant="outline"

//           disabled={saving}

//           className="w-full sm:w-auto"

//           onClick={handleSubmit((values) => submit(values, false))}
//         >
//           <Save className="h-4 w-4" />
//           Save Draft
//         </Button>

//         <Button
//           type="button"

//           disabled={saving}

//           className="w-full sm:w-auto"

//           onClick={handleSubmit((values) => submit(values, true))}
//         >
//           <Send className="h-4 w-4" />
//           {saving
//             ? "Saving…"
//             : mode === "create"
//               ? "Publish Quiz"
//               : "Save & Publish"}
//         </Button>
//       </div>
//     </form>
//   );
// }


