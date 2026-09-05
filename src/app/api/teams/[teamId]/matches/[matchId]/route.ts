import { jsonResponse } from "@/lib/api/http";
import { revalidatePath } from "next/cache";
import { getTeamMatch } from "@/features/matches/services/matchApiService";
import { deleteTeamMatch, updateTeamMatch } from "@/features/matches/services/matchApiService";
import type { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    teamId: string;
    matchId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { teamId, matchId } = await params;
  const result = await getTeamMatch(teamId, matchId);

  return jsonResponse(result, result.success ? 200 : 404);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { teamId, matchId } = await params;
  const body = await request.json();
  const result = await updateTeamMatch(teamId, matchId, body);

  return jsonResponse(result, result.success ? 200 : 400);
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { teamId, matchId } = await params;
  const result = await deleteTeamMatch(teamId, matchId);

  if (result.success) {
    revalidatePath("/", "layout");
  }

  return jsonResponse(result, result.success ? 200 : 400);
}
