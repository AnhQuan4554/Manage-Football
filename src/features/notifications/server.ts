import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { validateSubscription } from "./utils";
import type { PushDeviceStatus, PushSubscriptionInput } from "./types";

export function pushEnabled() {
  return (
    process.env.PWA_PUSH_ENABLED === "true" &&
    (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production")
  );
}

export function pushDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("PUSH_NOT_CONFIGURED");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }),
    },
  });
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function readDeviceToken(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("INVALID_DEVICE");
  return token;
}

export function checkCronSecret(request: Request) {
  const secret = process.env.PWA_CRON_SECRET;
  if (!secret || secret.length < 32) return false;
  const actual = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from("Bearer " + secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function readPushBody(request: Request) {
  if (!pushEnabled()) throw new Error("PUSH_DISABLED");
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new Error("INVALID_ORIGIN");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("INVALID_BODY");
  // Limit even when Content-Length is missing/chunked.
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_BODY");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      throw new Error("INVALID_BODY");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

export async function getDevice(token: string) {
  const db = pushDb();
  const { data, error } = await db
    .from("push_devices")
    .select("*")
    .eq("token_hash", hashToken(token))
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw new Error("PUSH_DATABASE_ERROR");
  if (!data) throw new Error("INVALID_DEVICE");
  const member = await db
    .from("team_members")
    .select("id,team_id,full_name,nickname,role,status")
    .eq("id", data.member_id)
    .maybeSingle();
  if (member.error) throw new Error("PUSH_DATABASE_ERROR");
  if (!member.data || member.data.status !== "active") throw new Error("INACTIVE_MEMBER");
  return { ...data, member: member.data };
}

export async function deviceStatus(token: string): Promise<PushDeviceStatus> {
  const device = await getDevice(token);
  return {
    memberName: device.member.nickname || device.member.full_name || "Thành viên",
    captain: device.captain_verified && device.member.role === "captain",
    enabled: device.enabled,
  };
}

export async function subscribeDevice(token: string, input: Record<string, unknown>) {
  let subscription: PushSubscriptionInput;
  try {
    subscription = validateSubscription(input.subscription);
  } catch {
    throw new Error("INVALID_BODY");
  }
  const db = pushDb();
  if (typeof input.invite === "string" && input.invite) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(input.invite)) throw new Error("INVALID_INVITE");
    const { error } = await db.rpc("redeem_push_invite", {
      invite_hash: hashToken(input.invite),
      device_hash: hashToken(token),
      push_endpoint: subscription.endpoint,
      push_keys: subscription.keys,
    });
    if (error) throw new Error(error.code === "23505" ? "DEVICE_ALREADY_LINKED" : "INVALID_INVITE");
  } else {
    const device = await getDevice(token);
    const { error } = await db
      .from("push_devices")
      .update({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        enabled: true,
      })
      .eq("id", device.id);
    if (error) throw new Error("PUSH_DATABASE_ERROR");
  }
  return deviceStatus(token);
}

export async function disableDevice(token: string) {
  // Allow an inactive member to revoke their own device too.
  const { error } = await pushDb()
    .from("push_devices")
    .update({ enabled: false })
    .eq("token_hash", hashToken(token));
  if (error) throw new Error("PUSH_DATABASE_ERROR");
}

export async function sendPush(
  subscription: PushSubscriptionInput,
  payload: {
    title: string;
    body: string;
    tag: string;
    url: string;
  },
  ttl = 3600,
) {
  validateSubscription(subscription);
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) throw new Error("PUSH_NOT_CONFIGURED");
  return webpush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: Math.max(0, Math.min(ttl, 86400)),
    timeout: 8000,
    vapidDetails: { subject, publicKey, privateKey },
  });
}

export async function testDevice(token: string) {
  const device = await getDevice(token);
  if (!device.enabled) throw new Error("DEVICE_DISABLED");
  const db = pushDb();
  const now = new Date();
  // Atomic per-device throttle across serverless instances.
  const { data, error } = await db
    .from("push_devices")
    .update({ last_test_at: now.toISOString() })
    .eq("id", device.id)
    .or("last_test_at.is.null,last_test_at.lt." + new Date(now.getTime() - 60000).toISOString())
    .select("id");
  if (error) throw new Error("PUSH_DATABASE_ERROR");
  if (!data?.length) throw new Error("TEST_RATE_LIMIT");
  try {
    await sendPush(
      { endpoint: device.endpoint, keys: device.keys },
      {
        title: "Pinkstorm FC · Thông báo thử",
        body: "Điện thoại này đã đăng ký nhận thông báo của đội.",
        tag: "pinkstorm-test",
        url: "/notifications",
      },
      60,
    );
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) await disableDevice(token);
    throw new Error("PUSH_SEND_FAILED");
  }
}

export function pushError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const messages: Record<string, [number, string]> = {
    PUSH_DISABLED: [503, "Thông báo chưa được bật trên môi trường này."],
    PUSH_NOT_CONFIGURED: [503, "Máy chủ chưa cấu hình xong thông báo."],
    INVALID_DEVICE: [401, "Thiết bị chưa được kích hoạt. Hãy nhập mã được cấp riêng."],
    INVALID_INVITE: [400, "Mã kích hoạt không hợp lệ, đã dùng hoặc đã hết hạn."],
    DEVICE_ALREADY_LINKED: [
      409,
      "Thiết bị đã được liên kết. Hãy dùng mã thiết bị hiện có hoặc liên hệ quản trị.",
    ],
    INACTIVE_MEMBER: [403, "Thành viên không còn hoạt động trong đội."],
    INVALID_ORIGIN: [403, "Yêu cầu không hợp lệ."],
    INVALID_BODY: [400, "Dữ liệu gửi lên không hợp lệ."],
    DEVICE_DISABLED: [400, "Hãy bật thông báo trước khi gửi thử."],
    TEST_RATE_LIMIT: [429, "Vui lòng đợi 1 phút trước khi gửi thử tiếp."],
    PUSH_SEND_FAILED: [
      502,
      "Chưa gửi được thông báo thử. Kiểm tra quyền và thử bật lại thông báo.",
    ],
  };
  const [status, message] = messages[code] || [500, "Chưa xử lý được thông báo. Vui lòng thử lại."];
  // Do not log endpoints, subscription keys, tokens, or raw web-push errors.
  return { status, message };
}
