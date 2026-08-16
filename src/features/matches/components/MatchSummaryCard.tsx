import Link from "next/link";
import { Card, Space, Tag } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import type { Match } from "@/features/matches/types";
import { formatDateTime, formatVnd } from "@/lib/utils/format";

const statusMap: Record<Match["status"], { label: string; color: string }> = {
  scheduled: { label: "Sắp diễn ra", color: "magenta" },
  completed: { label: "Đã hoàn thành", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
};

export function MatchSummaryCard({ match }: { match: Match }) {
  const confirmed = Object.values(match.attendance).filter((status) => status === "going").length;

  return (
    <Link href={`/matches/${match.id}`}>
      <Card className="surface" styles={{ body: { padding: 16 } }}>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <strong>Pinkstorm FC vs {match.opponentName}</strong>
            <Tag color={statusMap[match.status].color}>{statusMap[match.status].label}</Tag>
          </Space>
          <span className="muted">{formatDateTime(match.date, match.time)}</span>
          <span className="muted">
            <EnvironmentOutlined /> {match.pitch}
          </span>
          <Space wrap>
            <Tag color="pink">{confirmed} đã xác nhận</Tag>
            <Tag>{formatVnd(match.pitchCost + match.opponentFee)}</Tag>
          </Space>
        </Space>
      </Card>
    </Link>
  );
}
