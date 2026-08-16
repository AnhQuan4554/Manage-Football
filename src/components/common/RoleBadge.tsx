import { Tag } from "antd";
import type { TeamRole } from "@/features/members/types";

const labels: Record<TeamRole, string> = {
  owner: "Chủ đội",
  captain: "Đội trưởng",
  treasurer: "Thủ quỹ",
  member: "Thành viên",
};

export function RoleBadge({ role }: { role: TeamRole }) {
  return <Tag color={role === "member" ? "default" : "magenta"}>{labels[role]}</Tag>;
}
