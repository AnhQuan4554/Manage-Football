import { cookies } from "next/headers";
import { fail, ok } from "@/lib/response";
import { createClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeout";
import type { Team } from "@/features/team-profile/types";
import type { TeamRole } from "@/features/members/types";
import { mockTeam } from "@/lib/constants/mockData";

type DbTeam = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  slogan: string | null;
  description: string | null;
  area: string | null;
  home_pitch: string | null;
  public_enabled: boolean;
};

type TeamsQueryResult = {
  data: DbTeam[] | null;
  error: { message: string } | null;
};

type TeamsQuerySingleResult = {
  data: DbTeam | null;
  error: { message: string } | null;
};

export type CreateTeamInput = {
  name: string;
  slug?: string;
  area?: string;
  homePitch?: string;
  intro?: string;
};

const defaultLogoUrl = "/logo-transparent.png";

function normalizeTeam(row: DbTeam, memberCount: number): Team {
  const isPinkstorm = row.slug === "pinkstorm-fc";
  const logoUrl = row.logo_url && row.logo_url !== "/logo.jpg" ? row.logo_url : defaultLogoUrl;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl,
    area: row.area ?? "Chưa cập nhật khu vực",
    homePitch: row.home_pitch ?? "Chưa cập nhật sân nhà",
    intro: row.description ?? row.slogan ?? "",
    memberCount,
    myRole: (isPinkstorm ? "captain" : "member") as TeamRole,
  };
}

async function countActiveMembers() {
  const supabase = await createClient();
  let result: {
    data: { team_id: string }[] | null;
    error: { message: string } | null;
  };

  try {
    result = await withSupabaseTimeout(
      supabase
        .from("team_members")
        .select("team_id")
        .eq("status", "active"),
      "Count active members",
    );
  } catch {
    return new Map<string, number>();
  }

  const { data, error } = result;

  if (error) {
    return new Map<string, number>();
  }

  return (data ?? []).reduce((countMap, row) => {
    const teamId = row.team_id as string;
    countMap.set(teamId, (countMap.get(teamId) ?? 0) + 1);
    return countMap;
  }, new Map<string, number>());
}

export async function listTeams() {
  const supabase = await createClient();
  let teamsResult: TeamsQueryResult;
  let countMap = new Map<string, number>();

  try {
    teamsResult = await withSupabaseTimeout(
      supabase
        .from("teams")
        .select("id, name, slug, logo_url, cover_url, slogan, description, area, home_pitch, public_enabled")
        .order("created_at", { ascending: true }),
      "List teams",
    ) as TeamsQueryResult;
  } catch (error) {
    console.log('err',error)
    return fail(error instanceof Error ? error.message : "Không thể tải danh sách đội", "Không thể tải danh sách đội");
  }

  if (teamsResult.error) {
    return fail(teamsResult.error.message, "Không thể tải danh sách đội");
  }

  const teams = (teamsResult.data ?? []) as DbTeam[];
  countMap = await countActiveMembers();

  return ok(teams.map((team) => normalizeTeam(team, countMap.get(team.id) ?? 0)));
}

export async function createTeam(input: CreateTeamInput) {
  if (!input.name?.trim()) {
    return fail("name is required", "Tên đội là bắt buộc");
  }

  const supabase = await createClient();
  let result: TeamsQuerySingleResult;

  try {
    result = await withSupabaseTimeout(
      supabase
        .from("teams")
        .insert({
          name: input.name.trim(),
          slug: input.slug?.trim() || slugify(input.name),
          logo_url: defaultLogoUrl,
          area: input.area?.trim() || null,
          home_pitch: input.homePitch?.trim() || null,
          description: input.intro?.trim() || null,
          public_enabled: true,
        })
        .select("id, name, slug, logo_url, cover_url, slogan, description, area, home_pitch, public_enabled")
        .single(),
      "Create team",
    ) as TeamsQuerySingleResult;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Không thể tạo đội", "Không thể tạo đội");
  }

  const { data, error } = result;

  if (error) {
    return fail(error.message, "Không thể tạo đội");
  }

  return ok(normalizeTeam(data as DbTeam, 0), "Tạo đội thành công");
}

export async function getCurrentTeam() {
  const teamsResponse = await listTeams();
  if (!teamsResponse.success || !teamsResponse.data?.length) {
    return ok(mockTeam);
  }

  const cookieStore = await cookies();
  const selectedTeamId = cookieStore.get("currentTeamId")?.value;
  const selectedTeam = selectedTeamId
    ? teamsResponse.data.find((team) => team.id === selectedTeamId)
    : undefined;

  return ok(selectedTeam ?? teamsResponse.data[0]);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
