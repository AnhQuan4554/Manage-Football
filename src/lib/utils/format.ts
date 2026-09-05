export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function getVietnamDateKey(value: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(date: string, time?: string) {
  const value = new Date(`${date}T${time ?? "00:00"}:00+07:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: time ? "2-digit" : undefined,
    minute: time ? "2-digit" : undefined,
  }).format(value);
}

export function formatDateShort(date: string) {
  const value = new Date(`${date}T00:00:00+07:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
  }).format(value);
}

export function weekdayShort(date: string) {
  const value = new Date(`${date}T00:00:00+07:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
  }).format(value);
}

export function formatMoneyInput(value: string | number | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseMoneyInput(value: string | number | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function normalizeMoneyInput(value: string | number | null | undefined) {
  const amount = parseMoneyInput(value);
  return amount ? formatMoneyInput(amount) : "";
}
