import { apiFetch, type ApiEnvelope } from "./client";

export type CourseStatus = "active" | "archived" | "draft";

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  /** Comes from a backend join — when absent the UI shows "Unassigned". */
  instructorName?: string;
  /** Count from the enrollments collection — optional. */
  studentCount?: number;
  status: CourseStatus | string;
  /** Skills / learning outcomes shown as tags on the course page. */
  objectives?: string[];
  createdAt?: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
}

export interface Material {
  id: string;
  moduleId: string;
  title: string;
  type: "file" | "link" | "text";
  content: string;
  url?: string | null;
}

export interface ListCoursesParams {
  search?: string;
  status?: string;
  instructorId?: string;
}

export async function listCourses(params: ListCoursesParams = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.instructorId) qs.set("instructorId", params.instructorId);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ApiEnvelope<Course[]>>(`/courses${suffix}`);
}

/** The older `createCourse(title, description)` call still works. */
export async function createCourse(
  title: string,
  description: string,
  instructorId = "",
  objectives: string[] = [],
) {
  return apiFetch<ApiEnvelope<Course>>("/courses", {
    method: "POST",
    body: JSON.stringify({ title, description, instructorId, objectives }),
  });
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  instructorId?: string;
  status?: string;
  objectives?: string[];
}

export async function updateCourse(id: string, data: UpdateCoursePayload) {
  return apiFetch<ApiEnvelope<Course>>(`/courses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCourse(id: string) {
  return apiFetch<ApiEnvelope<null>>(`/courses/${id}`, { method: "DELETE" });
}

export async function getCourse(courseId: string) {
  return apiFetch<ApiEnvelope<Course>>(`/courses/${courseId}`);
}

export async function listModules(courseId: string) {
  return apiFetch<ApiEnvelope<Module[]>>(`/courses/${courseId}/modules`);
}

export async function createModule(courseId: string, title: string, orderIndex = 0) {
  return apiFetch<ApiEnvelope<Module>>(`/courses/${courseId}/modules`, {
    method: "POST",
    body: JSON.stringify({ title, orderIndex }),
  });
}

export async function listMaterials(moduleId: string) {
  return apiFetch<ApiEnvelope<Material[]>>(`/modules/${moduleId}/materials`);
}

export async function createMaterial(
  moduleId: string,
  data: { title: string; type: "file" | "link" | "text"; content?: string; url?: string },
) {
  return apiFetch<ApiEnvelope<Material>>(`/modules/${moduleId}/materials`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}








