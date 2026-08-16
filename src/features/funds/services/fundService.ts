import { ok } from "@/lib/response";
import { mockMatchSplits, mockTransactions } from "@/lib/constants/mockData";

export async function getFundOverview() {
  const openingBalance = 1450000;
  const balance = mockTransactions.reduce(
    (total, item) => total + (item.type === "income" ? item.amount : -item.amount),
    openingBalance,
  );

  return ok({ openingBalance, balance, transactions: mockTransactions, matchSplits: mockMatchSplits });
}

export async function getMatchSplit(matchId: string) {
  return ok(mockMatchSplits.find((split) => split.matchId === matchId));
}
