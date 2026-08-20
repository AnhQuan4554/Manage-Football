import type { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api/http";
import {
  deleteTeamMember,
  getTeamMember,
  updateTeamMember,
} from "@/features/members/services/memberApiService";

type RouteParams = {
  params: Promise<{
    teamId: string;
    memberId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { teamId, memberId } = await params;
  const result = await getTeamMember(teamId, memberId);

  if (result.success && !result.data) {
    return jsonResponse({ success: false, message: "Không tìm thấy thành viên", error: "Member not found" }, 404);
  }

  return jsonResponse(result, result.success ? 200 : 400);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { teamId, memberId } = await params;
  const body = await request.json();
  const result = await updateTeamMember(teamId, memberId, body);

  return jsonResponse(result, result.success ? 200 : 400);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { teamId, memberId } = await params;
  const result = await deleteTeamMember(teamId, memberId);

  return jsonResponse(result, result.success ? 200 : 400);
}
