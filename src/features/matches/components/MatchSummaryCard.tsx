import Link from "next/link";
import { Tag } from "antd";
import { ClockCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import type { Match } from "@/features/matches/types";
import { formatDateShort, formatVnd, weekdayShort } from "@/lib/utils/format";

const statusMap: Record<Match["status"], { label: string; color: string }> = {
  scheduled: { label: "Sắp diễn ra", color: "magenta" },
  completed: { label: "Đã hoàn thành", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
};

export function MatchSummaryCard({ match }: { match: Match }) {
  const confirmed = Object.values(match.attendance).filter((status) => status === "going").length;

  return (
    <Link className="surface match-row" href={`/matches/${match.id}`}>
      <div className="date-tile">
        <span>{weekdayShort(match.date)}</span>
        <span>{formatDateShort(match.date)}</span>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            vs {match.opponentName}
          </strong>
          <Tag color={statusMap[match.status].color} style={{ marginInlineEnd: 0 }}>
            {statusMap[match.status].label}
          </Tag>
        </div>
        <p className="muted" style={{ margin: "5px 0 0", fontSize: 12 }}>
          <ClockCircleOutlined /> {match.time} <span style={{ color: "var(--line)" }}>·</span>{" "}
          <EnvironmentOutlined /> {match.pitch}
        </p>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <Tag color="pink" style={{ marginInlineEnd: 0 }}>{confirmed}/7 chốt</Tag>
        <div className="muted" style={{ marginTop: 5, fontSize: 12 }}>{formatVnd(match.pitchCost + match.opponentFee)}</div>
      </div>
    </Link>
  );
}
