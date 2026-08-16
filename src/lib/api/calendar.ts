import { apiFetch, type ApiEnvelope } from "./client";

export type CalendarEventType =
  | "class"
  | "lab"
  | "review"
  | "office_hours"
  | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  courseId: string;
  courseTitle: string;
  instructorId: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  location: string;
  notes: string;
  createdAt?: string;
}

export interface CalendarEventPayload {
  title: string;
  type: CalendarEventType;
  courseId: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  location?: string;
  notes?: string;
}

export function listCalendarEvents(params: {
  courseId?: string;
  fromDate?: string;
  toDate?: string;
} = {}) {
  const qs = new URLSearchParams();
  if (params.courseId) qs.set("courseId", params.courseId);
  if (params.fromDate) qs.set("fromDate", params.fromDate);
  if (params.toDate) qs.set("toDate", params.toDate);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ApiEnvelope<CalendarEvent[]>>(`/calendar/events${suffix}`);
}

export function createCalendarEvent(payload: CalendarEventPayload) {
  return apiFetch<ApiEnvelope<CalendarEvent>>("/calendar/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCalendarEvent(
  id: string,
  payload: CalendarEventPayload,
) {
  return apiFetch<ApiEnvelope<CalendarEvent>>(`/calendar/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCalendarEvent(id: string) {
  return apiFetch<ApiEnvelope<null>>(`/calendar/events/${id}`, {
    method: "DELETE",
  });
}