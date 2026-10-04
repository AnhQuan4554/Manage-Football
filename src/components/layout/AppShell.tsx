import { getCurrentAccount } from "@/features/auth/server";
import { cookies } from "next/headers";
import { getMyTeams } from "@/features/team-profile/services/teamService";
import { AppShellFrame } from "@/components/layout/AppShellFrame";
import { mockTeam } from "@/lib/constants/mockData";
import type { Team } from "@/features/team-profile/types";
import { PermissionsProvider } from "@/features/auth/components/Permissions";
import { isAdmin } from "@/features/auth/utils";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const [teamsResponse, account] = await Promise.all([getMyTeams(), getCurrentAccount()]);
  const selectedTeamId = (await cookies()).get("currentTeamId")?.value;
  const team = selectCurrentTeam(teamsResponse.data ?? [], selectedTeamId) ?? mockTeam;
  const teams = mergeTeams(teamsResponse.data?.length ? teamsResponse.data : [team], team);

  return (
    <PermissionsProvider canManage={isAdmin(account)}>
      <AppShellFrame team={team} teams={teams} account={account}>
        {children}
      </AppShellFrame>
    </PermissionsProvider>
  );
}

function selectCurrentTeam(teams: Team[], selectedTeamId?: string) {
  return (
    (selectedTeamId ? teams.find((team) => team.id === selectedTeamId) : undefined) ?? teams[0]
  );
}

function mergeTeams(teams: Team[], currentTeam: Team) {
  const teamMap = new Map<string, Team>();
  [currentTeam, ...teams].forEach((team) => {
    teamMap.set(team.id, team);
  });

  return Array.from(teamMap.values());
}
