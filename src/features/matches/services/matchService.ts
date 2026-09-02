import { fail, ok } from "@/lib/response";
import { getCurrentTeam } from "@/features/team-profile/services/teamService";
import {
  getTeamMatch,
  listTeamMatches,
  type MatchDetailResponse,
} from "@/features/matches/services/matchApiService";
import type { Match, AttendanceStatus } from "@/features/matches/types";

function mapDbStatus(
  status: "draft" | "open" | "lineup_ready" | "completed" | "cancelled",
): Match["status"] {
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "scheduled";
}

function formatDateTimeInZone(value: string, timeZone = "Asia/Ho_Chi_Minh") {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function buildAttendance(participants: MatchDetailResponse["participants"]) {
  return Object.fromEntries(
    participants.map((participant) => [
      participant.membershipId ?? participant.guestId ?? participant.id,
      (participant.response === "going"
        ? "going"
        : participant.response === "not_going"
          ? "absent"
          : "unknown") as AttendanceStatus,
    ]),
  ) as Match["attendance"];
}

function buildPaymentSummary(
  collection: MatchDetailResponse["collection"],
): Match["paymentSummary"] {
  if (!collection) return undefined;

  const chargeableItems = collection.items.filter((item) => item.chargeable && item.amountDue > 0);
  const paidCount = chargeableItems.filter((item) => item.amountPaid >= item.amountDue).length;
  const dueAmount = chargeableItems.reduce((sum, item) => sum + item.amountDue, 0);
  const paidAmount = chargeableItems.reduce((sum, item) => sum + item.amountPaid, 0);

  return {
    totalAmount: collection.totalAmount,
    dueAmount,
    paidAmount,
    chargeableCount: chargeableItems.length,
    paidCount,
    isFullyPaid: chargeableItems.length > 0 && paidCount === chargeableItems.length,
  };
}

function mapMatch(detail: MatchDetailResponse): Match {
  return {
    id: detail.match.id,
    teamId: detail.match.teamId,
    opponentName: detail.match.opponentName,
    opponentPhone: detail.match.opponentPhone ?? "",
    homeScore: detail.match.homeScore ?? 0,
    awayScore: detail.match.awayScore ?? 0,
    ...formatDateTimeInZone(detail.match.matchDateTime),
    pitch: detail.match.venueName,
    address: detail.match.address ?? "",
    pitchCost: detail.match.pitchCost,
    opponentFee: 0,
    note: detail.match.note ?? "",
    status: mapDbStatus(detail.match.status),
    zaloVoteStatus:
      detail.match.status === "cancelled"
        ? "error"
        : detail.match.status === "open" ||
            detail.match.status === "lineup_ready" ||
            detail.match.status === "completed"
          ? "created"
          : "none",
    formation: (detail.lineup?.formationCode as Match["formation"]) ?? "2-3-1",
    attendance: buildAttendance(detail.participants),
    paymentSummary: buildPaymentSummary(detail.collection),
    lineup: detail.lineup
      ? Object.fromEntries(detail.lineup.slots.map((slot) => [slot.slotKey, slot.participantId]))
      : {},
  };
}

export async function getMatches() {
  const teamResponse = await getCurrentTeam();
  if (!teamResponse.success || !teamResponse.data) {
    return fail(teamResponse.error ?? "Không thể tải team hiện hành");
  }
  const team = teamResponse.data;

  const matchesResponse = await listTeamMatches(team.id);
  if (!matchesResponse.success || !matchesResponse.data) {
    return fail(matchesResponse.error ?? "Không thể tải trận");
  }

  const details = await Promise.all(
    matchesResponse.data.map(async (match) => {
      const detail = await getTeamMatch(team.id, match.id);
      return detail.success && detail.data ? mapMatch(detail.data) : null;
    }),
  );

  return ok(details.filter((item): item is Match => Boolean(item)));
}

export async function getNextMatch() {
  const matchesResponse = await getMatches();
  if (!matchesResponse.success || !matchesResponse.data) {
    return fail(matchesResponse.error ?? "Không thể tải trận tiếp theo");
  }

  const next = matchesResponse.data
    .filter((match) => match.status === "scheduled")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0];

  return ok(next);
}

export async function getMatchById(matchId: string) {
  const teamResponse = await getCurrentTeam();
  if (!teamResponse.success || !teamResponse.data) {
    return fail(teamResponse.error ?? "Không thể tải team hiện hành");
  }

  const result = await getTeamMatch(teamResponse.data.id, matchId);
  if (!result.success || !result.data) {
    return fail(result.error ?? "Không thể tải trận");
  }

  return ok(mapMatch(result.data));
}

export async function getMatchDetail(matchId: string) {
  const teamResponse = await getCurrentTeam();
  if (!teamResponse.success || !teamResponse.data) {
    return fail(teamResponse.error ?? "Không thể tải team hiện hành");
  }

  return getTeamMatch(teamResponse.data.id, matchId);
}
