import { ok } from "@/lib/response";
import { mockTransactions } from "@/lib/constants/mockData";
import { getMatchDetail, getMatches } from "@/features/matches/services/matchService";
import type { MatchDetailResponse } from "@/features/matches/services/matchApiService";
import type { MatchSplit } from "@/features/funds/types";

type MatchCollection = NonNullable<MatchDetailResponse["collection"]>;

function splitFromCollection(matchId: string, collection: MatchCollection): MatchSplit {
  const includedMemberIds = collection.items
    .filter((item) => item.chargeable && Boolean(item.membershipId))
    .map((item) => item.membershipId as string);
  const paidMemberIds = collection.items
    .filter((item) => item.chargeable && Boolean(item.membershipId) && item.amountPaid >= item.amountDue && item.amountDue > 0)
    .map((item) => item.membershipId as string);

  return {
    matchId,
    totalAmount: collection.totalAmount,
    includedMemberIds,
    paidMemberIds,
  };
}

export async function getFundOverview() {
  const matchesResponse = await getMatches();
  const completedMatches = (matchesResponse.data ?? []).filter((match) => match.status === "completed");

  const splitResults = await Promise.all(
    completedMatches.map(async (match) => {
      const detail = await getMatchDetail(match.id);
      return detail.data?.collection ? splitFromCollection(match.id, detail.data.collection) : undefined;
    }),
  );

  const openingBalance = 1450000;
  const balance = mockTransactions.reduce(
    (total, item) => total + (item.type === "income" ? item.amount : -item.amount),
    openingBalance,
  );

  return ok({ openingBalance, balance, transactions: mockTransactions, matchSplits: splitResults.filter((item): item is MatchSplit => Boolean(item)) });
}

export async function getMatchSplit(matchId: string) {
  const matchResponse = await getMatchDetail(matchId);
  return ok(matchResponse.data?.collection ? splitFromCollection(matchId, matchResponse.data.collection) : undefined);
}
