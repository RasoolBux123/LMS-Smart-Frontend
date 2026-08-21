import { apiFetch } from "./client";
import type { Notification } from "@/types";

export interface NotificationsResponse {
    success: boolean;
    data: Notification[];
    unreadCount: number;
    message?: string;
}

export async function fetchNotifications(
    opts: { limit?: number; unreadOnly?: boolean } = {},
): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.unreadOnly) params.set("unreadOnly", "true");
    const qs = params.toString();
    return apiFetch<NotificationsResponse>(
        `/notifications${qs ? `?${qs}` : ""}`,
    );
}

export async function markNotificationRead(id: string): Promise<void> {
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
    await apiFetch(`/notifications/read-all`, { method: "PATCH" });
}

// ✅ new — triggers AI risk-alert notifications for a course
export async function generateRiskAlerts(
    courseId: string,
): Promise<{ success: boolean; created: number }> {
    return apiFetch(
        `/notifications/generate-risk-alerts?course_id=${encodeURIComponent(courseId)}`,
        { method: "POST" },
    );
}