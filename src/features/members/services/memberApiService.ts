import { fail, ok, type AppResponse } from "@/lib/response";
import { createClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeout";
import type { TeamMember, TeamRole, MemberStatus } from "@/features/members/types";

type DbTeamMember = {
  id: string;
  team_id: string;
  user_id: string | null;
  role: "owner" | "captain" | "deputy" | "member" | "treasurer";
  jersey_number: number | null;
  full_name: string | null;
  nickname: string | null;
  phone: string | null;
  status: "pending" | "active" | "inactive" | "removed";
  joined_at: string;
};

export type CreateMemberInput = {
  fullName: string;
  nickname?: string;
  phone?: string;
  shirtNumber: number;
  role?: TeamRole;
  status?: MemberStatus;
};

export type UpdateMemberInput = Partial<CreateMemberInput>;

const memberSelect = "id, team_id, user_id, role, jersey_number, full_name, nickname, phone, status, joined_at";

function normalizeRole(role: DbTeamMember["role"]): TeamRole {
  return role === "deputy" ? "member" : role;
}

function normalizeStatus(status: DbTeamMember["status"]): MemberStatus {
  return status === "removed" ? "inactive" : status;
}

function normalizeMember(row: DbTeamMember): TeamMember {
  const fullName = row.full_name?.trim() || row.nickname?.trim() || "Chưa đặt tên";

  return {
    id: row.id,
    teamId: row.team_id,
    fullName,
    nickname: row.nickname?.trim() || fullName,
    phone: row.phone ?? "",
    shirtNumber: row.jersey_number ?? 0,
    role: normalizeRole(row.role),
    status: normalizeStatus(row.status),
    joinedAt: row.joined_at,
  };
}

function validateCreateMemberInput(input: CreateMemberInput) {
  if (!input.fullName?.trim()) return "fullName is required";
  if (!Number.isInteger(input.shirtNumber) || input.shirtNumber < 0 || input.shirtNumber > 99) {
    return "shirtNumber must be between 0 and 99";
  }
  if (input.role && !["owner", "captain", "treasurer", "member"].includes(input.role)) {
    return "role is invalid";
  }
  if (input.status && !["active", "pending", "inactive"].includes(input.status)) {
    return "status is invalid";
  }
  return null;
}

function validateUpdateMemberInput(input: UpdateMemberInput) {
  if (input.fullName !== undefined && !input.fullName.trim()) return "fullName is required";
  if (
    input.shirtNumber !== undefined
    && (!Number.isInteger(input.shirtNumber) || input.shirtNumber < 0 || input.shirtNumber > 99)
  ) {
    return "shirtNumber must be between 0 and 99";
  }
  if (input.role && !["owner", "captain", "treasurer", "member"].includes(input.role)) {
    return "role is invalid";
  }
  if (input.status && !["active", "pending", "inactive"].includes(input.status)) {
    return "status is invalid";
  }
  return null;
}

function buildMemberUpdatePayload(input: UpdateMemberInput) {
  return {
    ...(input.fullName !== undefined ? { full_name: input.fullName.trim() } : {}),
    ...(input.nickname !== undefined ? { nickname: input.nickname.trim() || input.fullName?.trim() || null } : {}),
    ...(input.phone !== undefined ? { phone: input.phone.trim() || null } : {}),
    ...(input.shirtNumber !== undefined ? { jersey_number: input.shirtNumber } : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    updated_at: new Date().toISOString(),
  };
}

export async function listTeamMembers(teamId: string): Promise<AppResponse<TeamMember[]>> {
  const supabase = await createClient();
  let result: {
    data: DbTeamMember[] | null;
    error: { message: string } | null;
  };

  try {
    result = await withSupabaseTimeout(
      supabase
        .from("team_members")
        .select(memberSelect)
        .eq("team_id", teamId)
        .neq("status", "removed")
        .order("joined_at", { ascending: true }),
      "List team members",
    ) as typeof result;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Không thể tải thành viên", "Không thể tải thành viên");
  }

  const { data, error } = result;

  if (error) {
    return fail(error.message, "Không thể tải thành viên");
  }

  return ok(((data ?? []) as DbTeamMember[]).map(normalizeMember));
}

export async function getTeamMember(teamId: string, memberId: string): Promise<AppResponse<TeamMember | null>> {
  const supabase = await createClient();
  let result: {
    data: DbTeamMember | null;
    error: { message: string } | null;
  };

  try {
    result = await withSupabaseTimeout(
      supabase
        .from("team_members")
        .select(memberSelect)
        .eq("team_id", teamId)
        .eq("id", memberId)
        .neq("status", "removed")
        .maybeSingle(),
      "Get team member",
    ) as typeof result;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Không thể tải thành viên", "Không thể tải thành viên");
  }

  const { data, error } = result;

  if (error) {
    return fail(error.message, "Không thể tải thành viên");
  }

  return ok(data ? normalizeMember(data) : null);
}

export async function createTeamMember(
  teamId: string,
  input: CreateMemberInput,
): Promise<AppResponse<TeamMember>> {
  const validationError = validateCreateMemberInput(input);
  if (validationError) {
    return fail(validationError);
  }

  const supabase = await createClient();
  let result: {
    data: DbTeamMember | null;
    error: { message: string } | null;
  };

  try {
    result = await withSupabaseTimeout(
      supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          full_name: input.fullName.trim(),
          nickname: input.nickname?.trim() || input.fullName.trim(),
          phone: input.phone?.trim() || null,
          jersey_number: input.shirtNumber,
          role: input.role ?? "member",
          status: input.status ?? "active",
        })
        .select(memberSelect)
        .single(),
      "Create team member",
    ) as typeof result;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Không thể tạo thành viên", "Không thể tạo thành viên");
  }

  const { data, error } = result;

  if (error) {
    return fail(error.message, "Không thể tạo thành viên");
  }

  return ok(normalizeMember(data as DbTeamMember), "Tạo thành viên thành công");
}

