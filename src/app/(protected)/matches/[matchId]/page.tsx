import Link from "next/link";
import { Button, Card, Descriptions, Space, Tag } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { ZaloVoteCard } from "@/features/matches/components/ZaloVoteCard";
import { getMatchDetail } from "@/features/matches/services/matchService";
import { formatDateTime, formatVnd } from "@/lib/utils/format";

function splitDateTime(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

export default async function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const matchResponse = await getMatchDetail(matchId);
  const detail = matchResponse.data;

  if (!detail) return <PageHeader title="Không tìm thấy trận" />;

  const scheduledAt = splitDateTime(detail.match.matchDateTime);

  return (
    <div className="page-stack">
      <PageHeader
        title={`Pinkstorm FC vs ${detail.match.opponentName}`}
        subtitle={formatDateTime(scheduledAt.date, scheduledAt.time)}
      />
      <Space wrap>
        <Link href={`/matches/${detail.match.id}/edit`}>
          <Button type={detail.match.status === "completed" ? "primary" : "default"}>
            {detail.match.status === "completed" ? "Cập nhật chi phí" : "Chỉnh sửa trận"}
          </Button>
        </Link>
        <Link href={`/lineup/${detail.match.id}`}><Button type="primary">Xếp đội hình</Button></Link>
      </Space>
      <Card className="surface">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Sân">{detail.match.venueName}</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">{detail.match.address || "Không có"}</Descriptions.Item>
          {detail.match.status === "completed" ? (
            <Descriptions.Item label="Tổng tiền đội phải trả">{formatVnd(detail.match.pitchCost)}</Descriptions.Item>
          ) : (
            <Descriptions.Item label="Chi phí">Sẽ hiển thị sau khi trận kết thúc</Descriptions.Item>
          )}
          <Descriptions.Item label="Ghi chú">{detail.match.note || "Không có"}</Descriptions.Item>
        </Descriptions>
      </Card>
      <ZaloVoteCard
        match={{
          id: detail.match.id,
          teamId: detail.match.teamId,
          opponentName: detail.match.opponentName,
          date: scheduledAt.date,
          time: scheduledAt.time,
          pitch: detail.match.venueName,
          address: detail.match.address || "",
          pitchCost: detail.match.pitchCost,
          opponentFee: 0,
          note: detail.match.note || "",
          status: detail.match.status === "completed" ? "completed" : detail.match.status === "cancelled" ? "cancelled" : "scheduled",
          zaloVoteStatus: detail.match.status === "cancelled" ? "error" : detail.match.status === "open" || detail.match.status === "lineup_ready" || detail.match.status === "completed" ? "created" : "none",
          formation: (detail.lineup?.formationCode as "2-3-1" | "3-2-1" | "2-2-2") || "2-3-1",
          attendance: Object.fromEntries(
            detail.participants.map((participant) => [
              participant.membershipId ?? participant.guestId ?? participant.id,
              participant.response === "going" ? "going" : participant.response === "not_going" ? "absent" : "unknown",
            ]),
          ),
          lineup: detail.lineup ? Object.fromEntries(detail.lineup.slots.map((slot) => [slot.slotKey, slot.participantId])) : {},
        }}
      />
      <Card className="surface" title="Xác nhận tham gia">
        <div className="page-stack">
          {detail.participants.map((participant) => (
            <div key={participant.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <strong>{participant.participantName}</strong>
                <div className="muted" style={{ fontSize: 12 }}>{participant.membershipId ?? participant.guestId ?? "Guest"}</div>
              </div>
              <Tag color={participant.response === "going" ? "green" : participant.response === "not_going" ? "red" : "default"}>
                {participant.response === "going" ? "Tham gia" : participant.response === "not_going" ? "Vắng" : "Chưa trả lời"}
              </Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
