import { apiFetch, type ApiEnvelope } from "./client";

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  enrolledAt?: string;
  student?: { id: string; name: string; email: string };
  course?: {
    id: string;
    title: string;
    instructorId?: string;
    status?: string;
  };
}

export interface InstructorStudent {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
  courses: { id: string; title: string }[];
  enrollmentCount: number;
}

export async function enrollStudent(courseId: string, userId: string) {
  return apiFetch<ApiEnvelope<Enrollment>>("/enrollments", {
    method: "POST",
    body: JSON.stringify({ courseId, userId }),
  });
}

export async function listCourseEnrollments(courseId: string) {
  return apiFetch<ApiEnvelope<Enrollment[]>>(
    `/enrollments/course/${courseId}`,
  );
}

export async function listUserEnrollments(userId: string) {
  return apiFetch<ApiEnvelope<Enrollment[]>>(
    `/enrollments/user/${userId}`,
  );
}

export async function listMyStudents() {
  return apiFetch<ApiEnvelope<InstructorStudent[]>>("/enrollments/my-students");
}

export async function unenrollStudent(enrollmentId: string) {
  return apiFetch<ApiEnvelope<null>>(`/enrollments/${enrollmentId}`, {
    method: "DELETE",
  });
}








// import { apiFetch, type ApiEnvelope } from "./client";

// export interface Enrollment {
//   id: string;
//   userId: string;
//   courseId: string;
//   status: string;
//   enrolledAt?: string;
//   student?: { id: string; name: string; email: string };
//   course?: {
//     id: string;
//     title: string;
//     instructorId?: string;
//     status?: string;
//   };
// }

// export async function enrollStudent(courseId: string, userId: string) {
//   return apiFetch<ApiEnvelope<Enrollment>>("/enrollments", {
//     method: "POST",
//     body: JSON.stringify({ courseId, userId }),
//   });
// }

// export async function listCourseEnrollments(courseId: string) {
//   return apiFetch<ApiEnvelope<Enrollment[]>>(
//     `/enrollments/course/${courseId}`,
//   );
// }

// export async function listUserEnrollments(userId: string) {
//   return apiFetch<ApiEnvelope<Enrollment[]>>(
//     `/enrollments/user/${userId}`,
//   );
// }

// export async function unenrollStudent(enrollmentId: string) {
//   return apiFetch<ApiEnvelope<null>>(`/enrollments/${enrollmentId}`, {
//     method: "DELETE",
//   });
// }






