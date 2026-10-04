import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");
function loadTs(path, mocks = {}) {
  const source = readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (name) => (name in mocks ? mocks[name] : require(name)),
    module,
    module.exports,
  );
  return module.exports;
}
const utils = loadTs("src/features/auth/utils.ts");
const response = loadTs("src/lib/response.ts");
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://auth-test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-public-key";

test("return paths preserve deep links and reject open redirects and auth loops", () => {
  assert.equal(utils.safeNextPath("/matches/abc?tab=payments"), "/matches/abc?tab=payments");
  for (const path of [
    null,
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/login",
    "/api/auth/callback",
    "/matches/../../login",
    "/dashboard\n",
    "/settings-evil",
    "/%2f%2fevil.test",
  ]) {
    assert.equal(utils.safeNextPath(path), "/dashboard", String(path));
  }
  for (const path of ["/funds", "/statistics", "/opponents", "/team/new", "/members/new"]) {
    assert.equal(utils.safeNextPath(path), path);
  }
});

function middleware(authResult, { refresh = false, throws = false } = {}) {
  let calls = 0;
  const module = loadTs("src/lib/supabase/middleware.ts", {
    "@/features/auth/utils": utils,
    "@supabase/ssr": {
      createServerClient: (_url, _key, options) => ({
        auth: {
          getUser: async () => {
            calls++;
            if (refresh)
              options.cookies.setAll([
                {
                  name: "sb-auth-test-auth-token",
                  value: "refreshed",
                  options: { path: "/", httpOnly: true },
                },
              ]);
            if (throws) throw new Error("network unavailable");
            return authResult;
          },
        },
      }),
    },
  });
  return { update: module.updateSession, calls: () => calls };
}
const request = (path, cookie = "") =>
  new NextRequest("https://app.test" + path, { headers: { cookie } });
const guest = { data: { user: null }, error: null };

test("first visit reads a public deep link without login, cookies or an Auth call", async () => {
  const m = middleware(guest);
  const result = await m.update(request("/matches/abc?tab=payments"));
  assert.equal(result.headers.get("location"), null);
  assert.equal(m.calls(), 0);
});

test("public middleware leaves authorization to page and API guards", async () => {
  const m = middleware(guest);
  for (const path of ["/", "/dashboard", "/members/new", "/funds", "/statistics", "/opponents"]) {
    const result = await m.update(request(path, "pinkstorm_guest=1"));
    assert.equal(result.headers.get("location"), null);
  }
  for (const path of ["/api/teams", "/login", "/register", "/api/auth/callback?code=abc"]) {
    assert.equal((await m.update(request(path))).headers.get("location"), null);
  }
  assert.equal(m.calls(), 0);
});

test("valid sessions enter directly and forward refreshed cookies to server and browser", async () => {
  const m = middleware({ data: { user: { id: "member" } }, error: null }, { refresh: true });
  const result = await m.update(request("/dashboard", "sb-auth-test-auth-token=old"));
  assert.equal(result.headers.get("location"), null);
  assert.match(result.headers.get("set-cookie"), /refreshed/);
  assert.match(result.headers.get("x-middleware-request-cookie"), /refreshed/);
  assert.equal(result.headers.get("cache-control"), "private, no-store");
});

test("invalid sessions and Auth outages still allow public viewing", async () => {
  const m = middleware(guest, { refresh: true });
  const result = await m.update(request("/settings", "sb-auth-test-auth-token=forged"));
  assert.equal(result.headers.get("location"), null);
  assert.match(result.headers.get("set-cookie"), /refreshed/);
  const unavailable = middleware(guest, { throws: true });
  assert.equal(
    (
      await unavailable.update(request("/funds", "sb-auth-test-auth-token=old; pinkstorm_guest=1"))
    ).headers.get("location"),
    null,
  );
});

