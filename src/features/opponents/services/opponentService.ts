import { createClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/response";
import { getCurrentTeam } from "@/features/team-profile/services/teamService";
import type { Opponent } from "@/features/opponents/types";

type DbOpponent = {
  id: string;
  team_id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  note: string | null;
  last_played_at: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeOpponent(row: DbOpponent): Opponent {
  return {
    id: row.id,
    teamId: row.team_id,
    name: row.name,
    contactName: row.contact_name,
    phone: row.phone,
    note: row.note,
    lastPlayedAt: row.last_played_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listOpponents(query?: string) {
  const teamResponse = await getCurrentTeam();
  if (!teamResponse.success || !teamResponse.data) {
    return fail(teamResponse.error ?? "Không thể tải đội hiện hành", teamResponse.message ?? "Không thể tải đội hiện hành");
  }

  const supabase = await createClient();
  let request = supabase
    .from("opponents")
    .select("id, team_id, name, contact_name, phone, note, last_played_at, created_at, updated_at")
    .eq("team_id", teamResponse.data.id)
    .order("last_played_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (query?.trim()) {
    request = request.ilike("name", `%${query.trim()}%`);
  }

  const { data, error } = await request;

  if (error) {
    return fail(error.message, "Không thể tải danh sách đối thủ");
  }

  return ok(((data ?? []) as DbOpponent[]).map(normalizeOpponent));
}
