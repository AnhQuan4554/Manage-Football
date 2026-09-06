import { fail, ok } from "@/lib/response";
import {
  deviceStatus,
  disableDevice,
  pushEnabled,
  pushError,
  readDeviceToken,
  readPushBody,
  subscribeDevice,
  testDevice,
} from "@/features/notifications/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!pushEnabled()) throw new Error("PUSH_DISABLED");
    return Response.json(ok(await deviceStatus(readDeviceToken(request))), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const result = pushError(error);
    return Response.json(fail(result.message), {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

export async function POST(request: Request) {
  try {
    const input = await readPushBody(request);
    const token = readDeviceToken(request);
    if (input.action === "subscribe") return Response.json(ok(await subscribeDevice(token, input)));
    if (input.action === "disable") {
      await disableDevice(token);
      return Response.json(ok(true));
    }
    if (input.action === "test") {
      await testDevice(token);
      return Response.json(ok(true));
    }
    throw new Error("INVALID_BODY");
  } catch (error) {
    const result = pushError(error);
    return Response.json(fail(result.message), { status: result.status });
  }
}
