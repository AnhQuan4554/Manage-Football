import type { PushSubscriptionInput } from "./types";

// Browser-supplied endpoints are untrusted: prevent server-side request forgery.
export function validateSubscription(value: unknown): PushSubscriptionInput {
  const sub = value as Partial<PushSubscriptionInput> | null;
  if (!sub || typeof sub.endpoint !== "string" || sub.endpoint.length > 2048) {
    throw new Error("Đăng ký nhận thông báo không hợp lệ.");
  }
  const url = new URL(sub.endpoint);
  const allowed =
    url.hostname === "web.push.apple.com" ||
    url.hostname.endsWith(".push.apple.com") ||
    url.hostname === "fcm.googleapis.com" ||
    url.hostname === "updates.push.services.mozilla.com";
  if (
    !allowed ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.hash
  ) {
    throw new Error("Dịch vụ Push của trình duyệt chưa được hỗ trợ.");
  }
  if (
    !sub.keys ||
    !/^[A-Za-z0-9_-]{87}$/.test(sub.keys.p256dh ?? "") ||
    !/^[A-Za-z0-9_-]{22}$/.test(sub.keys.auth ?? "")
  ) {
    throw new Error("Khóa đăng ký nhận thông báo không hợp lệ.");
  }
  return { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
}

export function vietnamSchedule(now = new Date()) {
  const local = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const day = local.toISOString().slice(0, 10);
  const start = new Date(day + "T00:00:00+07:00");
  const nextMonday = new Date(start.getTime() + ((8 - local.getUTCDay()) % 7 || 7) * 86400000);
  return {
    day,
    weekday: local.getUTCDay(),
    due: local.getUTCHours() === 17,
    start: start.toISOString(),
    end: new Date(start.getTime() + 86400000).toISOString(),
    nextWeekStart: nextMonday.toISOString(),
    nextWeekEnd: new Date(nextMonday.getTime() + 7 * 86400000).toISOString(),
  };
}

export function matchNotificationText(match: {
  match_date_time: string;
  venue_name: string;
  opponent_name: string;
}) {
  const date = new Date(match.match_date_time);
  const time = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  const day = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  return (time + " " + day + " · Sân " + match.venue_name + " · với " + match.opponent_name).slice(
    0,
    500,
  );
}
