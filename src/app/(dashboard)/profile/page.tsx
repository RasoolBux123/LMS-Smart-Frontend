"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Lock,
  Mail,
  MapPin,
  Phone,
  BookOpen,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { initials, cn, errorMessage } from "@/lib/utils";
import { changePasswordRequest } from "@/lib/api/auth";

const PROFILE_LOCK_KEY = "smartlms_profile_locked";

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  program: string;
  city: string;
  avatarUrl: string | null;
  locked: boolean;
};

function storageKey(userId: string) {
  return `${PROFILE_LOCK_KEY}_${userId}`;
}

function loadSaved(userId: string): ProfileData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as ProfileData;
  } catch {
    return null;
  }
}

function saveProfile(userId: string, data: ProfileData) {
  localStorage.setItem(storageKey(userId), JSON.stringify(data));
}

export default function ProfilePage() {
  const { user, role } = useCurrentUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [program, setProgram] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const saved = loadSaved(user.id);
    if (saved?.locked) {
      setFirstName(saved.firstName);
      setLastName(saved.lastName);
      setEmail(saved.email);
      setPhone(saved.phone);
      setProgram(saved.program);
      setCity(saved.city);
      setAvatarUrl(saved.avatarUrl);
      setLocked(true);
      return;
    }

    const parts = (user.name || "").trim().split(/\s+/);
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setEmail(user.email || "");
    setPhone((user as { phone?: string }).phone || "");
    setProgram(
      (user as { program?: string }).program || user.department || "",
    );
    setCity((user as { city?: string }).city || "");
    setAvatarUrl((user as { avatarUrl?: string }).avatarUrl || null);
    setLocked(false);
  }, [user]);

  const fullName = useMemo(() => {
    return [firstName, lastName].filter(Boolean).join(" ").toUpperCase();
  }, [firstName, lastName]);

  const regId =
    user?.rollNumber ||
    (user?.id ? `SLMS-${user.id.slice(-8).toUpperCase()}` : "—");

  function onPickImage(file: File | null) {
    if (locked) {
      toast.error("Profile is locked. Only password can be changed.");
      return;
    }
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be under 3 MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    toast.success("Profile photo selected");
  }

  function handleSaveProfile() {
    if (locked || !user?.id) return;
    if (!firstName.trim() || !email.trim()) {
      toast.error("First name and email are required");
      return;
    }
    setSaving(true);
    const data: ProfileData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      program: program.trim(),
      city: city.trim(),
      avatarUrl,
      locked: true,
    };
    saveProfile(user.id, data);
    setLocked(true);
    setSaving(false);
    toast.success("Profile saved and locked");
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Fill all password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    setSaving(true);
    try {
      await changePasswordRequest(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(errorMessage(err) || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
                  {initials(user.name || "U")}
                </AvatarFallback>
              </Avatar>
              {!locked && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                  title="Upload photo (optional)"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Name
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {fullName || user.name}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Registration ID
              </p>
              <p className="font-mono text-sm font-semibold text-primary">
                {regId}
              </p>
              {role && (
                <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                  {role}
                </span>
              )}
              {locked && (
                <span className="ml-2 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  Profile locked
                </span>
              )}
            </div>
          </div>

          <Button
            className="shrink-0"
            onClick={() => setShowPasswordForm((v) => !v)}
          >
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </Button>
        </div>
      </div>

      {/* Basic Info — locks after first save */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold">Basic Info</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>First Name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                disabled={locked}
                readOnly={locked}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Last Name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                disabled={locked}
                readOnly={locked}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={locked}
                readOnly={locked}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contact Number</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03XX-XXXXXXX"
                disabled={locked}
                readOnly={locked}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Program</Label>
            <div className="relative">
              <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="Your program"
                disabled={locked}
                readOnly={locked}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>City of training</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Karachi"
                disabled={locked}
                readOnly={locked}
              />
            </div>
          </div>
        </div>

        {!locked && (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
        {locked && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Profile is fixed after first save. Only password can be changed.
          </p>
        )}
      </div>

      {/* Change Password — always available */}
      {showPasswordForm && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold">Change Password</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 pr-10"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrent((v) => !v)}
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 pr-10"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNew((v) => !v)}
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 pr-10"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordForm(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving ? "Saving…" : "Change Password"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}












// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import {
//   Camera,
//   Lock,
//   Mail,
//   MapPin,
//   Phone,
//   BookOpen,
//   User,
//   Eye,
//   EyeOff,
// } from "lucide-react";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { useCurrentUser } from "@/hooks/use-current-user";
// import { initials, cn } from "@/lib/utils";

// const PROFILE_LOCK_KEY = "smartlms_profile_locked";

// type ProfileData = {
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   program: string;
//   city: string;
//   avatarUrl: string | null;
//   locked: boolean;
// };

// function storageKey(userId: string) {
//   return `${PROFILE_LOCK_KEY}_${userId}`;
// }

// function loadSaved(userId: string): ProfileData | null {
//   if (typeof window === "undefined") return null;
//   try {
//     const raw = localStorage.getItem(storageKey(userId));
//     if (!raw) return null;
//     return JSON.parse(raw) as ProfileData;
//   } catch {
//     return null;
//   }
// }

// function saveProfile(userId: string, data: ProfileData) {
//   localStorage.setItem(storageKey(userId), JSON.stringify(data));
// }

// export default function ProfilePage() {
//   const { user, role } = useCurrentUser();
//   const fileRef = useRef<HTMLInputElement>(null);

//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [program, setProgram] = useState("");
//   const [city, setCity] = useState("");
//   const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
//   const [locked, setLocked] = useState(false);

//   const [showPasswordForm, setShowPasswordForm] = useState(false);
//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showCurrent, setShowCurrent] = useState(false);
//   const [showNew, setShowNew] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     if (!user?.id) return;

//     const saved = loadSaved(user.id);
//     if (saved?.locked) {
//       setFirstName(saved.firstName);
//       setLastName(saved.lastName);
//       setEmail(saved.email);
//       setPhone(saved.phone);
//       setProgram(saved.program);
//       setCity(saved.city);
//       setAvatarUrl(saved.avatarUrl);
//       setLocked(true);
//       return;
//     }

//     const parts = (user.name || "").trim().split(/\s+/);
//     setFirstName(parts[0] || "");
//     setLastName(parts.slice(1).join(" ") || "");
//     setEmail(user.email || "");
//     setPhone((user as { phone?: string }).phone || "");
//     setProgram(
//       (user as { program?: string }).program || user.department || "",
//     );
//     setCity((user as { city?: string }).city || "");
//     setAvatarUrl((user as { avatarUrl?: string }).avatarUrl || null);
//     setLocked(false);
//   }, [user]);

//   const fullName = useMemo(() => {
//     return [firstName, lastName].filter(Boolean).join(" ").toUpperCase();
//   }, [firstName, lastName]);

//   const regId =
//     user?.rollNumber ||
//     (user?.id ? `SLMS-${user.id.slice(-8).toUpperCase()}` : "—");

//   function onPickImage(file: File | null) {
//     if (locked) {
//       toast.error("Profile is locked. Only password can be changed.");
//       return;
//     }
//     if (!file) return;
//     if (!file.type.startsWith("image/")) {
//       toast.error("Please select an image file");
//       return;
//     }
//     if (file.size > 3 * 1024 * 1024) {
//       toast.error("Image must be under 3 MB");
//       return;
//     }
//     const url = URL.createObjectURL(file);
//     setAvatarUrl(url);
//     toast.success("Profile photo selected");
//   }

//   function handleSaveProfile() {
//     if (locked || !user?.id) return;
//     if (!firstName.trim() || !email.trim()) {
//       toast.error("First name and email are required");
//       return;
//     }
//     setSaving(true);
//     const data: ProfileData = {
//       firstName: firstName.trim(),
//       lastName: lastName.trim(),
//       email: email.trim().toLowerCase(),
//       phone: phone.trim(),
//       program: program.trim(),
//       city: city.trim(),
//       avatarUrl,
//       locked: true,
//     };
//     saveProfile(user.id, data);
//     setLocked(true);
//     setSaving(false);
//     toast.success("Profile saved and locked");
//   }

//   function handleChangePassword() {
//     if (!currentPassword || !newPassword || !confirmPassword) {
//       toast.error("Fill all password fields");
//       return;
//     }
//     if (newPassword.length < 6) {
//       toast.error("New password must be at least 6 characters");
//       return;
//     }
//     if (newPassword !== confirmPassword) {
//       toast.error("New password and confirm password do not match");
//       return;
//     }
//     setSaving(true);
//     setTimeout(() => {
//       setSaving(false);
//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmPassword("");
//       setShowPasswordForm(false);
//       toast.success("Password changed successfully");
//     }, 400);
//   }

//   if (!user) return null;

//   return (
//     <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
//       {/* Header */}
//       <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
//         <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
//           <div className="flex items-center gap-4">
//             <div className="relative">
//               <Avatar className="h-24 w-24 border-4 border-primary/20">
//                 {avatarUrl ? (
//                   <AvatarImage src={avatarUrl} alt={user.name} />
//                 ) : null}
//                 <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
//                   {initials(user.name || "U")}
//                 </AvatarFallback>
//               </Avatar>
//               {!locked && (
//                 <button
//                   type="button"
//                   onClick={() => fileRef.current?.click()}
//                   className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
//                   title="Upload photo (optional)"
//                 >
//                   <Camera className="h-4 w-4" />
//                 </button>
//               )}
//               <input
//                 ref={fileRef}
//                 type="file"
//                 accept="image/*"
//                 className="hidden"
//                 onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
//               />
//             </div>

//             <div>
//               <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
//                 Name
//               </p>
//               <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
//                 {fullName || user.name}
//               </h1>
//               <p className="mt-1 text-xs text-muted-foreground">
//                 Registration ID
//               </p>
//               <p className="font-mono text-sm font-semibold text-primary">
//                 {regId}
//               </p>
//               {role && (
//                 <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
//                   {role}
//                 </span>
//               )}
//               {locked && (
//                 <span className="ml-2 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
//                   Profile locked
//                 </span>
//               )}
//             </div>
//           </div>

//           <Button
//             className="shrink-0"
//             onClick={() => setShowPasswordForm((v) => !v)}
//           >
//             <Lock className="mr-2 h-4 w-4" />
//             Change Password
//           </Button>
//         </div>
//       </div>

//       {/* Basic Info — locks after first save */}
//       <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
//         <h2 className="mb-5 text-base font-semibold">Basic Info</h2>

//         <div className="grid gap-4 sm:grid-cols-2">
//           <div className="space-y-2">
//             <Label>First Name</Label>
//             <div className="relative">
//               <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <Input
//                 className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
//                 value={firstName}
//                 onChange={(e) => setFirstName(e.target.value)}
//                 placeholder="First name"
//                 disabled={locked}
//                 readOnly={locked}
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label>Last Name</Label>
//             <div className="relative">
//               <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <Input
//                 className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
//                 value={lastName}
//                 onChange={(e) => setLastName(e.target.value)}
//                 placeholder="Last name"
//                 disabled={locked}
//                 readOnly={locked}
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label>Email address</Label>
//             <div className="relative">
//               <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <Input
//                 className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="email@example.com"
//                 disabled={locked}
//                 readOnly={locked}
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label>Contact Number</Label>
//             <div className="relative">
//               <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <Input
//                 className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value)}
//                 placeholder="03XX-XXXXXXX"
//                 disabled={locked}
//                 readOnly={locked}
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label>Program</Label>
//             <div className="relative">
//               <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <Input
//                 className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
//                 value={program}
//                 onChange={(e) => setProgram(e.target.value)}
//                 placeholder="Your program"
//                 disabled={locked}
//                 readOnly={locked}
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label>City of training</Label>
//             <div className="relative">
//               <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <Input
//                 className={cn("pl-9", locked && "cursor-not-allowed opacity-80")}
//                 value={city}
//                 onChange={(e) => setCity(e.target.value)}
//                 placeholder="e.g. Karachi"
//                 disabled={locked}
//                 readOnly={locked}
//               />
//             </div>
//           </div>
//         </div>

//         {!locked && (
//           <div className="mt-6 flex justify-end">
//             <Button onClick={handleSaveProfile} disabled={saving}>
//               {saving ? "Saving…" : "Save changes"}
//             </Button>
//           </div>
//         )}
//         {locked && (
//           <p className="mt-4 text-center text-xs text-muted-foreground">
//             Profile is fixed after first save. Only password can be changed.
//           </p>
//         )}
//       </div>

//       {/* Change Password — always available */}
//       {showPasswordForm && (
//         <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
//           <h2 className="mb-5 text-base font-semibold">Change Password</h2>

//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label>Current Password</Label>
//               <div className="relative">
//                 <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                 <Input
//                   className="pl-9 pr-10"
//                   type={showCurrent ? "text" : "password"}
//                   value={currentPassword}
//                   onChange={(e) => setCurrentPassword(e.target.value)}
//                   placeholder="Enter your current password"
//                 />
//                 <button
//                   type="button"
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                   onClick={() => setShowCurrent((v) => !v)}
//                 >
//                   {showCurrent ? (
//                     <EyeOff className="h-4 w-4" />
//                   ) : (
//                     <Eye className="h-4 w-4" />
//                   )}
//                 </button>
//               </div>
//             </div>

//             <div className="grid gap-4 sm:grid-cols-2">
//               <div className="space-y-2">
//                 <Label>New Password</Label>
//                 <div className="relative">
//                   <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                   <Input
//                     className="pl-9 pr-10"
//                     type={showNew ? "text" : "password"}
//                     value={newPassword}
//                     onChange={(e) => setNewPassword(e.target.value)}
//                     placeholder="Enter your new password"
//                   />
//                   <button
//                     type="button"
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                     onClick={() => setShowNew((v) => !v)}
//                   >
//                     {showNew ? (
//                       <EyeOff className="h-4 w-4" />
//                     ) : (
//                       <Eye className="h-4 w-4" />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label>Confirm Password</Label>
//                 <div className="relative">
//                   <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                   <Input
//                     className="pl-9 pr-10"
//                     type={showConfirm ? "text" : "password"}
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     placeholder="Confirm your new password"
//                   />
//                   <button
//                     type="button"
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                     onClick={() => setShowConfirm((v) => !v)}
//                   >
//                     {showConfirm ? (
//                       <EyeOff className="h-4 w-4" />
//                     ) : (
//                       <Eye className="h-4 w-4" />
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="mt-6 flex justify-end gap-2">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setShowPasswordForm(false);
//                 setCurrentPassword("");
//                 setNewPassword("");
//                 setConfirmPassword("");
//               }}
//             >
//               Cancel
//             </Button>
//             <Button onClick={handleChangePassword} disabled={saving}>
//               {saving ? "Saving…" : "Change Password"}
//             </Button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




