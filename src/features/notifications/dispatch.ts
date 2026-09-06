import "server-only";
import { pushDb, pushEnabled, sendPush } from "./server";
import { matchNotificationText, vietnamSchedule } from "./utils";
import type { PushKind, PushMatch } from "./types";

type Delivery = {
  id: string;
  device_id: string;
  team_id: string;
  match_id: string | null;
  kind: PushKind;
  event_key: string;
  attempts: number;
  expires_at: string;
  lease_token: string;
};

async function activeDevices(teamId: string, captainOnly = false) {
  const db = pushDb();
  let membersQuery = db
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("status", "active");
  if (captainOnly) membersQuery = membersQuery.eq("role", "captain");
  const members = await membersQuery;
  if (members.error) throw new Error("PUSH_DATABASE_ERROR");
  if (!members.data.length) return [];
  let devicesQuery = db
    .from("push_devices")
    .select("id")
    .eq("enabled", true)
    .is("revoked_at", null)
    .in(
      "member_id",
      members.data.map((member) => member.id),
    );
  if (captainOnly) devicesQuery = devicesQuery.eq("captain_verified", true);
  const devices = await devicesQuery;
  if (devices.error) throw new Error("PUSH_DATABASE_ERROR");
  return devices.data;
}

async function enqueue(
  teamId: string,
  matchId: string | null,
  kind: PushKind,
  key: string,
  expiresAt: string,
) {
  const devices = await activeDevices(teamId, kind === "create_match");
  if (!devices.length) return;
  const { error } = await pushDb()
    .from("push_deliveries")
    .upsert(
      devices.map((device) => ({
        device_id: device.id,
        team_id: teamId,
        match_id: matchId,
        kind,
        event_key: key,
        expires_at: expiresAt,
      })),
      { onConflict: "event_key,device_id", ignoreDuplicates: true },
    );
  if (error) throw new Error("PUSH_DATABASE_ERROR");
}

export async function enqueueNewMatch(matchId: string) {
  if (!pushEnabled()) return;
  const { data, error } = await pushDb().from("matches").select("*").eq("id", matchId).single();
  if (error) throw new Error("PUSH_DATABASE_ERROR");
  if (
    ["cancelled", "completed"].includes(data.status) ||
    new Date(data.match_date_time).getTime() <= Date.now()
  )
    return;
  await enqueue(
    data.team_id,
    data.id,
    "new_match",
    "new:" + data.id,
    new Date(
      Math.min(Date.now() + 86400000, new Date(data.match_date_time).getTime()),
    ).toISOString(),
  );
}

async function hasNextWeekMatch(teamId: string, now: Date) {
  const schedule = vietnamSchedule(now);
  const { data, error } = await pushDb()
    .from("matches")
    .select("id")
    .eq("team_id", teamId)
    .neq("status", "cancelled")
    .gte("match_date_time", schedule.nextWeekStart)
    .lt("match_date_time", schedule.nextWeekEnd)
    .limit(1);
  if (error) throw new Error("PUSH_DATABASE_ERROR");
  return data.length > 0;
}

async function enqueueScheduled(now: Date) {
  const schedule = vietnamSchedule(now);
  if (!schedule.due || ![2, 6].includes(schedule.weekday)) return;
  const db = pushDb();
  if (schedule.weekday === 2) {
    const { data, error } = await db
      .from("matches")
      .select("*")
      .gte("match_date_time", now.toISOString())
      .lt("match_date_time", schedule.end)
      .in("status", ["draft", "open", "lineup_ready"]);
    if (error) throw new Error("PUSH_DATABASE_ERROR");
    for (const match of data as PushMatch[]) {
      await enqueue(
        match.team_id,
        match.id,
        "match_today",
        "today:" + schedule.day + ":" + match.id,
        match.match_date_time,
      );
    }
  } else {
    const { data, error } = await db.from("teams").select("id");
    if (error) throw new Error("PUSH_DATABASE_ERROR");
    for (const team of data) {
      if (!(await hasNextWeekMatch(team.id, now))) {
        await enqueue(
          team.id,
          null,
          "create_match",
          "create:" + schedule.day + ":" + team.id,
          new Date(new Date(schedule.start).getTime() + 18 * 3600000).toISOString(),
        );
      }
    }
  }
}

