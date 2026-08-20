import { jsonResponse } from "@/lib/api/http";
import { createTeam, listTeams } from "@/features/team-profile/services/teamApiService";
import type { NextRequest } from "next/server";

export async function GET() {
  const result = await listTeams();

  return jsonResponse(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await createTeam(body);

  return jsonResponse(result, result.success ? 201 : 400);
}
