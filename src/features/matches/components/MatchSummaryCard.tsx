import Link from "next/link";
import { Button, Tag } from "antd";
import {
  ClockCircleOutlined,
  EditOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { Match } from "@/features/matches/types";
import { formatDateShort, formatVnd } from "@/lib/utils/format";

const statusMap: Record<Match["status"], { label: string; className: string }> = {
  scheduled: { label: "Sắp diễn ra", className: "match-card-status--scheduled" },
  completed: { label: "Chưa tạo chia tiền", className: "match-card-status--cancelled" },
  cancelled: { label: "Đã hủy", className: "match-card-status--cancelled" },
};

function getPaymentStatus(match: Match) {
  if (match.status !== "completed") return statusMap[match.status];
  if (!match.paymentSummary) return statusMap.completed;

  return match.paymentSummary.isFullyPaid
    ? { label: "Đã thu đủ", className: "match-card-status--completed" }
    : { label: "Chưa thu đủ", className: "match-card-status--scheduled" };
}

function formatDisplayDate(date: string) {
  const [year, month, day] = date.split("-");
  return day && month && year ? `${day}/${month}/${year}` : date;
}

export function MatchSummaryCard({ match }: { match: Match }) {
  const confirmed = Object.values(match.attendance).filter((status) => status === "going").length;
  const isCompleted = match.status === "completed";
  const participantLabel = `${confirmed} tham gia`;
  const paymentStatus = getPaymentStatus(match);
  const moneyAmount = match.paymentSummary?.totalAmount ?? match.pitchCost;
  const detailHref = `/matches/${match.id}`;

  return (
    <article
      className={isCompleted ? "surface match-card match-card-completed" : "surface match-card"}
    >
      <Link
        className="match-card-overlay-link"
        href={detailHref}
        aria-label={`Xem chi tiết trận vs ${match.opponentName}`}
      />

      <div className="match-card-main-link">
        <div className="match-card-date">
          <b className="match-card-score">
            {match.homeScore ?? 0} : {match.awayScore ?? 0}
          </b>
        </div>
        <div className="match-card-content">
          <div className="match-card-titleline">
            <strong className="match-card-title">vs {match.opponentName}</strong>
            <Tag className={`match-card-status ${paymentStatus.className}`}>
              {paymentStatus.label}
            </Tag>
          </div>
          <p className="match-card-meta">
            <span>
              <ClockCircleOutlined /> {match.time} · {formatDisplayDate(match.date)}
            </span>
            <span>
              <EnvironmentOutlined /> {match.pitch}
            </span>
          </p>
        </div>
      </div>

      <div className="match-card-right">
        {isCompleted ? (
          <span className="match-card-money">
            <WalletOutlined /> {formatVnd(moneyAmount)}
          </span>
        ) : null}
        <span className="match-card-count">
          <TeamOutlined /> {participantLabel}
        </span>
        {isCompleted ? (
          <Link
            href={`/matches/${match.id}/edit`}
            className="match-card-edit-link"
            prefetch={false}
          >
            <Button size="small" icon={<EditOutlined />}>
              Sửa người/chia tiền
            </Button>
          </Link>
        ) : null}
      </div>
    </article>
  );
}
