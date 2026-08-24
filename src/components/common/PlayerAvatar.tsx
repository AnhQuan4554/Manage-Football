import type { CSSProperties } from "react";
import type { TeamMember } from "@/features/members/types";

const avatarColors = ["#c4498f", "#5c72d6", "#0da36b", "#c96b00", "#8d5ce6", "#0696b6", "#d34353", "#5f9300", "#b65aa6", "#008f8d", "#9a8500"];

function initials(member: TeamMember) {
  const source = member.nickname || member.fullName;
  const words = source.trim().split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return ((words[0][0] ?? "") + (words[words.length - 1][0] ?? "")).toUpperCase();
}

function colorFor(member: TeamMember) {
  const seed = Array.from(member.id || member.nickname).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[seed % avatarColors.length];
}

export function PlayerAvatar({ member, size = 44 }: { member: TeamMember; size?: number }) {
  return (
    <span
      className="player-avatar"
      style={{ "--avatar-size": String(size) + "px", "--avatar-bg": colorFor(member) } as CSSProperties}
    >
      <span>{initials(member)}</span>
      <span className="player-avatar-number">{member.shirtNumber}</span>
    </span>
  );
}
