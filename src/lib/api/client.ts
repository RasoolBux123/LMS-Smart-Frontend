/**
 * Shared fetch wrapper. The token lives in localStorage (see AuthContext),
 * so the Authorization header is attached on every request.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      // Never set Content-Type on FormData — the browser adds the boundary itself
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...authHeader(),
      ...init.headers,
    },
  });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // The body was not JSON — ignore it
    }

    const parsed = body as { message?: string; detail?: string } | null;
    const message =
      parsed?.detail ?? // FastAPI HTTPException reports under this key
      parsed?.message ??
      `Request failed (${res.status})`;

    throw new ApiError(message, res.status, body);
  }

  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

/**
 * For backend responses wrapped in a `{ data: ... }` envelope.
 * The legacy admin, gradebook, grades and courses pages all expect this shape.
 */
export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}
