import { fail, ok } from "@/lib/response";
import { getCurrentTeam } from "@/features/team-profile/services/teamService";
import { listTeamMembers } from "@/features/members/services/memberApiService";

export async function getMembers() {
  const teamResponse = await getCurrentTeam();
  if (!teamResponse.success || !teamResponse.data) {
    return fail(teamResponse.error ?? "Không thể tải danh sách đội", teamResponse.message ?? "Không thể tải danh sách đội");
  }

  const membersResponse = await listTeamMembers(teamResponse.data.id);
  if (!membersResponse.success) {
    return fail(membersResponse.error ?? "Không thể tải thành viên", membersResponse.message ?? "Không thể tải thành viên");
  }

  return ok(membersResponse.data ?? []);
}

export async function getActiveMembers() {
  const membersResponse = await getMembers();
  if (!membersResponse.success) {
    return fail(membersResponse.error ?? "Không thể tải thành viên", membersResponse.message);
  }

  return ok((membersResponse.data ?? []).filter((member) => member.status === "active"));
}

export async function getMemberById(memberId: string) {
  const membersResponse = await getMembers();
  if (!membersResponse.success) {
    return fail(membersResponse.error ?? "Không thể tải thành viên", membersResponse.message);
  }

  return ok((membersResponse.data ?? []).find((member) => member.id === memberId));
}
