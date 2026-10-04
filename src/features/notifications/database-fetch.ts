import { setTimeout as delay } from "node:timers/promises";

// Log only fixed resource names and error codes, never credentials or request data.
const resources = new Set([
  "/rest/v1/teams",
  "/rest/v1/team_members",
  "/rest/v1/matches",
  "/rest/v1/push_devices",
  "/rest/v1/push_deliveries",
  "/rest/v1/rpc/redeem_push_invite",
  "/rest/v1/rpc/claim_push_deliveries",
]);
const transientStatuses = new Set([502, 503, 504, 520, 522, 524]);

export async function fetchPushDatabase(input: RequestInfo | URL, init?: RequestInit) {
  const url = new URL(input instanceof Request ? input.url : String(input));
  const resource = resources.has(url.pathname) ? url.pathname : "other";
  const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
  // Repeating the same delivery PATCH is safe: cleanup is conditional on status,
  // and completion is guarded by its lease token. Never retry claim, enrollment,
  // or the per-device test throttle after an ambiguous response.
  const retryable =
    method === "GET" ||
    method === "HEAD" ||
    (method === "PATCH" && resource === "/rest/v1/push_deliveries");
  // Supabase sends serialized bodies in init. A Request stream cannot be replayed.
  const attempts = retryable && !(input instanceof Request) ? 3 : 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let response: Response;
    try {
      const timeout = AbortSignal.timeout(10000);
      response = await fetch(input, {
        ...init,
        signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
      });
    } catch (error) {
      if (attempt < attempts && !init?.signal?.aborted) {
        await delay(250 * attempt);
        continue;
      }
      console.error("PUSH_DATABASE_CONNECTION_ERROR", {
        resource,
        code: error instanceof Error && error.name === "TimeoutError" ? "TIMEOUT" : "NETWORK_ERROR",
      });
      throw error;
    }
    if (transientStatuses.has(response.status) && attempt < attempts && !init?.signal?.aborted) {
      console.warn("PUSH_DATABASE_RETRY", { resource, status: response.status, attempt });
      await response.body?.cancel();
      await delay(250 * attempt);
      continue;
    }
    if (!response.ok) {
      const body = await response
        .clone()
        .json()
        .catch(() => null);
      const code =
        typeof body?.code === "string" && /^(PGRST\d{3}|[0-9A-Z]{5})$/.test(body.code)
          ? body.code
          : "UNKNOWN";
      console.error("PUSH_DATABASE_HTTP_ERROR", { resource, status: response.status, code });
    }
    return response;
  }
  throw new Error("PUSH_DATABASE_ERROR");
}
