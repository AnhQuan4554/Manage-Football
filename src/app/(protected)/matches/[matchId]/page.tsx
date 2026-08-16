import Link from "next/link";
import { Button, Card, Descriptions, Space, Tag } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { ZaloVoteCard } from "@/features/matches/components/ZaloVoteCard";
import { getMatchById } from "@/features/matches/services/matchService";
import { getMembers } from "@/features/members/services/memberService";
import { formatDateTime, formatVnd } from "@/lib/utils/format";

export default async function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = (await getMatchById(matchId)).data;
  const members = (await getMembers()).data ?? [];

  if (!match) return <PageHeader title="Không tìm thấy trận" />;

  const rows = members.map((member) => ({ member, status: match.attendance[member.id] ?? "unknown" }));

  return (
    <div className="page-stack">
      <PageHeader title={`Pinkstorm FC vs ${match.opponentName}`} subtitle={formatDateTime(match.date, match.time)} />
      <Space wrap>
        <Link href={`/matches/${match.id}/edit`}><Button>Chỉnh sửa trận</Button></Link>
        <Link href={`/lineup/${match.id}`}><Button type="primary">Xếp đội hình</Button></Link>
      </Space>
      <Card className="surface">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Sân">{match.pitch}</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">{match.address}</Descriptions.Item>
          <Descriptions.Item label="Chi phí">{formatVnd(match.pitchCost + match.opponentFee)}</Descriptions.Item>
          <Descriptions.Item label="Ghi chú">{match.note || "Không có"}</Descriptions.Item>
        </Descriptions>
      </Card>
      <ZaloVoteCard match={match} />
      <Card className="surface" title="Xác nhận tham gia">
        <div className="page-stack">
          {rows.map(({ member, status }) => (
            <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <strong>{member.nickname} #{member.shirtNumber}</strong>
                <div className="muted" style={{ fontSize: 12 }}>{member.fullName}</div>
              </div>
              <Tag color={status === "going" ? "green" : status === "absent" ? "red" : status === "maybe" ? "gold" : "default"}>
                {status === "going" ? "Tham gia" : status === "absent" ? "Vắng" : status === "maybe" ? "Chưa chắc" : "Chưa trả lời"}
              </Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
