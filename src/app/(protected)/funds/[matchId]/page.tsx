import { Button, Card, Checkbox, Statistic } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { getMatchById } from "@/features/matches/services/matchService";
import { getMatchSplit } from "@/features/funds/services/fundService";
import { getMembers } from "@/features/members/services/memberService";
import { formatVnd } from "@/lib/utils/format";

export default async function MatchFundPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const [match, split, members] = await Promise.all([getMatchById(matchId), getMatchSplit(matchId), getMembers()]);
  const matchData = match.data;
  const splitData = split.data;
  if (!matchData || !splitData) return <PageHeader title="Chưa có dữ liệu chia tiền" />;
  const totalPeople = splitData.includedMemberIds.length;
  const perHead = totalPeople ? splitData.totalAmount / totalPeople : 0;

  return (
    <div className="page-stack">
      <PageHeader title="Chia tiền sân" subtitle={`Pinkstorm FC vs ${matchData.opponentName}`} />
      <Card className="surface">
        <Statistic title="Mỗi người cần đóng" value={formatVnd(perHead)} />
        <Statistic title="Tổng tiền chia" value={formatVnd(splitData.totalAmount)} />
      </Card>
      <Card className="surface" title="Người trong danh sách chia tiền">
        <div className="page-stack">
          {(members.data ?? []).filter((member) => splitData.includedMemberIds.includes(member.id)).map((member) => (
            <div key={member.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <Checkbox checked={splitData.paidMemberIds.includes(member.id)}>{member.nickname}</Checkbox>
              <strong>{formatVnd(perHead)}</strong>
            </div>
          ))}
        </div>
        <Button type="primary" block>Đánh dấu đã thu</Button>
      </Card>
    </div>
  );
}
