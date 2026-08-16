// "use client";

// import { useState } from "react";
// import { createUser, type ManagedUser } from "../../../lib/api/users";
// import { errorMessage } from "@/lib/utils";

// type Role = "instructor" | "student";

// const ACCENTS: Record<Role, string> = { instructor: "#6366F1", student: "#14B8A6" };

// export default function AddUserDrawer({
//   role,
//   open,
//   onClose,
//   onCreated,
// }: {
//   role: Role;
//   open: boolean;
//   onClose: () => void;
//   onCreated: (user: ManagedUser) => void;
// }) {
//   const [form, setForm] = useState({ name: "", email: "", password: "" });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const accent = ACCENTS[role];

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       const res = await createUser({ ...form, role });
//       onCreated(res.data);
//       setForm({ name: "", email: "", password: "" });
//       onClose();
//     } catch (err: unknown) {
//       setError(errorMessage(err, "Could not create user"));
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div
//       className={`fixed inset-0 z-50 transition-opacity ${
//         open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
//       }`}
//     >
//       <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
//       <div
//         className={`absolute right-0 top-0 h-full w-full max-w-sm bg-card shadow-xl transition-transform duration-300 ${
//           open ? "translate-x-0" : "translate-x-full"
//         }`}
//       >
//         <div className="px-6 py-5 border-b border-border">
//           <p className="text-xs font-medium uppercase tracking-wide" style={{ color: accent }}>
//             Add {role}
//           </p>
//           <h2 className="font-display text-lg font-semibold text-foreground mt-1">
//             New {role === "instructor" ? "instructor" : "student"} account
//           </h2>
//         </div>

//         <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
//           {error && (
//             <p className="text-sm rounded-md bg-red-50 text-red-600 px-3 py-2">{error}</p>
//           )}
//           <div>
//             <label className="text-xs font-medium text-muted-foreground">Full name</label>
//             <input
//               value={form.name}
//               onChange={(e) => setForm({ ...form, name: e.target.value })}
//               required
//               className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none"
//             />
//           </div>
//           <div>
//             <label className="text-xs font-medium text-muted-foreground">Email</label>
//             <input
//               type="email"
//               value={form.email}
//               onChange={(e) => setForm({ ...form, email: e.target.value })}
//               required
//               className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none"
//             />
//           </div>
//           <div>
//             <label className="text-xs font-medium text-muted-foreground">Temporary password</label>
//             <input
//               type="password"
//               value={form.password}
//               onChange={(e) => setForm({ ...form, password: e.target.value })}
//               required
//               minLength={6}
//               className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none"
//             />
//           </div>

//           <div className="flex gap-3 pt-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-60"
//               style={{ backgroundColor: accent }}
//             >
//               {loading ? "Adding..." : "Add account"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }