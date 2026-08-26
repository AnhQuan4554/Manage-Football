import type { TeamMember } from "@/features/members/types";

export type FundCategory = "football" | "kit" | "party";

export type FundTransaction = {
  id: string;
  teamId: string;
  memberId?: string;
  type: "income" | "expense";
  category: FundCategory;
  amount: number;
  title: string;
  note?: string;
  occurredAt: string;
  createdBy: string;
};

export type MatchSplit = {
  matchId: string;
  totalAmount: number;
  includedMemberIds: string[];
  paidMemberIds: string[];
};

export type MatchSplitSummary = MatchSplit & {
  perHead: number;
  total: number;
  paid: number;
  totalCount: number;
  paidCount: number;
  unpaidCount: number;
  paidAmount: number;
  unpaidAmount: number;
  unpaidMemberIds: string[];
  isComplete: boolean;
  paidMembers?: TeamMember[];
  unpaidMembers?: TeamMember[];
};
