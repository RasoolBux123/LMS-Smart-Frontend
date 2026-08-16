import { apiFetch, type ApiEnvelope } from "./client";

export interface CredentialRow {
    id: string;
    userId: string;
    name: string;
    email: string;
    password: string;
    role: "instructor" | "student" | string;
    createdAt?: string;
    updatedAt?: string;
}

export async function listCredentials(params?: {
    role?: "instructor" | "student";
    search?: string;
}) {
    const qs = new URLSearchParams();
    if (params?.role) qs.set("role", params.role);
    if (params?.search) qs.set("search", params.search);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<ApiEnvelope<CredentialRow[]>>(`/credentials${suffix}`);
}

export async function deleteCredential(id: string) {
    return apiFetch<ApiEnvelope<null>>(`/credentials/${id}`, {
        method: "DELETE",
    });
}