import { fail, ok } from "@/lib/response";
import { checkCronSecret, pushEnabled } from "@/features/notifications/server";
import { dispatchPush } from "@/features/notifications/dispatch";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!checkCronSecret(request)) return Response.json(fail("Unauthorized"), { status: 401 });
  if (!pushEnabled()) return Response.json(fail("Push disabled"), { status: 503 });
  try {
    return Response.json(ok(await dispatchPush(true)));
  } catch {
    console.error("PUSH_CRON_FAILED");
    return Response.json(fail("Push dispatch failed"), { status: 500 });
  }
}
