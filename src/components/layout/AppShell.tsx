import { getCurrentTeam, getMyTeams } from "@/features/team-profile/services/teamService";
import { AppShellFrame } from "@/components/layout/AppShellFrame";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [teamResponse, teamsResponse] = await Promise.all([getCurrentTeam(), getMyTeams()]);
  const team = teamResponse.data!;
  const teams = teamsResponse.data ?? [team];

  return <AppShellFrame team={team} teams={teams}>{children}</AppShellFrame>;
}
