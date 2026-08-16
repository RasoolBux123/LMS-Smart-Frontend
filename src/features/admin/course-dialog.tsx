"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCourse, updateCourse, type Course } from "@/lib/api/courses";
import type { ManagedUser } from "@/lib/api/users";
import { errorMessage, cn } from "@/lib/utils";

const UNASSIGNED = "__unassigned__";

export function CourseDialog({
    open,
    onOpenChange,
    course,
    instructors,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    course?: Course | null;
    instructors: ManagedUser[];
    onSaved: (course: Course, mode: "create" | "edit") => void;
}) {
    const editing = Boolean(course);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [instructorId, setInstructorId] = useState(UNASSIGNED);
    const [status, setStatus] = useState("active");
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        setError("");
        setTitle(course?.title ?? "");
        setDescription(course?.description ?? "");
        setInstructorId(course?.instructorId || UNASSIGNED);
        setStatus(course?.status ?? "active");
        setSkills(course?.objectives ?? []);
        setSkillInput("");
    }, [open, course]);

    const canSave = title.trim().length >= 3 && !saving;

    function addSkill() {
        const value = skillInput.trim();
        if (!value) return;
        if (!skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
            setSkills((prev) => [...prev, value]);
        }
        setSkillInput("");
    }

    function removeSkill(value: string) {
        setSkills((prev) => prev.filter((s) => s !== value));
    }

    function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addSkill();
        } else if (e.key === "Backspace" && !skillInput && skills.length > 0) {
            setSkills((prev) => prev.slice(0, -1));
        }
    }

    async function handleSave() {
        if (!canSave) return;
        setSaving(true);
        setError("");
        const owner = instructorId === UNASSIGNED ? "" : instructorId;

        try {
            if (editing && course) {
                const res = await updateCourse(course.id, {
                    title: title.trim(),
                    description: description.trim(),
                    instructorId: owner,
                    status,
                    objectives: skills,
                });
                onSaved(res.data, "edit");
                toast.success("Course updated");
            } else {
                const res = await createCourse(
                    title.trim(),
                    description.trim(),
                    owner,
                    skills,
                );
                onSaved(res.data, "create");
                toast.success("Course created");
            }
            onOpenChange(false);
        } catch (err: unknown) {
            const msg = errorMessage(err, "Could not save the course.");
            setError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit course" : "New course"}</DialogTitle>
                    <DialogDescription>
                        Create a course and assign it to an instructor.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {error && (
                        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="course-title">Title</Label>
                        <Input
                            id="course-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Full Stack Development"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="course-desc">Description</Label>
                        <Textarea
                            id="course-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this course about…"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Instructor</Label>
                            <Select value={instructorId} onValueChange={setInstructorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Assign" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                                    {instructors.map((i) => (
                                        <SelectItem key={i.id} value={i.id}>
                                            {i.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="course-skills">Skills you gain</Label>
                        <div
                            className={cn(
                                "flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5",
                            )}
                        >
                            {skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        aria-label={`Remove ${skill}`}
                                        className="rounded-full hover:opacity-70"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                id="course-skills"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyDown={handleSkillKeyDown}
                                onBlur={addSkill}
                                placeholder={skills.length === 0 ? "e.g. Python, APIs, AI & ML" : "Add another…"}
                                className="min-w-[8rem] flex-1 border-0 bg-transparent p-1 text-sm outline-none placeholder:text-faint-foreground"
                            />
                        </div>
                        <p className="text-xs text-faint-foreground">
                            Press Enter or comma to add a skill tag.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!canSave}>
                        {saving ? "Saving…" : editing ? "Save changes" : "Create course"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}






// "use client";

// import { useEffect, useState } from "react";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { createCourse, updateCourse, type Course } from "@/lib/api/courses";
// import type { ManagedUser } from "@/lib/api/users";
// import { errorMessage } from "@/lib/utils";

// const UNASSIGNED = "__unassigned__";

// export function CourseDialog({
//     open,
//     onOpenChange,
//     course,
//     instructors,
//     onSaved,
// }: {
//     open: boolean;
//     onOpenChange: (open: boolean) => void;
//     course?: Course | null;
//     instructors: ManagedUser[];
//     onSaved: (course: Course, mode: "create" | "edit") => void;
// }) {
//     const editing = Boolean(course);

//     const [title, setTitle] = useState("");
//     const [description, setDescription] = useState("");
//     const [instructorId, setInstructorId] = useState(UNASSIGNED);
//     const [status, setStatus] = useState("active");
//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState("");

//     useEffect(() => {
//         if (!open) return;
//         setError("");
//         setTitle(course?.title ?? "");
//         setDescription(course?.description ?? "");
//         setInstructorId(course?.instructorId || UNASSIGNED);
//         setStatus(course?.status ?? "active");
//     }, [open, course]);

//     const canSave = title.trim().length >= 3 && !saving;

//     async function handleSave() {
//         if (!canSave) return;
//         setSaving(true);
//         setError("");
//         const owner = instructorId === UNASSIGNED ? "" : instructorId;

//         try {
//             if (editing && course) {
//                 const res = await updateCourse(course.id, {
//                     title: title.trim(),
//                     description: description.trim(),
//                     instructorId: owner,
//                     status,
//                 });
//                 onSaved(res.data, "edit");
//                 toast.success("Course updated");
//             } else {
//                 const res = await createCourse(title.trim(), description.trim(), owner);
//                 onSaved(res.data, "create");
//                 toast.success("Course created");
//             }
//             onOpenChange(false);
//         } catch (err: unknown) {
//             const msg = errorMessage(err, "Could not save the course.");
//             setError(msg);
//             toast.error(msg);
//         } finally {
//             setSaving(false);
//         }
//     }

//     return (
//         <Dialog open={open} onOpenChange={onOpenChange}>
//             <DialogContent className="max-w-md">
//                 <DialogHeader>
//                     <DialogTitle>{editing ? "Edit course" : "New course"}</DialogTitle>
//                     <DialogDescription>
//                         Create a course and assign it to an instructor.
//                     </DialogDescription>
//                 </DialogHeader>

//                 <div className="space-y-4">
//                     {error && (
//                         <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
//                     )}

//                     <div className="space-y-1.5">
//                         <Label htmlFor="course-title">Title</Label>
//                         <Input
//                             id="course-title"
//                             value={title}
//                             onChange={(e) => setTitle(e.target.value)}
//                             placeholder="e.g. Full Stack Development"
//                             autoFocus
//                         />
//                     </div>

//                     <div className="space-y-1.5">
//                         <Label htmlFor="course-desc">Description</Label>
//                         <Textarea
//                             id="course-desc"
//                             value={description}
//                             onChange={(e) => setDescription(e.target.value)}
//                             placeholder="What is this course about…"
//                             rows={3}
//                         />
//                     </div>

//                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                         <div className="space-y-1.5">
//                             <Label>Instructor</Label>
//                             <Select value={instructorId} onValueChange={setInstructorId}>
//                                 <SelectTrigger>
//                                     <SelectValue placeholder="Assign" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
//                                     {instructors.map((i) => (
//                                         <SelectItem key={i.id} value={i.id}>
//                                             {i.name}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         <div className="space-y-1.5">
//                             <Label>Status</Label>
//                             <Select value={status} onValueChange={setStatus}>
//                                 <SelectTrigger>
//                                     <SelectValue />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="active">Active</SelectItem>
//                                     <SelectItem value="draft">Draft</SelectItem>
//                                     <SelectItem value="archived">Archived</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>
//                     </div>
//                 </div>

//                 <DialogFooter>
//                     <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
//                         Cancel
//                     </Button>
//                     <Button onClick={handleSave} disabled={!canSave}>
//                         {saving ? "Saving…" : editing ? "Save changes" : "Create course"}
//                     </Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     );
// }