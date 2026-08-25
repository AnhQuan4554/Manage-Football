import Link from "next/link";
import { Tag } from "antd";
import { ClockCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import type { Match } from "@/features/matches/types";
import { formatDateShort, weekdayShort } from "@/lib/utils/format";

const statusMap: Record<Match["status"], { label: string; color: string }> = {
  scheduled: { label: "Sắp diễn ra", color: "magenta" },
  completed: { label: "Đã hoàn thành", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
};

export function MatchSummaryCard({ match }: { match: Match }) {
  const confirmed = Object.values(match.attendance).filter((status) => status === "going").length;

  return (
    <Link className="surface match-card" href={`/matches/${match.id}`}>
      <div className="match-card-date">
        <span>{weekdayShort(match.date)}</span>
        <strong>{formatDateShort(match.date)}</strong>
      </div>
      <div className="match-card-content">
        <div className="match-card-titleline">
          <strong className="match-card-title">vs {match.opponentName}</strong>
          <Tag color={statusMap[match.status].color} className="match-card-status">
            {statusMap[match.status].label}
          </Tag>
        </div>
        <p className="match-card-meta">
          <span>
            <ClockCircleOutlined /> {match.time}
          </span>
          <span>
            <EnvironmentOutlined /> {match.pitch}
          </span>
        </p>
      </div>
      <div className="match-card-right">
        <span className="match-card-count">{confirmed}/7 chốt</span>
      </div>
    </Link>
  );
}
