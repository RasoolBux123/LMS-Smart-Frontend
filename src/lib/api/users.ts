import { apiFetch, type ApiEnvelope } from "./client";

export type UserRole = "admin" | "instructor" | "student";
export type UserStatus = "active" | "suspended";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
}

export interface ListUsersParams {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

/** Accepts both the older `listUsers("student")` call and the newer object form. */
export async function listUsers(params: UserRole | ListUsersParams = {}) {
  const p: ListUsersParams = typeof params === "string" ? { role: params } : params;

  const qs = new URLSearchParams();
  if (p.role) qs.set("role", p.role);
  if (p.status) qs.set("status", p.status);
  if (p.search) qs.set("search", p.search);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ApiEnvelope<ManagedUser[]>>(`/users${suffix}`);
}

export async function getUser(id: string) {
  return apiFetch<ApiEnvelope<ManagedUser>>(`/users/${id}`);
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export async function createUser(data: CreateUserPayload) {
  return apiFetch<ApiEnvelope<ManagedUser>>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
}

export async function updateUser(id: string, data: UpdateUserPayload) {
  return apiFetch<ApiEnvelope<ManagedUser>>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string) {
  return apiFetch<ApiEnvelope<null>>(`/users/${id}`, { method: "DELETE" });
}




// import { apiFetch, type ApiEnvelope } from "./client";

// export interface ManagedUser {
//   id: string;
//   name: string;
//   email: string;
//   role: "instructor" | "student";
//   status: string;
// }

// export async function listUsers(role?: "instructor" | "student") {
//   const query = role ? `?role=${role}` : "";
//   return apiFetch<ApiEnvelope<ManagedUser[]>>(`/users${query}`);
// }

// export async function createUser(data: {
//   name: string;
//   email: string;
//   password: string;
//   role: "instructor" | "student";
// }) {
//   return apiFetch<ApiEnvelope<ManagedUser>>("/users", {
//     method: "POST",
//     body: JSON.stringify(data),
//   });
// }