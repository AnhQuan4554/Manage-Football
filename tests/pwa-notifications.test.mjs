import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
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

const utils = loadTs("src/features/notifications/utils.ts");
const valid = {
  endpoint: "https://web.push.apple.com/Qtest",
  keys: { p256dh: "B".repeat(87), auth: "a".repeat(22) },
};

test("allow only supported HTTPS Push providers", () => {
  assert.deepEqual(utils.validateSubscription(valid), valid);
  for (const endpoint of [
    "http://web.push.apple.com/a",
    "https://127.0.0.1/a",
    "https://web.push.apple.com.evil.test/a",
    "https://fcm.googleapis.com:8443/a",
    "https://user:secret@web.push.apple.com/a",
    "https://example.com/a",
  ]) {
    assert.throws(() => utils.validateSubscription({ ...valid, endpoint }));
  }
});
test("reject malformed subscription keys", () => {
  assert.throws(() => utils.validateSubscription(null));
  assert.throws(() =>
    utils.validateSubscription({ ...valid, keys: { ...valid.keys, auth: "short" } }),
  );
});
test("Tuesday is scheduled at 17:00 Vietnam, not UTC", () => {
  const due = utils.vietnamSchedule(new Date("2026-09-08T10:00:00Z"));
  assert.equal(due.due, true);
  assert.equal(due.weekday, 2);
  assert.equal(due.day, "2026-09-08");
  assert.equal(utils.vietnamSchedule(new Date("2026-09-08T09:59:59Z")).due, false);
  assert.equal(utils.vietnamSchedule(new Date("2026-09-08T11:00:00Z")).due, false);
});
test("Saturday next week is Monday through Sunday across year boundary", () => {
  const due = utils.vietnamSchedule(new Date("2026-12-26T10:00:00Z"));
  assert.equal(due.weekday, 6);
  assert.equal(due.nextWeekStart, "2026-12-27T17:00:00.000Z");
  assert.equal(due.nextWeekEnd, "2027-01-03T17:00:00.000Z");
});
test("Vietnam day boundary does not use server locale", () => {
  assert.equal(utils.vietnamSchedule(new Date("2026-09-07T17:00:00Z")).day, "2026-09-08");
});
test("message contains time, date, pitch and opponent", () => {
  const text = utils.matchNotificationText({
    match_date_time: "2026-09-15T12:15:00Z",
    venue_name: "Phạm Tu",
    opponent_name: "Đội A",
  });
  for (const part of ["19:15", "15/09/2026", "Phạm Tu", "Đội A"]) assert.ok(text.includes(part));
});