function callback(result, throws = false) {
  const calls = [];
  const { GET } = loadTs("src/app/api/auth/callback/route.ts", {
    "@/features/auth/utils": utils,
    "@/lib/supabase/server": {
      createClient: async () => ({
        auth: {
          exchangeCodeForSession: async (code) => {
            calls.push(code);
            if (throws) throw new Error("offline");
            return result;
          },
          verifyOtp: async (args) => {
            calls.push(args);
            return result;
          },
        },
      }),
    },
  });
  return { GET, calls };
}
const session = { data: { session: { user: { id: "member" } } }, error: null };

test("OAuth callback exchanges the code and ignores external return URLs", async () => {
  const c = callback(session);
  const result = await c.GET(request("/api/auth/callback?code=secret&next=https://evil.test"));
  assert.deepEqual(c.calls, ["secret"]);
  assert.equal(result.headers.get("location"), "https://app.test/dashboard");
  assert.match(result.headers.get("set-cookie"), /pinkstorm_guest=/);
  assert.equal(result.headers.get("referrer-policy"), "no-referrer");
});

test("recovery callbacks and cross-device email confirmations create the intended session", async () => {
  const recovery = callback(session);
  assert.equal(
    (await recovery.GET(request("/api/auth/callback?code=abc&type=recovery"))).headers.get(
      "location",
    ),
    "https://app.test/reset-password",
  );
  const confirm = callback(session);
  assert.equal(
    (
      await confirm.GET(request("/api/auth/callback?token_hash=hash&type=email&next=/funds"))
    ).headers.get("location"),
    "https://app.test/funds",
  );
  assert.deepEqual(confirm.calls, [{ token_hash: "hash", type: "email" }]);
});

test("failed, cancelled, absent, and unsupported callback tokens fail closed without leaking secrets", async () => {
  for (const path of [
    "?code=secret",
    "?error=access_denied&error_description=private",
    "",
    "?token_hash=secret&type=invite",
  ]) {
    const c = callback({ data: { session: null }, error: { message: "secret" } });
    const result = await c.GET(request("/api/auth/callback" + path));
    const location = result.headers.get("location");
    assert.equal(new URL(location).pathname, "/login");
    assert.equal(new URL(location).searchParams.get("error"), "callback");
    assert.doesNotMatch(location, /secret|private/);
  }
  const offline = callback(session, true);
  assert.equal(
    new URL((await offline.GET(request("/api/auth/callback?code=abc"))).headers.get("location"))
      .pathname,
    "/login",
  );
});

function accountService({
  user = null,
  profile = null,
  profileError = null,
  cookie = true,
  authError = null,
} = {}) {
  return loadTs("src/features/auth/server.ts", {
    "server-only": {},
    react: { cache: (fn) => fn },
    "next/headers": {
      cookies: async () => ({ getAll: () => (cookie ? [{ name: "sb-test-auth-token" }] : []) }),
    },
    "@/features/auth/utils": utils,
    "@/lib/response": response,
    "@/lib/supabase/server": {
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user }, error: authError }) },
        from: () => ({
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: profile, error: profileError }) }),
          }),
        }),
      }),
    },
  });
}

test("admin authorization uses the verified user and database role, ignoring forged metadata", async () => {
  const user = {
    id: "member",
    email: "member@example.test",
    user_metadata: { role: "admin" },
    app_metadata: { role: "admin" },
  };
  const service = accountService({
    user,
    profile: { role: "member", status: "active", full_name: "Member" },
  });
  assert.equal((await service.getCurrentAccount()).role, "member");
  assert.equal((await service.requireAdmin()).status, 403);
  const admin = accountService({ user, profile: { role: "admin", status: "active" } });
  assert.equal((await admin.requireAdmin()).status, 200);
});

test("missing/failed profiles, inactive admins, and invalid users never gain admin access", async () => {
  const user = { id: "member", email: "member@example.test" };
  for (const profile of [
    null,
    { role: "admin", status: "blocked" },
    { role: "admin", status: "pending" },
    { role: "admin", status: "inactive" },
  ]) {
    assert.equal((await accountService({ user, profile }).requireAdmin()).status, 403);
  }
  assert.equal(
    (
      await accountService({
        user,
        profile: { role: "admin", status: "active" },
        profileError: { message: "offline" },
      }).requireAdmin()
    ).status,
    403,
  );
  assert.equal(
    (await accountService({ user, authError: { message: "invalid" } }).requireAdmin()).status,
    401,
  );
  assert.equal((await accountService({ user, cookie: false }).requireAdmin()).status, 401);
  assert.equal((await accountService().requireAdmin()).status, 401);
});

