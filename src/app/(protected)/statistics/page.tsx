import { PageHeader } from "@/components/common/PageHeader";
import { StatisticsOverview } from "@/features/statistics/components/StatisticsOverview";
import { getFundOverview } from "@/features/funds/services/fundService";
import { getMatches } from "@/features/matches/services/matchService";
import { getMembers } from "@/features/members/services/memberService";

export default async function StatisticsPage() {
  const [funds, matches, members] = await Promise.all([
    getFundOverview(),
    getMatches(),
    getMembers(),
  ]);
  const data = funds.data!;
  const split =
    data.matchSplits.find((item) => item.paidMemberIds.length < item.includedMemberIds.length) ??
    data.matchSplits[0];
  const match = split ? matches.data?.find((item) => item.id === split.matchId) : undefined;

  return (
    <div className="page-stack">
      <PageHeader
        title="Thống kê"
        subtitle="Theo dõi tiền sân, công nợ thành viên và các trận cần xử lý."
      />
      <StatisticsOverview
        split={split}
        match={match}
        members={members.data ?? []}
        matchSplits={data.matchSplits}
        matches={matches.data ?? []}
      />
    </div>
  );
}
