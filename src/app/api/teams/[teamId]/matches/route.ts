import { jsonResponse } from "@/lib/api/http";
import { createTeamMatch, listTeamMatches } from "@/features/matches/services/matchApiService";
import type { NextRequest } from "next/server";

type RouteParams = {
  params: Promise<{
    teamId: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { teamId } = await params;
  const result = await listTeamMatches(teamId);

  return jsonResponse(result, result.success ? 200 : 400);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { teamId } = await params;
  const body = await request.json();
  const result = await createTeamMatch(teamId, body);

  return jsonResponse(result, result.success ? 201 : 400);
}
