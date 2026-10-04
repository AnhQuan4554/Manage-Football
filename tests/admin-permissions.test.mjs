import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
function load(file, mocks = {}) {
  const compiled = ts.transpileModule(readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
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
function routes(dir) {
  return readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? routes(dir + "/" + entry.name)
      : entry.name === "route.ts"
        ? [dir + "/" + entry.name]
        : [],
  );
}
const response = load("src/lib/response.ts");
for (const file of routes("src/app/api/teams")) {
  const source = readFileSync(path.join(root, file), "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const methods = [...source.matchAll(/export async function (POST|PATCH|PUT|DELETE)\(/g)].map(
    (m) => m[1],
  );
  for (const method of methods) {
    for (const status of [401, 403, 200]) {
      test(method + " " + file + " authorization " + status, async () => {
        let writes = 0,
          reads = 0,
          checks = 0;
        const mocks = {
          "@/features/auth/server": {
            requireAdmin: async () => {
              checks++;
              return {
                status,
                result:
                  status === 200
                    ? response.ok({ id: "admin" })
                    : response.fail(status === 401 ? "unauthenticated" : "forbidden"),
              };
            },
          },
          "@/lib/api/http": {
            jsonResponse: (data, code = 200) => Response.json(data, { status: code }),
          },
          "next/cache": { revalidatePath() {} },
          "next/server": { after() {} },
          "@/features/notifications/dispatch": {
            enqueueNewMatch: async () => {},
            dispatchPush: async () => {},
          },
        };
        for (const node of ast.statements) {
          if (!ts.isImportDeclaration(node)) continue;
          const name = node.moduleSpecifier.text;
          if (!name.includes("/services/")) continue;
          mocks[name] = new Proxy(
            {},
            {
              get: () => async () => {
                writes++;
                return response.ok({ id: "fixture" });
              },
            },
          );
        }
        const api = load(file, mocks);
        const result = await api[method](
          {
            json: async () => {
              reads++;
              if (status !== 200) throw new Error("Body read before permission");
              return {};
            },
          },
          {
            params: Promise.resolve({
              teamId: "team",
              matchId: "match",
              memberId: "member",
              itemId: "item",
            }),
          },
        );
        assert.equal(checks, 1);
        assert.equal(
          result.status,
          status === 200 ? (method === "POST" && !file.includes("/split/") ? 201 : 200) : status,
        );
        assert.equal(writes, status === 200 ? 1 : 0);
        if (status !== 200) {
          assert.equal(reads, 0);
          assert.equal((await result.json()).success, false);
        }
      });
    }
  }
}

// Render real permission gates and feature components with lightweight presentation stubs.
const h = React.createElement;
const container = ({ children }) => h("div", null, children);
const button = ({ children, ...props }) =>
  h(
    "button",
    {
      className: props.className,
      "aria-label": props["aria-label"],
    },
    children,
  );
const ui = {
  Button: button,
  Checkbox: ({ children }) => h("label", null, h("input", { type: "checkbox" }), children),
  Modal: ({ open, children }) => (open ? container({ children }) : null),
  App: { useApp: () => ({ message: { success() {}, error() {}, warning() {} } }) },
  Space: container,
  Tag: container,
  Alert: container,
  Progress: () => null,
  Collapse: () => null,
  Input: Object.assign(container, { TextArea: container }),
  DatePicker: container,
  TimePicker: container,
};
const cache = new Map();
function uiLoad(file) {
  if (cache.has(file)) return cache.get(file);
  const source = readFileSync(path.join(root, file), "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const mocks = {
    antd: ui,
    "next/link": { __esModule: true, default: ({ href, children }) => h("a", { href }, children) },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@ant-design/icons": new Proxy({}, { get: () => () => null }),
    "@/features/auth/client": { authConfigured: () => false },
    "@/lib/supabase/browser": {
      createClient: () => {
        throw new Error("Unexpected auth request");
      },
    },
    "@/components/common/LogoLoading": { LogoLoading: () => null },
  };
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || node.importClause?.isTypeOnly) continue;
    const name = node.moduleSpecifier.text;
    if (name.startsWith("@/") && !(name in mocks)) {
      const base = "src/" + name.slice(2);
      const resolved = existsSync(path.join(root, base + ".ts")) ? base + ".ts" : base + ".tsx";
      mocks[name] = uiLoad(resolved);
    }
  }
  const result = load(file, mocks);
  cache.set(file, result);
  return result;
}
const { PermissionsProvider } = uiLoad("src/features/auth/components/Permissions.tsx");
const { CollectionPaymentList } = uiLoad("src/features/funds/components/CollectionPaymentList.tsx");
const { StatisticsOverview } = uiLoad("src/features/statistics/components/StatisticsOverview.tsx");
const { MatchSummaryCard } = uiLoad("src/features/matches/components/MatchSummaryCard.tsx");
const member = { id: "member", fullName: "Test Member", nickname: "Test Member" };
const match = {
  id: "match",
  teamId: "team",
  opponentName: "Test Opponent",
  date: new Date().toISOString().slice(0, 10),
  time: "19:00",
  status: "completed",
  attendance: { member: "going" },
  pitchCost: 1000,
};
const item = {
  id: "item",
  membershipId: "member",
  participantName: "Test Member",
  amountDue: 1000,
  amountPaid: 0,
  status: "unpaid",
  chargeable: true,
  paidAt: null,
  paymentNote: null,
};
const split = {
  matchId: "match",
  totalAmount: 1000,
  includedMemberIds: ["member"],
  paidMemberIds: [],
  items: [item],
};
function render(canManage, component, props) {
  return renderToStaticMarkup(h(PermissionsProvider, { canManage }, h(component, props)));
}
test("payment viewer sees amounts/status but no payment buttons, undo or checkboxes", () => {
  const props = {
    teamId: "team",
    matchId: "match",
    items: [item, { ...item, id: "paid", status: "paid", amountPaid: 1000 }],
    members: [member],
  };
  const viewer = render(false, CollectionPaymentList, props);
  assert.match(viewer, /Test Member/);
  assert.match(viewer, /Phải đóng/);
  assert.doesNotMatch(viewer, /<button|type="checkbox"|Hoàn tác/);
  const admin = render(true, CollectionPaymentList, props);
  assert.match(admin, /<button/);
  assert.match(admin, /type="checkbox"/);
  assert.match(admin, /Hoàn tác/);
});
test("statistics viewer keeps the debt report but cannot confirm single/bulk payment", () => {
  const props = { split, match, members: [member], matchSplits: [split], matches: [match] };
  const viewer = render(false, StatisticsOverview, props);
  assert.match(viewer, /Test Member/);
  assert.match(viewer, /Còn thiếu/);
  assert.doesNotMatch(viewer, /<button|member-debt-pay-one|member-debt-pay-all/);
  const admin = render(true, StatisticsOverview, props);
  assert.match(admin, /member-debt-pay-one/);
  assert.match(admin, /member-debt-pay-all/);
});
test("match cards expose edit links only to admin while preserving public details", () => {
  const viewer = render(false, MatchSummaryCard, { match });
  assert.match(viewer, /href="\/matches\/match"/);
  assert.doesNotMatch(viewer, /\/edit|Sửa người/);
  assert.match(render(true, MatchSummaryCard, { match }), /\/matches\/match\/edit/);
});
test("management context defaults to denied outside the app provider", () => {
  const { AdminOnly } = uiLoad("src/features/auth/components/Permissions.tsx");
  assert.equal(renderToStaticMarkup(h(AdminOnly, null, h("button", null, "Write"))), "");
});
for (const account of [
  null,
  { role: "member", status: "active" },
  { role: "admin", status: "blocked" },
  { role: "admin", status: "active" },
]) {
  test("direct admin page guard: " + JSON.stringify(account), async () => {
    const utils = load("src/features/auth/utils.ts");
    const { AdminPage } = load("src/features/auth/components/AdminPage.tsx", {
      "next/link": { __esModule: true, default: ({ children }) => h("a", null, children) },
      "next/navigation": {
        redirect: (url) => {
          throw new Error("REDIRECT:" + url);
        },
      },
      "@/features/auth/server": { getCurrentAccount: async () => account },
      "@/features/auth/utils": utils,
    });
    const call = () => AdminPage({ next: "/matches/new", children: h("button", null, "CREATE") });
    if (!account) {
      await assert.rejects(call, /REDIRECT:\/login\?next=%2Fmatches%2Fnew/);
    } else {
      const html = renderToStaticMarkup(await call());
      assert.equal(html.includes("CREATE"), utils.isAdmin(account));
    }
  });
}
