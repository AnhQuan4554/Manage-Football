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
