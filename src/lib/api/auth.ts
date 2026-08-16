import { apiFetch } from "./client";
import type { Role } from "@/types";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: Role;
  status?: string;
}

export interface LoginResponse {
  /** Normalized fields used by AuthContext */
  token: string;
  access_token: string;
  user: AuthUser;
}

/**
 * Backend returns `{ success, data: { user, access_token }, message }`.
 * Normalize to a flat shape so AuthContext can read `token` + `user`.
 */
export async function loginRequest(email: string, password: string) {
  const raw = await apiFetch<{
    success?: boolean;
    data?: { user: AuthUser; access_token?: string; token?: string };
    user?: AuthUser;
    access_token?: string;
    token?: string;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const data = raw.data ?? raw;
  const user = data.user ?? raw.user;
  const token =
    (data as { access_token?: string }).access_token ??
    (data as { token?: string }).token ??
    raw.access_token ??
    raw.token;

  if (!user || !token) {
    throw new Error("Invalid login response from server");
  }

  return {
    token,
    access_token: token,
    user: {
      ...user,
      id: user.id,
    },
  } satisfies LoginResponse;
}

export async function meRequest() {
  const raw = await apiFetch<{
    success?: boolean;
    data?: AuthUser;
  } & AuthUser>("/auth/me");

  if (raw && typeof raw === "object" && "data" in raw && raw.data) {
    return raw.data;
  }
  return raw as AuthUser;
}
export async function changePasswordRequest(
  currentPassword: string,
  newPassword: string,
) {
  return apiFetch<{ success: boolean; message?: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}