test("guest preference and login transitions clear the router via safe full navigation", () => {
  const locations = [];
  globalThis.document = { cookie: "" };
  globalThis.location = { protocol: "https:" };
  globalThis.window = {
    location: { origin: "https://app.test", assign: (url) => locations.push(url) },
  };
  try {
    const client = loadTs("src/features/auth/client.ts", {
      "@/features/auth/utils": utils,
      "@/lib/supabase/browser": {},
    });
    client.continueAsGuest("/matches/abc");
    assert.match(
      document.cookie,
      /pinkstorm_guest=1; Path=\/; Max-Age=2592000; SameSite=Lax; Secure/,
    );
    assert.equal(locations.at(-1), "/matches/abc");
    client.enterApp("//evil.test");
    assert.match(document.cookie, /Max-Age=0/);
    assert.equal(locations.at(-1), "/dashboard");
    const recovery = new URL(client.callbackUrl("/funds", true));
    assert.equal(recovery.origin, "https://app.test");
    assert.equal(recovery.pathname, "/api/auth/callback");
    assert.equal(recovery.searchParams.get("type"), "recovery");
    assert.equal(recovery.searchParams.get("next"), "/funds");
  } finally {
    delete globalThis.document;
    delete globalThis.location;
    delete globalThis.window;
  }
});

test("logout revokes the local session and only navigates after success", async () => {
  const locations = [];
  const scopes = [];
  globalThis.document = { cookie: "pinkstorm_guest=1" };
  globalThis.window = { location: { assign: (url) => locations.push(url) } };
  let error = new Error("offline");
  try {
    const client = loadTs("src/features/auth/client.ts", {
      "@/features/auth/utils": utils,
      "@/lib/supabase/browser": {
        createClient: () => ({
          auth: {
            signOut: async (options) => {
              scopes.push(options.scope);
              return { error };
            },
          },
        }),
      },
    });
    await assert.rejects(client.signOut(), /offline/);
    assert.equal(locations.length, 0);
    error = null;
    await client.signOut();
    assert.deepEqual(scopes, ["local", "local"]);
    assert.equal(locations[0], "/dashboard");
    assert.match(document.cookie, /Max-Age=0/);
  } finally {
    delete globalThis.document;
    delete globalThis.window;
  }
});

test("Google provider availability is checked without caching or exposing secret keys", async () => {
  const originalFetch = globalThis.fetch;
  let enabled = false;
  let ok = true;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://auth-test.supabase.co/auth/v1/settings");
      assert.equal(options.headers.apikey, "test-public-key");
      assert.equal(options.cache, "no-store");
      return { ok, json: async () => ({ external: { google: enabled } }) };
    };
    const client = loadTs("src/features/auth/client.ts", {
      "@/features/auth/utils": utils,
      "@/lib/supabase/browser": {},
    });
    await assert.rejects(
      client.ensureGoogleEnabled(),
      (error) => error.code === "provider_disabled",
    );
    enabled = true;
    await client.ensureGoogleEnabled();
    ok = false;
    await assert.rejects(client.ensureGoogleEnabled(), /unavailable/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("guest continuation and logout leave admin-only forms for public detail/list pages", () => {
  assert.equal(utils.publicViewPath("/matches/abc/edit?tab=payments"), "/matches/abc?tab=payments");
  assert.equal(utils.publicViewPath("/members/new"), "/members");
  assert.equal(utils.publicViewPath("/team/new"), "/team");
  assert.equal(utils.publicViewPath("//evil.test"), "/dashboard");
  assert.equal(utils.publicViewPath("/opponents?q=test"), "/opponents?q=test");
});
