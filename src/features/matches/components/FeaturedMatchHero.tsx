import Link from "next/link";
import { Button, Tag } from "antd";
import { ClockCircleOutlined, EnvironmentOutlined, FireOutlined } from "@ant-design/icons";
import type { Match } from "@/features/matches/types";
import { formatDateShort, weekdayShort } from "@/lib/utils/format";

const statusMap: Record<Match["status"], { label: string; color: string }> = {
  scheduled: { label: "Sắp diễn ra", color: "magenta" },
  completed: { label: "Đã hoàn thành", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
};

function parseMatchDate(date: string) {
  return new Date(`${date}T00:00:00+07:00`);
}

function formatLongDate(date: string) {
  const value = parseMatchDate(date);
  const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(value);
  const datePart = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);

  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${datePart}`;
}

function formatRelativeDate(date: string) {
  const target = parseMatchDate(date);
  const today = new Date();
  const current = new Date(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T00:00:00+07:00`,
  );
  const diffDays = Math.round((target.getTime() - current.getTime()) / 86400000);

  if (diffDays === 0) return "Hôm nay";
  if (diffDays > 0) return `Trong ${diffDays} ngày`;
  return `${Math.abs(diffDays)} ngày trước`;
}

export function FeaturedMatchHero({ match }: { match: Match }) {
  const confirmed = Object.values(match.attendance).filter((status) => status === "going").length;
  const absent = Object.values(match.attendance).filter((status) => status === "absent").length;
  const maybe = Object.values(match.attendance).filter((status) => status === "maybe").length;
  const unanswered = Object.values(match.attendance).filter((status) => status === "unknown").length;
  const totalResponded = confirmed + absent + maybe;
  const responseRate = Math.min(100, Math.round((totalResponded / Object.keys(match.attendance).length) * 100));

  return (
    <section className="featured-match-card hero-card">
      <div className="featured-match-topline">
        <span className="featured-match-eyebrow">
          <FireOutlined />
          <span>Trận tiếp theo · {formatRelativeDate(match.date)}</span>
        </span>
        <Tag color={statusMap[match.status].color} className="featured-match-status">
          {statusMap[match.status].label}
        </Tag>
      </div>

      <div className="featured-match-hero">
        <div className="featured-match-titleblock">
          <p className="featured-match-team-name">Pinkstorm FC</p>
          <p className="featured-match-vs-label">Đối đầu</p>
          <p className="featured-match-opponent">{match.opponentName}</p>
        </div>

        <div className="featured-match-timebox">
          <strong>{match.time}</strong>
          <span>
            {weekdayShort(match.date)} · {formatDateShort(match.date)}
          </span>
        </div>
      </div>

      <div className="featured-match-meta">
        <div className="featured-match-meta-item">
          <ClockCircleOutlined />
          <span>{formatLongDate(match.date)}</span>
        </div>
        <div className="featured-match-meta-item">
          <EnvironmentOutlined />
          <span>
            {match.pitch} - {match.address}
          </span>
        </div>
      </div>

      <div className="featured-match-summary">
        <div className="featured-match-summary-head">
          <div>
            <p className="featured-match-summary-label">Đã xác nhận tham gia</p>
            <strong className="featured-match-summary-value">{confirmed} / 7 suất</strong>
          </div>
          <span className="featured-match-summary-count">{responseRate}% đã phản hồi</span>
        </div>

        <div className="featured-match-bar" aria-hidden="true">
          <span className="featured-match-bar-fill" style={{ width: `${responseRate}%` }} />
        </div>

        <div className="featured-match-legend">
          <span>
            <i className="legend-dot legend-going" />
            {confirmed} tham gia
          </span>
          <span>
            <i className="legend-dot legend-absent" />
            {absent} vắng
          </span>
          <span>
            <i className="legend-dot legend-maybe" />
            {maybe} chưa chắc
          </span>
          <span>
            <i className="legend-dot legend-waiting" />
            {unanswered} chưa trả lời
          </span>
        </div>
      </div>

      <div className="featured-match-actions">
        <Link href={`/matches/${match.id}`}>
          <Button size="large" block>
            Chi tiết trận
          </Button>
        </Link>
        <Link href={`/lineup/${match.id}`}>
          <Button size="large" block>
            Xếp đội hình
          </Button>
        </Link>
      </div>
    </section>
  );
}
