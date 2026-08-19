import { PageHeader } from "@/components/common/PageHeader";
import { PermissionNotice } from "@/components/common/StateBlocks";
import { FundOverview } from "@/features/funds/components/FundOverview";
import { getFundOverview } from "@/features/funds/services/fundService";
import { getMatches } from "@/features/matches/services/matchService";
import { getMembers } from "@/features/members/services/memberService";

export default async function FundsPage() {
  const [funds, matches, members] = await Promise.all([getFundOverview(), getMatches(), getMembers()]);
  const data = funds.data!;
  const split = data.matchSplits[0];
  const match = matches.data?.find((item) => item.id === split.matchId);

  return (
    <div className="page-stack">
      <PageHeader title="Quỹ đội" subtitle="Chia tiền sân theo trận, theo dõi đã đóng/chưa đóng và thu chi nhẹ." />
      <PermissionNotice description="Đội phó/thành viên không thấy thao tác quản lý thu chi. Phần xem số dư và chia tiền vẫn được giữ." />
      <FundOverview balance={data.balance} transactions={data.transactions} split={split} match={match} members={members.data ?? []} />
    </div>
  );
}
