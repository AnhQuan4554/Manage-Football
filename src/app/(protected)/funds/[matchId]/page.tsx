import { Card, Statistic } from "antd";
import { BackButton } from "@/components/common/BackButton";
import { PageHeader } from "@/components/common/PageHeader";
import { CollectionPaymentList } from "@/features/funds/components/CollectionPaymentList";
import { getMatchById } from "@/features/matches/services/matchService";
import { getMatchSplit } from "@/features/funds/services/fundService";
import { getMembers } from "@/features/members/services/memberService";
import { formatVnd } from "@/lib/utils/format";

export default async function MatchFundPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const [match, split, members] = await Promise.all([
    getMatchById(matchId),
    getMatchSplit(matchId),
    getMembers(),
  ]);
  const matchData = match.data;
  const splitData = split.data;
  if (!matchData || !splitData) return <PageHeader title="Chưa có dữ liệu chia tiền" />;
  const totalPeople = splitData.includedMemberIds.length;
  const perHead = totalPeople ? splitData.totalAmount / totalPeople : 0;

  return (
    <div className="page-stack match-fund-page">
      <BackButton label="Quay lại trận" fallbackHref={`/matches/${matchId}`} />
      <PageHeader
        variant="form"
        title="Chia tiền sân"
        subtitle={`Pinkstorm FC vs ${matchData.opponentName}`}
      />
      <Card className="surface">
        <Statistic title="Mỗi người cần đóng" value={formatVnd(perHead)} />
        <Statistic title="Tổng tiền chia" value={formatVnd(splitData.totalAmount)} />
      </Card>
      <Card className="surface" title="Người trong danh sách chia tiền">
        <CollectionPaymentList
          teamId={matchData.teamId}
          matchId={matchId}
          items={splitData.items}
          members={members.data ?? []}
        />
      </Card>
    </div>
  );
}
