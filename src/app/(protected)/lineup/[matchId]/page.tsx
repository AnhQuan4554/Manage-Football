import { getCurrentAccount } from "@/features/auth/server";
import { isAdmin } from "@/features/auth/utils";
import { Alert } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { LineupBoard } from "@/features/matches/components/LineupBoard";
import { getMatchById } from "@/features/matches/services/matchService";
import { getActiveMembers } from "@/features/members/services/memberService";

export default async function LineupPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const canManage = isAdmin(await getCurrentAccount());
  const match = (await getMatchById(matchId)).data;
  const members = (await getActiveMembers()).data ?? [];

  if (!match) return <PageHeader title="Không tìm thấy đội hình" />;

  return (
    <div className="page-stack">
      <PageHeader
        title="Đội hình sân 7"
        subtitle={`Sơ đồ ${match.formation} - vs ${match.opponentName}`}
      />
      <Alert
        type="info"
        showIcon
        message="Đội hình hiện tại của đội. Quyền quản trị do admin cấp."
      />
      <LineupBoard match={match} members={members} editable={canManage} />
    </div>
  );
}
