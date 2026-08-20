import { getCurrentTeam, listTeams } from "@/features/team-profile/services/teamApiService";

export { getCurrentTeam };

export async function getMyTeams() {
  return listTeams();
}
