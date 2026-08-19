import { Avatar } from "antd";
import type { TeamMember } from "@/features/members/types";
import { uiColors } from "@/lib/constants/colors";

export function PlayerAvatar({ member, size = 40 }: { member: TeamMember; size?: number }) {
  return (
    <Avatar size={size} style={{ background: uiColors.ink.navy, color: uiColors.neutral.white }}>
      {member.shirtNumber}
    </Avatar>
  );
}
