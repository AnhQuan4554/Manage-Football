import { jsonResponse } from "@/lib/api/http";
import { updateCollectionItemPayment } from "@/features/matches/services/matchApiService";
import type { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    teamId: string;
    matchId: string;
    itemId: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { teamId, matchId, itemId } = await params;
  const body = await request.json();
  const result = await updateCollectionItemPayment(teamId, matchId, itemId, body);

  return jsonResponse(result, result.success ? 200 : 400);
}
