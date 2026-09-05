import { createClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/response";
import { getCurrentTeam } from "@/features/team-profile/services/teamService";
import type { CreateOpponentInput, Opponent } from "@/features/opponents/types";

type DbMatchOpponent = {
  id: string;
  team_id: string;
  opponent_name: string;
  opponent_phone: string | null;
  match_date_time: string;
  created_at: string;
  updated_at: string;
};

function normalizeOpponentName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function createOpponentFromMatch(row: DbMatchOpponent): Opponent {
  const name = normalizeOpponentName(row.opponent_name);

  return {
    id: row.id,
    teamId: row.team_id,
    name,
    contactName: null,
    phone: row.opponent_phone,
    note: null,
    lastPlayedAt: row.match_date_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    matchCount: 1,
  };
}

export async function createOpponent(_teamId: string, _input: CreateOpponentInput) {
  return fail(
    "OPPONENTS_ARE_DERIVED_FROM_MATCHES",
    "Đối thủ sẽ tự lưu sau khi tạo trận có tên đối thủ",
  );
}

export async function listTeamOpponents(teamId: string, query?: string) {
  const supabase = await createClient();
  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  const { data, error } = await supabase
    .from("matches")
    .select("id, team_id, opponent_name, opponent_phone, match_date_time, created_at, updated_at")
    .eq("team_id", teamId)
    .neq("status", "cancelled")
    .not("opponent_name", "is", null)
    .order("match_date_time", { ascending: false });

  if (error) {
    return fail(error.message, "Không thể tải danh sách đối thủ");
  }

  const opponentsByName = new Map<string, Opponent>();

  for (const row of (data ?? []) as DbMatchOpponent[]) {
    const name = normalizeOpponentName(row.opponent_name);
    if (!name) continue;
    if (normalizedQuery && !name.toLowerCase().includes(normalizedQuery)) continue;

    const key = name.toLowerCase();
    const current = opponentsByName.get(key);

    if (!current) {
      opponentsByName.set(key, createOpponentFromMatch(row));
      continue;
    }

    current.matchCount += 1;
    if (!current.phone && row.opponent_phone) {
      current.phone = row.opponent_phone;
    }
    if (new Date(row.match_date_time).getTime() > new Date(current.lastPlayedAt ?? 0).getTime()) {
      current.lastPlayedAt = row.match_date_time;
      current.updatedAt = row.updated_at;
    }
  }

  return ok(Array.from(opponentsByName.values()));
}

export async function listOpponents(query?: string) {
  const teamResponse = await getCurrentTeam();
  if (!teamResponse.success || !teamResponse.data) {
    return fail(
      teamResponse.error ?? "Không thể tải đội hiện hành",
      teamResponse.message ?? "Không thể tải đội hiện hành",
    );
  }

  return listTeamOpponents(teamResponse.data.id, query);
}
