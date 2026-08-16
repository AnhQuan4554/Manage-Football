import { Alert } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { LineupBoard } from "@/features/matches/components/LineupBoard";
import { getMatchById } from "@/features/matches/services/matchService";
import { getActiveMembers } from "@/features/members/services/memberService";

export default async function LineupPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = (await getMatchById(matchId)).data;
  const members = (await getActiveMembers()).data ?? [];

  if (!match) return <PageHeader title="Không tìm thấy đội hình" />;

  return (
    <div className="page-stack">
      <PageHeader title="Đội hình sân 7" subtitle={`Sơ đồ ${match.formation} - vs ${match.opponentName}`} />
      <Alert type="info" showIcon message="Đội trưởng và thủ quỹ có thể sửa đội hình. Thành viên xem-only ở MVP." />
      <LineupBoard match={match} members={members} editable />
    </div>
  );
}