const server = loadTs("src/features/notifications/server.ts", {
  "server-only": {},
  "./utils": utils,
});
test("cron fails closed with missing/wrong/short secret", () => {
  const previous = process.env.PWA_CRON_SECRET;
  try {
    delete process.env.PWA_CRON_SECRET;
    assert.equal(server.checkCronSecret(new Request("https://example.com")), false);
    process.env.PWA_CRON_SECRET = "x".repeat(43);
    assert.equal(
      server.checkCronSecret(
        new Request("https://example.com", { headers: { Authorization: "Bearer wrong" } }),
      ),
      false,
    );
    assert.equal(
      server.checkCronSecret(
        new Request("https://example.com", {
          headers: { Authorization: "Bearer " + "x".repeat(43) },
        }),
      ),
      true,
    );
  } finally {
    if (previous === undefined) delete process.env.PWA_CRON_SECRET;
    else process.env.PWA_CRON_SECRET = previous;
  }
});
test("device token is opaque and hashes before lookup", () => {
  assert.throws(() => server.readDeviceToken(new Request("https://example.com")));
  assert.equal(server.hashToken("private").length, 64);
  assert.notEqual(server.hashToken("private"), server.hashToken("another"));
});
test("preview deployment cannot send to production subscribers", () => {
  const old = { enabled: process.env.PWA_PUSH_ENABLED, vercel: process.env.VERCEL_ENV };
  try {
    process.env.PWA_PUSH_ENABLED = "true";
    process.env.VERCEL_ENV = "preview";
    assert.equal(server.pushEnabled(), false);
    process.env.VERCEL_ENV = "production";
    assert.equal(server.pushEnabled(), true);
  } finally {
    for (const [key, value] of [
      ["PWA_PUSH_ENABLED", old.enabled],
      ["VERCEL_ENV", old.vercel],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

function worker() {
  const handlers = {};
  const shown = [];
  const opened = [];
  vm.runInNewContext(readFileSync(new URL("../public/push-worker.js", import.meta.url), "utf8"), {
    URL,
    self: {
      addEventListener: (name, fn) => {
        handlers[name] = fn;
      },
      location: { origin: "https://football.test" },
      registration: {
        showNotification: async (...args) => {
          shown.push(args);
        },
      },
      clients: {
        matchAll: async () => [],
        openWindow: async (url) => {
          opened.push(url);
        },
      },
    },
  });
  return { handlers, shown, opened };
}

function fakePushDb(seed = {}) {
  const rows = {
    teams: [],
    team_members: [],
    matches: [],
    push_devices: [],
    push_deliveries: [],
    ...structuredClone(seed),
  };
  let sequence = 0;
  function from(table) {
    const filters = [];
    let mutation;
    let one = false;
    let limit = Infinity;
    const query = {
      select() {
        return query;
      },
      eq(key, value) {
        filters.push((row) => row[key] === value);
        return query;
      },
      neq(key, value) {
        filters.push((row) => row[key] !== value);
        return query;
      },
      is(key, value) {
        filters.push((row) => (row[key] ?? null) === value);
        return query;
      },
      in(key, values) {
        filters.push((row) => values.includes(row[key]));
        return query;
      },
      gte(key, value) {
        filters.push((row) => row[key] >= value);
        return query;
      },
      lte(key, value) {
        filters.push((row) => row[key] <= value);
        return query;
      },
      lt(key, value) {
        filters.push((row) => row[key] < value);
        return query;
      },
      limit(value) {
        limit = value;
        return query;
      },
      single() {
        one = true;
        return query;
      },
      maybeSingle() {
        one = true;
        return query;
      },
      update(value) {
        mutation = value;
        return query;
      },
      upsert(values) {
        for (const value of values) {
          if (
            !rows[table].some(
              (row) => row.event_key === value.event_key && row.device_id === value.device_id,
            )
          ) {
            rows[table].push({
              id: "job-" + ++sequence,
              status: "pending",
              attempts: 0,
              available_at: new Date().toISOString(),
              ...value,
            });
          }
        }
        return Promise.resolve({ error: null });
      },
      then(resolve, reject) {
        const found = rows[table]
          .filter((row) => filters.every((predicate) => predicate(row)))
          .slice(0, limit);
        if (mutation) for (const row of found) Object.assign(row, mutation);
        return Promise.resolve({ data: one ? found[0] || null : found, error: null }).then(
          resolve,
          reject,
        );
      },
    };
    return query;
  }
  return {
    rows,
    from,
    async rpc() {
      const found = rows.push_deliveries.filter(
        (row) =>
          ["pending", "processing"].includes(row.status) &&
          row.available_at <= new Date().toISOString() &&
          row.attempts < 5 &&
          row.expires_at > new Date().toISOString(),
      );
      for (const row of found)
        Object.assign(row, {
          status: "processing",
          attempts: row.attempts + 1,
          lease_token: "lease",
        });
      return { data: structuredClone(found), error: null };
    },
  };
}

const seed = {
  teams: [{ id: "team" }],
  team_members: [
    { id: "captain", team_id: "team", role: "captain", status: "active" },
    { id: "member", team_id: "team", role: "member", status: "active" },
    { id: "inactive", team_id: "team", role: "member", status: "inactive" },
  ],
  push_devices: [
    { id: "a", member_id: "captain", captain_verified: true, enabled: true, ...valid },
    { id: "b", member_id: "member", captain_verified: false, enabled: true, ...valid },
    { id: "c", member_id: "inactive", captain_verified: false, enabled: true, ...valid },
  ],
  matches: [
    {
      id: "match",
      team_id: "team",
      status: "open",
      match_date_time: "2026-09-08T12:15:00.000Z",
      opponent_name: "Đội A",
      venue_name: "Phạm Tu",
    },
  ],
};

function dispatcher(db, send = async () => {}) {
  return loadTs("src/features/notifications/dispatch.ts", {
    "server-only": {},
    "./utils": utils,
    "./server": { pushDb: () => db, pushEnabled: () => true, sendPush: send },
  });
}

test("new match fanout excludes inactive members and deduplicates repeat enqueue", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-08T09:00:00Z") });
  const db = fakePushDb(seed);
  const dispatch = dispatcher(db);
  await dispatch.enqueueNewMatch("match");
  await dispatch.enqueueNewMatch("match");
  assert.equal(db.rows.push_deliveries.length, 2);
  assert.deepEqual((await dispatch.dispatchPush()).sent, 2);
});
test("Tuesday reminder is once per device despite cron repeats", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-08T10:00:00Z") });
  const db = fakePushDb(seed);
  const dispatch = dispatcher(db);
  assert.equal((await dispatch.dispatchPush(true)).sent, 2);
  assert.equal((await dispatch.dispatchPush(true)).sent, 0);
});
test("Saturday reminder is only sent to verified captain", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-12T10:00:00Z") });
  const db = fakePushDb(seed);
  const dispatch = dispatcher(db);
  assert.equal((await dispatch.dispatchPush(true)).sent, 1);
  assert.equal(db.rows.push_deliveries[0].device_id, "a");
});
test("Saturday skips reminder when next week already has a match", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-12T10:00:00Z") });
  const db = fakePushDb(seed);
  db.rows.matches[0].match_date_time = "2026-09-15T12:15:00.000Z";
  assert.equal((await dispatcher(db).dispatchPush(true)).sent, 0);
  assert.equal(db.rows.push_deliveries.length, 0);
});
test("cancelled match and disabled device are skipped before delivery", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-08T09:00:00Z") });
  const db = fakePushDb(seed);
  const dispatch = dispatcher(db);
  await dispatch.enqueueNewMatch("match");
  db.rows.matches[0].status = "cancelled";
  db.rows.push_devices[0].enabled = false;
  const result = await dispatch.dispatchPush();
  assert.equal(result.sent, 0);
  assert.equal(result.skipped, 2);
});
test("expired Push subscription is disabled, temporary errors are retried", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-08T09:00:00Z") });
  const db = fakePushDb(seed);
  let calls = 0;
  const dispatch = dispatcher(db, async () => {
    throw { statusCode: ++calls === 1 ? 410 : 503 };
  });
  await dispatch.enqueueNewMatch("match");
  await dispatch.dispatchPush();
  assert.equal(db.rows.push_devices.filter((row) => !row.enabled).length, 1);
  assert.equal(db.rows.push_deliveries.filter((row) => row.status === "pending").length, 1);
  assert.equal(db.rows.push_deliveries.filter((row) => row.status === "skipped").length, 1);
});
test("worker shows visible fallback for malformed payload", async () => {
  const { handlers, shown } = worker();
  let work;
  handlers.push({
    data: {
      json: () => {
        throw new Error("bad JSON");
      },
    },
    waitUntil: (p) => {
      work = p;
    },
  });
  await work;
  assert.equal(shown[0][0], "Pinkstorm FC");
});
test("notification click cannot navigate outside app origin", async () => {
  const { handlers, opened } = worker();
  let work;
  handlers.notificationclick({
    notification: { close() {}, data: { url: "https://evil.test" } },
    waitUntil: (p) => {
      work = p;
    },
  });
  await work;
  assert.equal(opened[0], "https://football.test/notifications");
});