export async function updateTeamMember(
  teamId: string,
  memberId: string,
  input: UpdateMemberInput,
): Promise<AppResponse<TeamMember>> {
  const validationError = validateUpdateMemberInput(input);
  if (validationError) {
    return fail(validationError);
  }

  const supabase = await createClient();
  let result: {
    data: DbTeamMember | null;
    error: { message: string } | null;
  };

  try {
    result = await withSupabaseTimeout(
      supabase
        .from("team_members")
        .update(buildMemberUpdatePayload(input))
        .eq("team_id", teamId)
        .eq("id", memberId)
        .neq("status", "removed")
        .select(memberSelect)
        .single(),
      "Update team member",
    ) as typeof result;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Không thể cập nhật thành viên", "Không thể cập nhật thành viên");
  }

  const { data, error } = result;

  if (error) {
    return fail(error.message, "Không thể cập nhật thành viên");
  }

  return ok(normalizeMember(data as DbTeamMember), "Cập nhật thành viên thành công");
}

export async function deleteTeamMember(teamId: string, memberId: string): Promise<AppResponse<{ id: string }>> {
  const supabase = await createClient();
  let result: {
    data: { id: string } | null;
    error: { message: string } | null;
  };

  try {
    result = await withSupabaseTimeout(
      supabase
        .from("team_members")
        .update({ status: "removed", updated_at: new Date().toISOString() })
        .eq("team_id", teamId)
        .eq("id", memberId)
        .select("id")
        .single(),
      "Delete team member",
    ) as typeof result;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Không thể xoá thành viên", "Không thể xoá thành viên");
  }

  const { data, error } = result;

  if (error) {
    return fail(error.message, "Không thể xoá thành viên");
  }

  return ok({ id: (data as { id: string }).id }, "Xoá thành viên thành công");
}
