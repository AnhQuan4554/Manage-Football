export type TeamRole = "owner" | "captain" | "treasurer" | "member";
export type MemberStatus = "active" | "pending" | "inactive";

export type TeamMember = {
  id: string;
  teamId: string;
  fullName: string;
  nickname: string;
  phone: string;
  shirtNumber: number;
  role: TeamRole;
  status: MemberStatus;
  avatarUrl?: string;
  joinedAt: string;
};

export function canManageMembers(role: TeamRole) {
  return role === "owner" || role === "captain";
}

export function canManageFunds(role: TeamRole) {
  return role === "owner" || role === "captain" || role === "treasurer";
}

export function canManageMatches(role: TeamRole) {
  return role === "owner" || role === "captain" || role === "treasurer";
}
