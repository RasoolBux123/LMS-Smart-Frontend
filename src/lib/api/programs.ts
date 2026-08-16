import { apiFetch, type ApiEnvelope } from "./client";
import { seedPrograms } from "@/data/programs";
import type { Program, ProgramPayload } from "@/types/program";

export type { Program, ProgramPayload };

export interface ListProgramsParams {
  search?: string;
  status?: string;
  level?: string;
}

/**
 * The Programs backend may not be deployed yet in every environment, so
 * read operations degrade to the seed catalogue instead of showing an
 * error screen. Writes still surface real failures — silently pretending
 * a create succeeded would be worse than telling the admin it didn't.
 */
async function withFallback<T>(
  request: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  try {
    return await request();
  } catch {
    return fallback();
  }
}

function filterSeed(params: ListProgramsParams): Program[] {
  const term = params.search?.trim().toLowerCase();

  return seedPrograms.filter((program) => {
    if (params.status && params.status !== "all") {
      if (program.status !== params.status) return false;
    }
    if (params.level && params.level !== "all") {
      if (program.level !== params.level) return false;
    }
    if (term) {
      const haystack =
        `${program.title} ${program.code} ${program.description}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

export async function listPrograms(
  params: ListProgramsParams = {},
): Promise<ApiEnvelope<Program[]>> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.level && params.level !== "all") qs.set("level", params.level);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  return withFallback(
    () => apiFetch<ApiEnvelope<Program[]>>(`/programs${suffix}`),
    () => ({ data: filterSeed(params) }),
  );
}

export async function getProgram(id: string): Promise<ApiEnvelope<Program>> {
  return withFallback(
    () => apiFetch<ApiEnvelope<Program>>(`/programs/${id}`),
    () => {
      const match = seedPrograms.find((p) => p.id === id);
      if (!match) throw new Error("Program not found");
      return { data: match };
    },
  );
}

export async function createProgram(payload: ProgramPayload) {
  return apiFetch<ApiEnvelope<Program>>("/programs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProgram(
  id: string,
  payload: Partial<ProgramPayload>,
) {
  return apiFetch<ApiEnvelope<Program>>(`/programs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProgram(id: string) {
  return apiFetch<ApiEnvelope<null>>(`/programs/${id}`, { method: "DELETE" });
}

/** Courses that belong to a program. */
export async function listProgramCourses(id: string) {
  return withFallback(
    () =>
      apiFetch<ApiEnvelope<{ id: string; title: string; status: string }[]>>(
        `/programs/${id}/courses`,
      ),
    () => ({ data: [] }),
  );
}
