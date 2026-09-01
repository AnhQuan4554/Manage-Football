import { ok } from "@/lib/response";
import { getMatchDetail, getMatches } from "@/features/matches/services/matchService";
import type { MatchDetailResponse } from "@/features/matches/services/matchApiService";
import type { FundTransaction, MatchSplit, MatchSplitSummary } from "@/features/funds/types";

type MatchCollection = NonNullable<MatchDetailResponse["collection"]>;

function getSplitPerHead(split: MatchSplit, totalCount: number) {
  const firstDueItem = split.items.find((item) => item.chargeable && item.amountDue > 0);
  return (
    firstDueItem?.amountDue ??
    (totalCount ? Math.round(split.totalAmount / totalCount / 1000) * 1000 : 0)
  );
}

function buildTransactionsFromSplits(matchSplits: MatchSplit[]): FundTransaction[] {
  return matchSplits.flatMap((split) =>
    split.items
      .filter((item) => item.chargeable && item.amountPaid > 0)
      .map((item) => ({
        id: `collection-item-${item.id}`,
        teamId: split.matchId,
        memberId: item.membershipId ?? undefined,
        type: "income" as const,
        category: "football" as const,
        amount: item.amountPaid,
        title: `Thu tiền sân - ${item.participantName}`,
        note: item.paymentNote ?? item.note ?? undefined,
        occurredAt: (item.paidAt ?? new Date().toISOString()).slice(0, 10),
        createdBy: item.membershipId ?? "system",
      })),
  );
}

function splitFromCollection(matchId: string, collection: MatchCollection): MatchSplit {
  const includedMemberIds = collection.items
    .filter((item) => item.chargeable && Boolean(item.membershipId))
    .map((item) => item.membershipId as string);
  const paidMemberIds = collection.items
    .filter(
      (item) =>
        item.chargeable &&
        Boolean(item.membershipId) &&
        item.amountPaid >= item.amountDue &&
        item.amountDue > 0,
    )
    .map((item) => item.membershipId as string);

  return {
    matchId,
    totalAmount: collection.totalAmount,
    includedMemberIds,
    paidMemberIds,
    items: collection.items,
  };
}

export function summarizeMatchSplit(split: MatchSplit): MatchSplitSummary {
  const totalCount = split.includedMemberIds.length;
  const paidCount = split.paidMemberIds.length;
  const perHead = getSplitPerHead(split, totalCount);
  const unpaidMemberIds = split.includedMemberIds.filter(
    (memberId) => !split.paidMemberIds.includes(memberId),
  );

  return {
    ...split,
    perHead,
    total: totalCount,
    paid: paidCount,
    totalCount,
    paidCount,
    unpaidCount: unpaidMemberIds.length,
    paidAmount: split.items.reduce((sum, item) => sum + item.amountPaid, 0),
    unpaidAmount: Math.max(
      0,
      split.totalAmount - split.items.reduce((sum, item) => sum + item.amountPaid, 0),
    ),
    unpaidMemberIds,
    isComplete: unpaidMemberIds.length === 0,
  };
}

export async function getFundOverview() {
  const matchesResponse = await getMatches();
  const completedMatches = (matchesResponse.data ?? []).filter(
    (match) => match.status === "completed",
  );

  const splitResults = await Promise.all(
    completedMatches.map(async (match) => {
      const detail = await getMatchDetail(match.id);
      return detail.data?.collection
        ? splitFromCollection(match.id, detail.data.collection)
        : undefined;
    }),
  );

  const openingBalance = 0;
  const matchSplits = splitResults.filter((item): item is MatchSplit => Boolean(item));
  const matchSplitSummaries = matchSplits.map((split) => summarizeMatchSplit(split));
  const transactions = buildTransactionsFromSplits(matchSplits);
  const balance = transactions.reduce(
    (total, item) => total + (item.type === "income" ? item.amount : -item.amount),
    openingBalance,
  );

  return ok({
    openingBalance,
    balance,
    transactions,
    matchSplits,
    matchSplitSummaries,
    incompleteMatchCount: matchSplitSummaries.filter((item) => !item.isComplete).length,
  });
}

export async function getMatchSplit(matchId: string) {
  const matchResponse = await getMatchDetail(matchId);
  return ok(
    matchResponse.data?.collection
      ? splitFromCollection(matchId, matchResponse.data.collection)
      : undefined,
  );
}
