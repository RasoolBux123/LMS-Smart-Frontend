import { apiFetch, ApiError, type ApiEnvelope } from "./client";

/** Course-level materials — see backend/app/api/routes/materials.py */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type MaterialType = "file" | "link" | "text";

export interface Material {
  id: string;
  courseId: string;
  courseTitle?: string;
  moduleId: string;
  title: string;
  description: string;
  type: MaterialType;
  /** "/uploads/materials/..." for a file, the raw href for a link. */
  url: string;
  fileName: string;
  fileSize: number;
  extension: string;
  uploadedBy: string;
  uploadedByName: string;
  downloadCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Omit courseId to get everything the caller is allowed to see. */
export async function listMaterials(courseId?: string) {
  const suffix = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return apiFetch<ApiEnvelope<Material[]>>(`/materials${suffix}`);
}

export async function getMaterial(id: string) {
  return apiFetch<ApiEnvelope<Material>>(`/materials/${id}`);
}

export interface CreateMaterialInput {
  courseId: string;
  title?: string;
  description?: string;
  /** Any type — the backend applies no extension whitelist. */
  file?: File | null;
  /** For a link material instead of a file. */
  url?: string;
  moduleId?: string;
}

export async function createMaterial(input: CreateMaterialInput) {
  const form = new FormData();
  form.append("courseId", input.courseId);
  form.append("title", input.title ?? "");
  form.append("description", input.description ?? "");
  form.append("moduleId", input.moduleId ?? "");

  if (input.file) {
    form.append("type", "file");
    form.append("file", input.file);
  } else if (input.url?.trim()) {
    form.append("type", "link");
    form.append("url", input.url.trim());
  } else {
    form.append("type", "text");
  }

  // Content-Type is left alone so the browser sets the multipart boundary.
  return apiFetch<ApiEnvelope<Material>>("/materials", {
    method: "POST",
    body: form,
  });
}

export async function updateMaterial(
  id: string,
  data: { title?: string; description?: string },
) {
  const form = new FormData();
  if (data.title !== undefined) form.append("title", data.title);
  if (data.description !== undefined) form.append("description", data.description);

  return apiFetch<ApiEnvelope<Material>>(`/materials/${id}`, {
    method: "PATCH",
    body: form,
  });
}

export async function deleteMaterial(id: string) {
  return apiFetch<ApiEnvelope<null>>(`/materials/${id}`, { method: "DELETE" });
}

/** Files sit behind auth, so they're pulled as a blob rather than a plain link. */
export async function downloadMaterial(material: Material) {
  if (material.type === "link") {
    window.open(material.url, "_blank", "noopener,noreferrer");
    return;
  }

  const token =
    typeof window === "undefined" ? null : window.localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/materials/${material.id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let detail = `Download failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      /* not JSON */
    }
    throw new ApiError(detail, res.status);
  }

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = material.fileName || material.title;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

export function formatFileSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}