import { jsonResponse } from "@/lib/api/http";
import { createOpponent, listTeamOpponents } from "@/features/opponents/services/opponentService";
import type { NextRequest } from "next/server";

type RouteParams = {
  params: Promise<{
    teamId: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { teamId } = await params;
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const result = await listTeamOpponents(teamId, query);

  return jsonResponse(result, result.success ? 200 : 400);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { teamId } = await params;
  const body = await request.json();
  const result = await createOpponent(teamId, body);

  return jsonResponse(result, result.success ? 201 : 400);
}
