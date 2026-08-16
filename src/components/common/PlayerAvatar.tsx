import { Avatar } from "antd";
import type { TeamMember } from "@/features/members/types";

export function PlayerAvatar({ member, size = 40 }: { member: TeamMember; size?: number }) {
  return (
    <Avatar size={size} style={{ background: "#151927", color: "#fff" }}>
      {member.shirtNumber}
    </Avatar>
  );
}
