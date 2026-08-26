import { PageHeader } from "@/components/common/PageHeader";
import { FundOverview } from "@/features/funds/components/FundOverview";
import { getFundOverview } from "@/features/funds/services/fundService";
import { getMatches } from "@/features/matches/services/matchService";
import { getMembers } from "@/features/members/services/memberService";

export default async function FundsPage() {
  const [funds, matches, members] = await Promise.all([getFundOverview(), getMatches(), getMembers()]);
  const data = funds.data!;
  const split = data.matchSplits.find((item) => item.paidMemberIds.length < item.includedMemberIds.length) ?? data.matchSplits[0];
  const match = split ? matches.data?.find((item) => item.id === split.matchId) : undefined;

  return (
    <div className="page-stack">
      <PageHeader title="Quỹ đội" subtitle="Chia tiền sân theo trận, theo dõi đã đóng/chưa đóng và thu chi nhẹ." />
      <FundOverview
        balance={data.balance}
        transactions={data.transactions}
        split={split}
        match={match}
        members={members.data ?? []}
        matchSplits={data.matchSplits}
        matches={matches.data ?? []}
      />
    </div>
  );
}
