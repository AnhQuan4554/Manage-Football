import type { TeamRole } from "@/features/members/types";

const labels: Record<TeamRole, string> = {
  owner: "Chủ đội",
  captain: "ĐT - Đội trưởng",
  treasurer: "TQ - Thủ quỹ",
  member: "Thành viên",
};

export function RoleBadge({ role }: { role: TeamRole }) {
  return <span className={"role-pill role-pill-" + role}>{labels[role]}</span>;
}
