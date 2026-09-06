// Trusted operator CLI only. Never expose this script as a public API.
import { createHash, randomBytes } from "node:crypto";
import { existsSync, writeFileSync, readFileSync, openSync, writeSync, closeSync } from "node:fs";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}
const [command, memberId, option] = process.argv.slice(2);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("base64url");

async function main() {
  if (command === "keys") {
    const file = ".env.pwa.local";
    const keys = webpush.generateVAPIDKeys();
    // Exclusive create: never replace existing VAPID keys or cron credentials.
    writeFileSync(
      file,
      [
        "PWA_PUSH_ENABLED=true",
        "VAPID_PUBLIC_KEY=" + keys.publicKey,
        "VAPID_PRIVATE_KEY=" + keys.privateKey,
        "VAPID_SUBJECT=mailto:quanmanchester0405@gmail.com",
        "PWA_CRON_SECRET=" + token(),
        "NEXT_PUBLIC_APP_URL=https://manage-football-anhquan4554s-projects.vercel.app",
        "",
      ].join("\n"),
      { flag: "wx", mode: 0o600 },
    );
    console.log(
      "Created .env.pwa.local (gitignored). Import these values into Vercel Production only. Do not share this file.",
    );
    return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL/server key in .env.local.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  if (command === "export-invites") {
    if (!memberId)
      throw new Error("Cần slug đội: node scripts/pwa-admin.mjs export-invites pinkstorm-fc");
    const team = await db.from("teams").select("id,name").eq("slug", memberId).single();
    if (team.error) throw new Error("Không tìm thấy đội.");
    const members = await db
      .from("team_members")
      .select("id,nickname,full_name,role")
      .eq("team_id", team.data.id)
      .eq("status", "active")
      .order("full_name");
    if (members.error || !members.data.length) throw new Error("Không có thành viên hoạt động.");
    const appUrl = existsSync(".env.pwa.local")
      ? parseEnv(readFileSync(".env.pwa.local", "utf8")).NEXT_PUBLIC_APP_URL
      : process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl?.startsWith("https://"))
      throw new Error("Cần cấu hình NEXT_PUBLIC_APP_URL production.");
    const file = ".pwa-invitations.local.md";
    const fd = openSync(file, "wx", 0o600);
    try {
      const invitations = members.data.map((member) => ({ member, code: token() }));
      const result = await db.from("push_invites").insert(
        invitations.map(({ member, code }) => ({
          member_id: member.id,
          token_hash: hash(code),
          captain_verified: member.role === "captain",
        })),
      );
      if (result.error)
        throw new Error("Không tạo được mã. File riêng còn trống; kiểm tra cấu hình rồi thử lại.");
      const lines = [
        "# Mã kích hoạt riêng — " + team.data.name,
        "",
        "TÀI LIỆU BÍ MẬT: không commit, không gửi cả file vào nhóm.",
        "Chỉ gửi từng người đúng mã của họ. Mã dùng một lần/thiết bị, hết hạn sau 7 ngày.",
        "",
        "Mở trên điện thoại: " + appUrl.replace(/\/$/, "") + "/notifications",
        "iPhone: thêm app vào Màn hình chính, mở app từ biểu tượng rồi nhập mã.",
        "",
        ...invitations.flatMap(({ member, code }) => [
          "## " + (member.nickname || member.full_name || member.id),
          "",
          "Vai trò nhận thông báo: " + (member.role === "captain" ? "Đội trưởng" : "Thành viên"),
          "",
          "Mã: " + code,
          "",
        ]),
      ];
      writeSync(fd, lines.join("\n"), null, "utf8");
      console.log("Đã tạo", invitations.length, "mã trong", file, "— chỉ gửi riêng từng mã.");
    } finally {
      closeSync(fd);
    }
    return;
  }
  if (command === "members") {
    const { data, error } = await db
      .from("team_members")
      .select("id,team_id,nickname,full_name,role,status")
      .eq("status", "active");
    if (error) throw new Error("Cannot list members. Check server credentials.");
    console.table(data);
    return;
  }
  if (command === "invite") {
    if (!/^[0-9a-f-]{36}$/i.test(memberId || "") || (option && option !== "--captain")) {
      throw new Error("Usage: node scripts/pwa-admin.mjs invite MEMBER_UUID [--captain]");
    }
    const { data, error } = await db
      .from("team_members")
      .select("id,nickname,full_name,role,status")
      .eq("id", memberId)
      .single();
    if (error || data.status !== "active") throw new Error("Member not found or inactive.");
    if (option === "--captain" && data.role !== "captain")
      throw new Error("Member is not a captain.");
    const invitation = token();
    const result = await db.from("push_invites").insert({
      member_id: memberId,
      token_hash: hash(invitation),
      captain_verified: option === "--captain",
    });
    if (result.error) throw new Error("Could not create invitation.");
    console.log("Member:", data.nickname || data.full_name);
    console.log(
      "Open:",
      (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "") + "/notifications",
    );
    console.log("Private activation code (one device, expires in 7 days):", invitation);
    return;
  }
  if (command === "revoke") {
    if (!/^[0-9a-f-]{36}$/i.test(memberId || "")) throw new Error("Supply a member UUID.");
    const devices = await db
      .from("push_devices")
      .update({ enabled: false, revoked_at: new Date().toISOString() })
      .eq("member_id", memberId)
      .select("id");
    const invites = await db
      .from("push_invites")
      .delete()
      .eq("member_id", memberId)
      .is("used_at", null);
    if (devices.error || invites.error) throw new Error("Revocation incomplete.");
    console.log("Disabled devices:", devices.data.length, "; removed unused invitations.");
    return;
  }
  throw new Error(
    "Usage: node scripts/pwa-admin.mjs keys | members | export-invites TEAM_SLUG | invite MEMBER_UUID [--captain] | revoke MEMBER_UUID",
  );
}

main().catch((error) => {
  console.error(
    error.code === "EEXIST"
      ? "File đầu ra đã tồn tại; giữ nguyên để không ghi đè khóa hoặc mã mời."
      : error.message,
  );
  process.exitCode = 1;
});
