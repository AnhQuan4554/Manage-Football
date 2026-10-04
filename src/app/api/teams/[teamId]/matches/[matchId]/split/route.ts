import { requireAdmin } from "@/features/auth/server";
import { jsonResponse } from "@/lib/api/http";
import { recalculateMatchSplit } from "@/features/matches/services/matchApiService";
import type { NextRequest } from "next/server";

type RouteParams = {
  params: Promise<{
    teamId: string;
    matchId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const permission = await requireAdmin();
  if (permission.status !== 200) return jsonResponse(permission.result, permission.status);
  const { teamId, matchId } = await params;
  const body = await request.json();
  const result = await recalculateMatchSplit(teamId, matchId, body);

  return jsonResponse(result, result.success ? 200 : 400);
}
