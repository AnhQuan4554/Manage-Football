import { jsonResponse } from "@/lib/api/http";
import { updateCollectionItemsPayment } from "@/features/matches/services/matchApiService";
import type { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    teamId: string;
    matchId: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { teamId, matchId } = await params;
  const body = await request.json();
  const result = await updateCollectionItemsPayment(teamId, matchId, body);

  return jsonResponse(result, result.success ? 200 : 400);
}
