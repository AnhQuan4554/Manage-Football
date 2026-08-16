import type { TeamRole } from "@/features/members/types";

export type Team = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  area: string;
  homePitch: string;
  intro: string;
  memberCount: number;
  myRole: TeamRole;
};