async function payloadFor(job: Delivery, now: Date) {
  if (new Date(job.expires_at) <= now) return null;
  const db = pushDb();
  const device = await db.from("push_devices").select("*").eq("id", job.device_id).maybeSingle();
  if (device.error) throw new Error("PUSH_DATABASE_ERROR");
  if (!device.data?.enabled || device.data.revoked_at) return null;
  const member = await db
    .from("team_members")
    .select("team_id,status,role")
    .eq("id", device.data.member_id)
    .maybeSingle();
  if (member.error) throw new Error("PUSH_DATABASE_ERROR");
  if (!member.data || member.data.status !== "active" || member.data.team_id !== job.team_id)
    return null;
  let title: string;
  let body: string;
  let url: string;
  if (job.kind === "create_match") {
    if (
      !device.data.captain_verified ||
      member.data.role !== "captain" ||
      (await hasNextWeekMatch(job.team_id, now))
    )
      return null;
    title = "Pinkstorm FC · Nhắc tạo trận";
    body = "Tuần tới chưa có trận. Đội trưởng vào tạo lịch đá nhé!";
    url = "/matches/new";
  } else {
    const match = await db.from("matches").select("*").eq("id", job.match_id!).maybeSingle();
    if (match.error) throw new Error("PUSH_DATABASE_ERROR");
    if (
      !match.data ||
      match.data.team_id !== job.team_id ||
      ["cancelled", "completed"].includes(match.data.status) ||
      new Date(match.data.match_date_time) <= now
    )
      return null;
    // A rescheduled match must not retain today's reminder.
    if (
      job.kind === "match_today" &&
      vietnamSchedule(new Date(match.data.match_date_time)).day !== vietnamSchedule(now).day
    )
      return null;
    title =
      job.kind === "new_match" ? "Pinkstorm FC · Có trận mới" : "Pinkstorm FC · Lịch đá hôm nay";
    body = matchNotificationText(match.data);
    url = "/matches/" + match.data.id;
  }
  return {
    subscription: { endpoint: device.data.endpoint, keys: device.data.keys },
    payload: { title, body, url, tag: job.event_key },
  };
}

export async function dispatchPush(includeScheduled = false) {
  if (!pushEnabled()) return { sent: 0, skipped: 0, retry: 0 };
  const db = pushDb();
  if (includeScheduled) await enqueueScheduled(new Date());
  // Mark abandoned/exhausted jobs explicitly so the dashboard does not show them pending forever.
  const expired = await db
    .from("push_deliveries")
    .update({ status: "skipped", error_code: "EXPIRED" })
    .in("status", ["pending", "processing"])
    .lte("expires_at", new Date().toISOString());
  const exhausted = await db
    .from("push_deliveries")
    .update({ status: "failed", error_code: "RETRIES_EXHAUSTED" })
    .in("status", ["pending", "processing"])
    .gte("attempts", 5)
    .lte("available_at", new Date().toISOString());
  if (expired.error || exhausted.error) throw new Error("PUSH_DATABASE_ERROR");
  const { data, error } = await db.rpc("claim_push_deliveries", { batch_size: 20 });
  if (error) throw new Error("PUSH_DATABASE_ERROR");
  const counts = { sent: 0, skipped: 0, retry: 0 };
  const pending = [...(data as Delivery[])];
  // Four bounded workers keep the request short without saturating free-tier resources.
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (pending.length) {
        const job = pending.shift()!;
        let status = "sent";
        let code: string | null = null;
        try {
          const message = await payloadFor(job, new Date());
          if (!message) status = "skipped";
          else
            await sendPush(
              message.subscription,
              message.payload,
              Math.floor((new Date(job.expires_at).getTime() - Date.now()) / 1000),
            );
        } catch (error) {
          const httpStatus = (error as { statusCode?: number }).statusCode;
          if (httpStatus === 404 || httpStatus === 410) {
            const result = await db
              .from("push_devices")
              .update({ enabled: false })
              .eq("id", job.device_id);
            if (result.error) console.error("PUSH_DISABLE_FAILED");
            status = "skipped";
            code = "SUBSCRIPTION_EXPIRED";
          } else {
            status = job.attempts >= 5 ? "failed" : "pending";
            code = httpStatus ? "PUSH_HTTP_" + httpStatus : "PUSH_SEND_ERROR";
          }
        }
        const result = await db
          .from("push_deliveries")
          .update({
            status,
            error_code: code,
            sent_at: status === "sent" ? new Date().toISOString() : null,
            available_at: new Date(
              Date.now() + Math.min(30, 2 ** job.attempts) * 60000,
            ).toISOString(),
          })
          .eq("id", job.id)
          .eq("lease_token", job.lease_token);
        if (result.error) throw new Error("PUSH_DATABASE_ERROR");
        if (status === "sent") counts.sent++;
        else if (status === "skipped") counts.skipped++;
        else counts.retry++;
      }
    }),
  );
  return counts;
}
