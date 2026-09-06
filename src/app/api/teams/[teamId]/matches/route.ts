import { jsonResponse } from "@/lib/api/http";
import { createTeamMatch, listTeamMatches } from "@/features/matches/services/matchApiService";
import type { NextRequest } from "next/server";
import { after } from "next/server";
import { dispatchPush, enqueueNewMatch } from "@/features/notifications/dispatch";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  // Enqueue only after every existing creation step has succeeded.
  if (result.success && result.data) {
    try {
      await enqueueNewMatch(result.data.id);
      after(async () => {
        try {
          await dispatchPush();
        } catch {
          console.error("PUSH_DISPATCH_DEFERRED");
        }
      });
    } catch {
      // The match already exists: do not return a create error that encourages duplicates.
      console.error("PUSH_ENQUEUE_FAILED", result.data.id);
      result.message = "Đã tạo trận, nhưng chưa xếp được thông báo. Liên hệ quản trị để gửi lại.";
    }
  }

  return jsonResponse(result, result.success ? 201 : 400);
}
