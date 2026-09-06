// Upload only PWA configuration to the explicitly named linked project.
// Values go through stdin, never command arguments or console output.
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawnSync } from "node:child_process";

const expectedProject = process.argv[2];
const project = JSON.parse(readFileSync(".vercel/project.json", "utf8"));
if (!expectedProject || project.projectName !== expectedProject) {
  throw new Error("Truyền đúng tên project đã link: node scripts/pwa-vercel-env.mjs TEN_PROJECT");
}
const config = parseEnv(readFileSync(".env.pwa.local", "utf8"));
const names = [
  "PWA_PUSH_ENABLED",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "PWA_CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
];
if (names.some((name) => !config[name])) throw new Error("File .env.pwa.local còn thiếu cấu hình.");
if (new URL(config.NEXT_PUBLIC_APP_URL).protocol !== "https:")
  throw new Error("Production cần URL HTTPS.");
for (const name of names) {
  const secret = name === "VAPID_PRIVATE_KEY" || name === "PWA_CRON_SECRET";
  const result = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    [
      "dlx",
      "vercel@59.11.7",
      "env",
      "add",
      name,
      "production",
      "--force",
      "--yes",
      secret ? "--sensitive" : "--no-sensitive",
    ],
    { input: config[name], encoding: "utf8", shell: process.platform === "win32", timeout: 60000 },
  );
  if (result.status !== 0)
    throw new Error(
      "Chưa cập nhật được " + name + ". Kiểm tra đăng nhập/quyền Vercel rồi chạy lại.",
    );
  console.log("Đã cấu hình Production:", name);
}
