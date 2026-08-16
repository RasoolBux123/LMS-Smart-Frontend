"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Wand2, BookOpen, UserCog } from "lucide-react";
import { toast } from "sonner";
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
import {
    createUser,
    updateUser,
    listUsers,
    type ManagedUser,
    type UserRole,
} from "@/lib/api/users";
import { listCourses, type Course } from "@/lib/api/courses";
import { enrollStudent } from "@/lib/api/enrollments";
import { errorMessage, cn } from "@/lib/utils";

const ROLES: { value: UserRole; label: string; hint: string }[] = [
    {
        value: "student",
        label: "Student",
        hint: "Can view courses and submit coursework",
    },
    {
        value: "instructor",
        label: "Instructor",
        hint: "Creates coursework and grades submissions",
    },
    {
        value: "admin",
        label: "Admin",
        hint: "Full platform control",
    },
];

function randomPassword() {
    const chars =
        "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$";
    return Array.from(
        { length: 12 },
        () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
}

/** Accepts both `{ data: user }` envelope and a bare user object. */
function unwrapUser(res: unknown): ManagedUser {
    if (!res || typeof res !== "object") {
        throw new Error("Server did not return the user. Check backend logs.");
    }
    const obj = res as { data?: ManagedUser | null };
    const user = obj.data ?? (res as ManagedUser);
    if (!user || typeof user !== "object" || !("id" in user) || !user.id) {
        throw new Error("Server did not return the user. Check backend logs.");
    }
    return user;
}

export function UserDialog({
    open,
    onOpenChange,
    user,
    defaultRole = "student",
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: ManagedUser | null;
    defaultRole?: UserRole;
    onSaved: (user: ManagedUser, mode: "create" | "edit") => void;
}) {
    const editing = Boolean(user);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<UserRole>(defaultRole);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [courses, setCourses] = useState<Course[]>([]);
    const [instructors, setInstructors] = useState<ManagedUser[]>([]);
    const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [loadingMeta, setLoadingMeta] = useState(false);

    useEffect(() => {
        if (!open) return;
        setError("");
        setShowPassword(false);
        setPassword("");
        setName(user?.name ?? "");
        setEmail(user?.email ?? "");
        setRole(user?.role ?? defaultRole);
        setSelectedInstructorId("");
        setSelectedCourseIds([]);
    }, [open, user, defaultRole]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoadingMeta(true);
        Promise.all([listCourses(), listUsers({ role: "instructor" })])
            .then(([cRes, iRes]) => {
                if (cancelled) return;
                setCourses(Array.isArray(cRes?.data) ? cRes.data : []);
                setInstructors(Array.isArray(iRes?.data) ? iRes.data : []);
            })
            .catch(() => {
                if (!cancelled) {
                    setCourses([]);
                    setInstructors([]);
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingMeta(false);
            });
        return () => {
            cancelled = true;
        };
    }, [open]);

    const filteredCourses = useMemo(() => {
        if (!selectedInstructorId || selectedInstructorId === "all") {
            return courses;
        }
        return courses.filter((c) => c.instructorId === selectedInstructorId);
    }, [courses, selectedInstructorId]);

    const passwordValid = editing
        ? password.length === 0 || password.length >= 6
        : password.length >= 6;

    const canSave =
        name.trim().length >= 2 &&
        email.includes("@") &&
        passwordValid &&
        !saving;

    function toggleCourse(courseId: string) {
        setSelectedCourseIds((prev) =>
            prev.includes(courseId)
                ? prev.filter((id) => id !== courseId)
                : [...prev, courseId],
        );
    }

    async function handleSave() {
        if (!canSave) return;
        setSaving(true);
        setError("");
        try {
            if (editing && user) {
                const payload: {
                    name: string;
                    email: string;
                    role: UserRole;
                    password?: string;
                } = {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    role,
                };
                if (password.length >= 6) payload.password = password;

                const res = await updateUser(user.id, payload);
                const saved = unwrapUser(res);

                if (saved.role === "student" && selectedCourseIds.length > 0) {
                    let enrolled = 0;
                    for (const courseId of selectedCourseIds) {
                        try {
                            await enrollStudent(courseId, saved.id);
                            enrolled += 1;
                        } catch {
                            /* already enrolled */
                        }
                    }
                    toast.success(
                        enrolled > 0
                            ? `${saved.name} updated · ${enrolled} course(s) assigned`
                            : `${saved.name} updated`,
                    );
                } else {
                    toast.success(`${saved.name} updated`);
                }

                onSaved(saved, "edit");
                onOpenChange(false);
            } else {
                const res = await createUser({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    role,
                });
                const saved = unwrapUser(res);

                if (saved.role === "student" && selectedCourseIds.length > 0) {
                    let enrolled = 0;
                    for (const courseId of selectedCourseIds) {
                        try {
                            await enrollStudent(courseId, saved.id);
                            enrolled += 1;
                        } catch {
                            /* ignore */
                        }
                    }
                    toast.success(
                        enrolled > 0
                            ? `Account created · ${enrolled} course(s) assigned`
                            : "Account created",
                    );
                } else {
                    toast.success("Account created");
                }

                onSaved(saved, "create");
                onOpenChange(false);
            }
        } catch (err: unknown) {
            setError(errorMessage(err, "Could not save the account."));
        } finally {
            setSaving(false);
        }
    }

    const roleHint = ROLES.find((r) => r.value === role)?.hint;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Edit account" : "Add new account"}
                    </DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Update account details. Leave password blank to keep the current one."
                            : "Create a new instructor, student or admin account."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="user-name">Full name</Label>
                        <Input
                            id="user-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Ayesha Khan"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="user-email">Email</Label>
                        <Input
                            id="user-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@smartlms.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                            value={role}
                            onValueChange={(v) => setRole(v as UserRole)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {roleHint && (
                            <p className="text-xs text-muted-foreground">{roleHint}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="user-password">
                            {editing ? "New password (optional)" : "Temporary password"}
                        </Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    id="user-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={
                                        editing
                                            ? "Leave blank to keep current"
                                            : "Minimum 6 characters"
                                    }
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                title="Generate password"
                                onClick={() => {
                                    setPassword(randomPassword());
                                    setShowPassword(true);
                                }}
                            >
                                <Wand2 className="h-4 w-4" />
                            </Button>
                        </div>
                        {!passwordValid && password.length > 0 && (
                            <p className="text-xs text-danger">
                                Password must be at least 6 characters.
                            </p>
                        )}
                    </div>

                    {role === "student" && (
                        <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <UserCog className="h-4 w-4 text-primary" />
                                Assign instructor & course
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Optional. Pick an instructor to filter courses, then select
                                course(s) to enroll this student.
                            </p>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5">
                                    <UserCog className="h-3.5 w-3.5" />
                                    Instructor
                                </Label>
                                <Select
                                    value={selectedInstructorId || "all"}
                                    onValueChange={(v) => {
                                        setSelectedInstructorId(v === "all" ? "" : v);
                                        setSelectedCourseIds([]);
                                    }}
                                    disabled={loadingMeta}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All instructors" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All instructors</SelectItem>
                                        {instructors.map((ins) => (
                                            <SelectItem key={ins.id} value={ins.id}>
                                                {ins.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5">
                                    <BookOpen className="h-3.5 w-3.5" />
                                    Course(s)
                                </Label>
                                {loadingMeta ? (
                                    <p className="text-xs text-muted-foreground">
                                        Loading courses…
                                    </p>
                                ) : filteredCourses.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                                        {selectedInstructorId
                                            ? "Is instructor ke paas koi course nahi hai."
                                            : "Abhi koi course available nahi."}
                                    </p>
                                ) : (
                                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                                        {filteredCourses.map((c) => {
                                            const checked = selectedCourseIds.includes(c.id);
                                            return (
                                                <label
                                                    key={c.id}
                                                    className={cn(
                                                        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
                                                        checked && "bg-primary/10",
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="h-3.5 w-3.5 accent-primary"
                                                        checked={checked}
                                                        onChange={() => toggleCourse(c.id)}
                                                    />
                                                    <span className="min-w-0 flex-1 truncate">
                                                        {c.title}
                                                    </span>
                                                    {c.instructorName && (
                                                        <span className="shrink-0 text-xs text-muted-foreground">
                                                            {c.instructorName}
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                                {selectedCourseIds.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {selectedCourseIds.length} course selected
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                            {error}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!canSave}>
                        {saving
                            ? "Saving…"
                            : editing
                                ? "Save changes"
                                : "Create account"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

























// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { Eye, EyeOff, Wand2, BookOpen, UserCog } from "lucide-react";
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
// import {
//     createUser,
//     updateUser,
//     listUsers,
//     type ManagedUser,
//     type UserRole,
// } from "@/lib/api/users";
// import { listCourses, type Course } from "@/lib/api/courses";
// import { enrollStudent } from "@/lib/api/enrollments";
// import { errorMessage, cn } from "@/lib/utils";

// const ROLES: { value: UserRole; label: string; hint: string }[] = [
//     {
//         value: "student",
//         label: "Student",
//         hint: "Can view courses and submit coursework",
//     },
//     {
//         value: "instructor",
//         label: "Instructor",
//         hint: "Creates coursework and grades submissions",
//     },
//     {
//         value: "admin",
//         label: "Admin",
//         hint: "Full platform control",
//     },
// ];

// function randomPassword() {
//     const chars =
//         "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$";
//     return Array.from(
//         { length: 12 },
//         () => chars[Math.floor(Math.random() * chars.length)],
//     ).join("");
// }

// export function UserDialog({
//     open,
//     onOpenChange,
//     user,
//     defaultRole = "student",
//     onSaved,
// }: {
//     open: boolean;
//     onOpenChange: (open: boolean) => void;
//     user?: ManagedUser | null;
//     defaultRole?: UserRole;
//     onSaved: (user: ManagedUser, mode: "create" | "edit") => void;
// }) {
//     const editing = Boolean(user);

//     const [name, setName] = useState("");
//     const [email, setEmail] = useState("");
//     const [role, setRole] = useState<UserRole>(defaultRole);
//     const [password, setPassword] = useState("");
//     const [showPassword, setShowPassword] = useState(false);
//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState("");

//     const [courses, setCourses] = useState<Course[]>([]);
//     const [instructors, setInstructors] = useState<ManagedUser[]>([]);
//     const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
//     const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
//     const [loadingMeta, setLoadingMeta] = useState(false);

//     useEffect(() => {
//         if (!open) return;
//         setError("");
//         setShowPassword(false);
//         setPassword("");
//         setName(user?.name ?? "");
//         setEmail(user?.email ?? "");
//         setRole(user?.role ?? defaultRole);
//         setSelectedInstructorId("");
//         setSelectedCourseIds([]);
//     }, [open, user, defaultRole]);

//     useEffect(() => {
//         if (!open) return;
//         let cancelled = false;
//         setLoadingMeta(true);
//         Promise.all([listCourses(), listUsers({ role: "instructor" })])
//             .then(([cRes, iRes]) => {
//                 if (cancelled) return;
//                 setCourses(Array.isArray(cRes.data) ? cRes.data : []);
//                 setInstructors(Array.isArray(iRes.data) ? iRes.data : []);
//             })
//             .catch(() => {
//                 if (!cancelled) {
//                     setCourses([]);
//                     setInstructors([]);
//                 }
//             })
//             .finally(() => {
//                 if (!cancelled) setLoadingMeta(false);
//             });
//         return () => {
//             cancelled = true;
//         };
//     }, [open]);

//     const filteredCourses = useMemo(() => {
//         if (!selectedInstructorId || selectedInstructorId === "all") {
//             return courses;
//         }
//         return courses.filter((c) => c.instructorId === selectedInstructorId);
//     }, [courses, selectedInstructorId]);

//     const passwordValid = editing
//         ? password.length === 0 || password.length >= 6
//         : password.length >= 6;
//     const canSave =
//         name.trim().length >= 2 &&
//         email.includes("@") &&
//         passwordValid &&
//         !saving;

//     function toggleCourse(courseId: string) {
//         setSelectedCourseIds((prev) =>
//             prev.includes(courseId)
//                 ? prev.filter((id) => id !== courseId)
//                 : [...prev, courseId],
//         );
//     }

//     async function handleSave() {
//         if (!canSave) return;
//         setSaving(true);
//         setError("");
//         try {
//             if (editing && user) {
//                 const payload: {
//                     name: string;
//                     email: string;
//                     role: UserRole;
//                     password?: string;
//                 } = {
//                     name: name.trim(),
//                     email: email.trim().toLowerCase(),
//                     role,
//                 };
//                 if (password.length >= 6) payload.password = password;
//                 const res = await updateUser(user.id, payload);
//                 const saved = res.data;

//                 if (saved.role === "student" && selectedCourseIds.length > 0) {
//                     let enrolled = 0;
//                     for (const courseId of selectedCourseIds) {
//                         try {
//                             await enrollStudent(courseId, saved.id);
//                             enrolled += 1;
//                         } catch {
//                             /* already enrolled */
//                         }
//                     }
//                     toast.success(
//                         enrolled > 0
//                             ? `${saved.name} updated · ${enrolled} course(s) assigned`
//                             : `${saved.name} updated`,
//                     );
//                 } else {
//                     toast.success(`${saved.name} updated`);
//                 }

//                 onSaved(saved, "edit");
//                 onOpenChange(false);
//             } else {
//                 const res = await createUser({
//                     name: name.trim(),
//                     email: email.trim().toLowerCase(),
//                     password,
//                     role,
//                 });
//                 const saved = res.data;

//                 if (saved.role === "student" && selectedCourseIds.length > 0) {
//                     let enrolled = 0;
//                     for (const courseId of selectedCourseIds) {
//                         try {
//                             await enrollStudent(courseId, saved.id);
//                             enrolled += 1;
//                         } catch {
//                             /* ignore */
//                         }
//                     }
//                     toast.success(
//                         enrolled > 0
//                             ? `Account created · ${enrolled} course(s) assigned`
//                             : "Account created",
//                     );
//                 } else {
//                     toast.success("Account created");
//                 }

//                 onSaved(saved, "create");
//                 onOpenChange(false);
//             }
//         } catch (err: unknown) {
//             setError(errorMessage(err, "Could not save the account."));
//         } finally {
//             setSaving(false);
//         }
//     }

//     const roleHint = ROLES.find((r) => r.value === role)?.hint;

//     return (
//         <Dialog open={open} onOpenChange={onOpenChange}>
//             <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
//                 <DialogHeader>
//                     <DialogTitle>
//                         {editing ? "Edit account" : "Add new account"}
//                     </DialogTitle>
//                     <DialogDescription>
//                         {editing
//                             ? "Update account details. Leave password blank to keep the current one."
//                             : "Create a new instructor, student or admin account."}
//                     </DialogDescription>
//                 </DialogHeader>

//                 <div className="space-y-4 py-2">
//                     <div className="space-y-2">
//                         <Label htmlFor="user-name">Full name</Label>
//                         <Input
//                             id="user-name"
//                             value={name}
//                             onChange={(e) => setName(e.target.value)}
//                             placeholder="e.g. Ayesha Khan"
//                         />
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="user-email">Email</Label>
//                         <Input
//                             id="user-email"
//                             type="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             placeholder="name@smartlms.com"
//                         />
//                     </div>

//                     <div className="space-y-2">
//                         <Label>Role</Label>
//                         <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
//                             <SelectTrigger>
//                                 <SelectValue />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 {ROLES.map((r) => (
//                                     <SelectItem key={r.value} value={r.value}>
//                                         {r.label}
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                         {roleHint && (
//                             <p className="text-xs text-muted-foreground">{roleHint}</p>
//                         )}
//                     </div>

//                     <div className="space-y-2">
//                         <Label htmlFor="user-password">
//                             {editing ? "New password (optional)" : "Temporary password"}
//                         </Label>
//                         <div className="flex gap-2">
//                             <div className="relative flex-1">
//                                 <Input
//                                     id="user-password"
//                                     type={showPassword ? "text" : "password"}
//                                     value={password}
//                                     onChange={(e) => setPassword(e.target.value)}
//                                     placeholder={
//                                         editing
//                                             ? "Leave blank to keep current"
//                                             : "Minimum 6 characters"
//                                     }
//                                     className="pr-10"
//                                 />
//                                 <button
//                                     type="button"
//                                     onClick={() => setShowPassword((s) => !s)}
//                                     className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                                     aria-label={showPassword ? "Hide password" : "Show password"}
//                                 >
//                                     {showPassword ? (
//                                         <EyeOff className="h-4 w-4" />
//                                     ) : (
//                                         <Eye className="h-4 w-4" />
//                                     )}
//                                 </button>
//                             </div>
//                             <Button
//                                 type="button"
//                                 variant="outline"
//                                 size="icon"
//                                 title="Generate password"
//                                 onClick={() => {
//                                     setPassword(randomPassword());
//                                     setShowPassword(true);
//                                 }}
//                             >
//                                 <Wand2 className="h-4 w-4" />
//                             </Button>
//                         </div>
//                         {!passwordValid && password.length > 0 && (
//                             <p className="text-xs text-danger">
//                                 Password must be at least 6 characters.
//                             </p>
//                         )}
//                     </div>

//                     {role === "student" && (
//                         <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
//                             <div className="flex items-center gap-2 text-sm font-medium">
//                                 <UserCog className="h-4 w-4 text-primary" />
//                                 Assign instructor & course
//                             </div>
//                             <p className="text-xs text-muted-foreground">
//                                 Optional. Pick an instructor to filter courses, then select
//                                 course(s) to enroll this student.
//                             </p>

//                             <div className="space-y-2">
//                                 <Label className="flex items-center gap-1.5">
//                                     <UserCog className="h-3.5 w-3.5" />
//                                     Instructor
//                                 </Label>
//                                 <Select
//                                     value={selectedInstructorId || "all"}
//                                     onValueChange={(v) => {
//                                         setSelectedInstructorId(v === "all" ? "" : v);
//                                         setSelectedCourseIds([]);
//                                     }}
//                                     disabled={loadingMeta}
//                                 >
//                                     <SelectTrigger>
//                                         <SelectValue placeholder="All instructors" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         <SelectItem value="all">All instructors</SelectItem>
//                                         {instructors.map((ins) => (
//                                             <SelectItem key={ins.id} value={ins.id}>
//                                                 {ins.name}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             </div>

//                             <div className="space-y-2">
//                                 <Label className="flex items-center gap-1.5">
//                                     <BookOpen className="h-3.5 w-3.5" />
//                                     Course(s)
//                                 </Label>
//                                 {loadingMeta ? (
//                                     <p className="text-xs text-muted-foreground">
//                                         Loading courses…
//                                     </p>
//                                 ) : filteredCourses.length === 0 ? (
//                                     <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
//                                         {selectedInstructorId
//                                             ? "Is instructor ke paas koi course nahi hai."
//                                             : "Abhi koi course available nahi."}
//                                     </p>
//                                 ) : (
//                                     <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
//                                         {filteredCourses.map((c) => {
//                                             const checked = selectedCourseIds.includes(c.id);
//                                             return (
//                                                 <label
//                                                     key={c.id}
//                                                     className={cn(
//                                                         "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
//                                                         checked && "bg-primary/10",
//                                                     )}
//                                                 >
//                                                     <input
//                                                         type="checkbox"
//                                                         className="h-3.5 w-3.5 accent-primary"
//                                                         checked={checked}
//                                                         onChange={() => toggleCourse(c.id)}
//                                                     />
//                                                     <span className="min-w-0 flex-1 truncate">
//                                                         {c.title}
//                                                     </span>
//                                                     {c.instructorName && (
//                                                         <span className="shrink-0 text-xs text-muted-foreground">
//                                                             {c.instructorName}
//                                                         </span>
//                                                     )}
//                                                 </label>
//                                             );
//                                         })}
//                                     </div>
//                                 )}
//                                 {selectedCourseIds.length > 0 && (
//                                     <p className="text-xs text-muted-foreground">
//                                         {selectedCourseIds.length} course selected
//                                     </p>
//                                 )}
//                             </div>
//                         </div>
//                     )}

//                     {error && (
//                         <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
//                             {error}
//                         </p>
//                     )}
//                 </div>

//                 <DialogFooter>
//                     <Button
//                         variant="outline"
//                         onClick={() => onOpenChange(false)}
//                         disabled={saving}
//                     >
//                         Cancel
//                     </Button>
//                     <Button onClick={handleSave} disabled={!canSave}>
//                         {saving
//                             ? "Saving…"
//                             : editing
//                                 ? "Save changes"
//                                 : "Create account"}
//                     </Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     );
// }




