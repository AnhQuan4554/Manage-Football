import { ok } from "@/lib/response";
import { mockMatches } from "@/lib/constants/mockData";

export async function getMatches() {
  return ok(mockMatches);
}

export async function getNextMatch() {
  return ok(mockMatches.find((match) => match.status === "scheduled"));
}

export async function getMatchById(matchId: string) {
  return ok(mockMatches.find((match) => match.id === matchId));
}
