import { ok } from "@/lib/response";
import { pushEnabled } from "@/features/notifications/server";

export async function GET() {
  const enabled =
    pushEnabled() &&
    Boolean(
      process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
    );
  return Response.json(ok({ enabled, publicKey: enabled ? process.env.VAPID_PUBLIC_KEY : null }), {
    headers: { "Cache-Control": "no-store" },
  });
}
