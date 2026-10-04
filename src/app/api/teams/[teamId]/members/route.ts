import { requireAdmin } from "@/features/auth/server";
import { jsonResponse } from "@/lib/api/http";
import { createTeamMember, listTeamMembers } from "@/features/members/services/memberApiService";
import type { NextRequest } from "next/server";

type RouteParams = {
  params: Promise<{
    teamId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  console.log("calling listTeamMembers");
  const { teamId } = await params;
  const result = await listTeamMembers(teamId);

  return jsonResponse(result);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const permission = await requireAdmin();
  if (permission.status !== 200) return jsonResponse(permission.result, permission.status);
  const { teamId } = await params;
  const body = await request.json();
  const result = await createTeamMember(teamId, body);

  return jsonResponse(result, result.success ? 201 : 400);
}
