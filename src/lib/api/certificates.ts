import { apiFetch, ApiError, type ApiEnvelope } from "./client";

/** Kept in step with app/api/certificates.py on the backend. */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type CertificateStatus = "issued" | "revoked";
export type CertificateTemplate = "classic" | "modern" | "elegant";

export interface Certificate {
  id: string;
  serial: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  programId: string;
  programTitle: string;
  instructorName: string;
  template: CertificateTemplate;
  percentage: number;
  grade: string;
  remark: string;
  totalMarks: number;
  obtainedMarks: number;
  durationWeeks: number;
  status: CertificateStatus;
  completedAt: string | null;
  issuedAt: string | null;
  issuedBy: string;
  issuedByName: string;
  revokedAt: string | null;
  revokedReason: string;
  fileUrl: string;
}

export interface EligibleStudent {
  studentId: string;
  name: string;
  email: string;
  percentage: number;
  grade: string;
  remark: string;
  gradedItems: number;
  totalItems: number;
  certificateId: string | null;
  certificateSerial: string | null;
  certificateStatus: CertificateStatus | null;
}

export interface Eligibility {
  courseId: string;
  courseTitle: string;
  instructorName: string;
  programTitle: string;
  students: EligibleStudent[];
}

/** What an outsider sees after scanning the QR code. No account needed. */
export interface CertificateVerification {
  serial: string;
  valid: boolean;
  status: CertificateStatus;
  studentName: string;
  courseTitle: string;
  programTitle: string;
  instructorName: string;
  grade: string;
  percentage: number;
  issuedAt: string | null;
  completedAt: string | null;
  revokedAt: string | null;
}

export interface ListCertificatesParams {
  studentId?: string;
  courseId?: string;
  status?: CertificateStatus | "all";
  search?: string;
}

function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  const out = search.toString();
  return out ? `?${out}` : "";
}

/* ---------------------------------- read --------------------------------- */

export async function listCertificates(params: ListCertificatesParams = {}) {
  return apiFetch<ApiEnvelope<Certificate[]>>(`/certificates${qs(params)}`);
}

export async function listMyCertificates() {
  return apiFetch<ApiEnvelope<Certificate[]>>("/certificates/me");
}

export async function getCertificate(id: string) {
  return apiFetch<ApiEnvelope<Certificate>>(`/certificates/${id}`);
}

/** Everyone enrolled on the course, with the score their grade comes from. */
export async function getEligibleStudents(courseId: string) {
  return apiFetch<ApiEnvelope<Eligibility>>(
    `/certificates/eligible${qs({ courseId })}`,
  );
}

export async function verifyCertificate(serial: string) {
  return apiFetch<ApiEnvelope<CertificateVerification>>(
    `/certificates/verify/${encodeURIComponent(serial)}`,
  );
}

/* --------------------------------- write --------------------------------- */

export async function issueCertificate(payload: {
  studentId: string;
  courseId: string;
  template?: CertificateTemplate;
  percentageOverride?: number;
}) {
  return apiFetch<ApiEnvelope<Certificate>>("/certificates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface BulkIssueResult {
  issued: Certificate[];
  skipped: { name: string; reason: string }[];
}

export async function bulkIssueCertificates(payload: {
  courseId: string;
  studentIds?: string[];
  template?: CertificateTemplate;
  overwrite?: boolean;
}) {
  return apiFetch<ApiEnvelope<BulkIssueResult> & { message?: string }>(
    "/certificates/bulk",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function revokeCertificate(id: string, reason = "") {
  return apiFetch<ApiEnvelope<Certificate>>(`/certificates/${id}/revoke`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function restoreCertificate(id: string) {
  return apiFetch<ApiEnvelope<Certificate>>(`/certificates/${id}/restore`, {
    method: "PATCH",
  });
}

export async function deleteCertificate(id: string) {
  return apiFetch<ApiEnvelope<null>>(`/certificates/${id}`, { method: "DELETE" });
}

export async function uploadCertificateLogo(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ApiEnvelope<{ url: string }>>("/certificates/branding/logo", {
    method: "POST",
    body: form,
  });
}

/* -------------------------------- download -------------------------------- */

/**
 * The PDF sits behind the same auth as everything else, so it can't be a plain
 * <a href>. Pull it as a blob and hand the browser a file.
 */
export async function downloadCertificate(cert: Pick<Certificate, "id" | "serial" | "studentName">) {
  const token =
    typeof window === "undefined" ? null : window.localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/certificates/${cert.id}/download`, {
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
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${cert.studentName.replace(/\s+/g, "_")}_${cert.serial}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Public link printed on the certificate — safe to share. */
export function verificationLink(serial: string) {
  const origin =
    typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/verify/${serial}`;
}