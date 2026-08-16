import { ok } from "@/lib/response";
import { mockTeam, otherTeams } from "@/lib/constants/mockData";

export async function getCurrentTeam() {
  return ok(mockTeam);
}

export async function getMyTeams() {
  return ok([mockTeam, ...otherTeams]);
}
