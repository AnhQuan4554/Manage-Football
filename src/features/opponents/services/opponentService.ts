import { createClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/response";
import { getCurrentTeam } from "@/features/team-profile/services/teamService";
import type { CreateOpponentInput, Opponent } from "@/features/opponents/types";

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

const opponentSelect = "id, team_id, name, contact_name, phone, note, last_played_at, created_at, updated_at";

function validateCreateOpponentInput(input: CreateOpponentInput) {
  if (!input.name?.trim()) {
    return "name is required";
  }

  return null;
}

export async function createOpponent(teamId: string, input: CreateOpponentInput) {
  const validationError = validateCreateOpponentInput(input);
  if (validationError) {
    return fail(validationError, "Tên đối thủ là bắt buộc");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opponents")
    .insert({
      team_id: teamId,
      name: input.name.trim(),
      contact_name: input.contactName?.trim() || null,
      phone: input.phone?.trim() || null,
      note: input.note?.trim() || null,
    })
    .select(opponentSelect)
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return fail(error.message, "Đối thủ này đã tồn tại trong đội");
    }

    return fail(error.message, "Không thể tạo đối thủ");
  }

  return ok(normalizeOpponent(data as DbOpponent), "Tạo đối thủ thành công");
}

export async function listTeamOpponents(teamId: string, query?: string) {
  const supabase = await createClient();
  let request = supabase
    .from("opponents")
    .select(opponentSelect)
    .eq("team_id", teamId)
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

export async function listOpponents(query?: string) {
  const teamResponse = await getCurrentTeam();
  if (!teamResponse.success || !teamResponse.data) {
    return fail(teamResponse.error ?? "Không thể tải đội hiện hành", teamResponse.message ?? "Không thể tải đội hiện hành");
  }

  return listTeamOpponents(teamResponse.data.id, query);
}
