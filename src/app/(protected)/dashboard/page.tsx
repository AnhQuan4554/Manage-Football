import Link from "next/link";
import type { ReactNode } from "react";
import { Button, Progress, Space, Tag } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  TeamOutlined,
  TrophyOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { MatchSummaryCard } from "@/features/matches/components/MatchSummaryCard";
import { getMatches } from "@/features/matches/services/matchService";
import { getActiveMembers } from "@/features/members/services/memberService";
import { getFundOverview } from "@/features/funds/services/fundService";
import { uiColors } from "@/lib/constants/colors";
import { formatDateShort, formatDateTime, formatVnd } from "@/lib/utils/format";

export default async function DashboardPage() {
  const [matchesResponse, membersResponse, fundsResponse] = await Promise.all([
    getMatches(),
    getActiveMembers(),
    getFundOverview(),
  ]);
  const matches = matchesResponse.data ?? [];
  const nextMatch = matches
    .filter((match) => match.status === "scheduled")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0];
  const members = membersResponse.data ?? [];
  const funds = fundsResponse.data!;
  const recentMatches = matches.filter((match) => match.status !== "scheduled").slice(0, 3);
  const confirmed = nextMatch
    ? Object.values(nextMatch.attendance).filter((status) => status === "going").length
    : 0;
  const noAnswer = nextMatch
    ? Object.values(nextMatch.attendance).filter((status) => status === "unknown").length
    : 0;

  return (
    <div className="page-stack">
      <PageHeader title="Trang chủ" subtitle="Trận tiếp theo, việc cần xử lý và tình trạng quỹ đội." />
      {nextMatch ? (
        <section className="hero-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Tag color="magenta" style={{ marginInlineEnd: 0 }}>Trận tiếp theo</Tag>
            <Tag color={nextMatch.zaloVoteStatus === "created" ? "green" : "gold"} style={{ marginInlineEnd: 0 }}>
              Zalo: {nextMatch.zaloVoteStatus === "created" ? "đã tạo" : "chưa tạo"}
            </Tag>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className="display-title" style={{ color: uiColors.neutral.white }}>Pinkstorm FC</p>
              <p className="text-kicker" style={{ color: "rgba(255,255,255,.72)", margin: "8px 0" }}>đối đầu</p>
              <p className="display-title" style={{ color: uiColors.neutral.white }}>{nextMatch.opponentName}</p>
            </div>
            <div style={{ flexShrink: 0, borderRadius: 16, background: "rgba(255,255,255,.14)", padding: "12px 14px", textAlign: "center" }}>
              <strong style={{ display: "block", color: uiColors.neutral.white, fontSize: 28 }}>{nextMatch.time}</strong>
              <span style={{ color: "rgba(255,255,255,.8)", fontSize: 12 }}>{formatDateShort(nextMatch.date)}</span>
            </div>
          </div>
          <div style={{ marginTop: 14, display: "grid", gap: 6, color: "rgba(255,255,255,.84)" }}>
            <span><FieldTimeOutlined /> {formatDateTime(nextMatch.date, nextMatch.time)}</span>
            <span><EnvironmentOutlined /> {nextMatch.pitch} - {nextMatch.address}</span>
          </div>
          <div style={{ marginTop: 16, borderRadius: 16, background: "rgba(255,255,255,.12)", padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span className="text-kicker" style={{ color: "rgba(255,255,255,.78)" }}>Đã xác nhận</span>
              <strong style={{ color: uiColors.neutral.white }}>{confirmed}/7 suất</strong>
            </div>
            <Progress percent={Math.min(100, Math.round((confirmed / 7) * 100))} showInfo={false} strokeColor={uiColors.neutral.white} trailColor="rgba(255,255,255,.24)" style={{ margin: "8px 0 0" }} />
            <p style={{ color: "rgba(255,255,255,.75)", margin: "8px 0 0", fontSize: 12 }}>
              {noAnswer} người chưa trả lời
            </p>
          </div>
          <Space wrap style={{ marginTop: 14 }}>
            <Link href={`/matches/${nextMatch.id}`}><Button>Chi tiết trận</Button></Link>
            <Link href={`/lineup/${nextMatch.id}`}><Button>Xếp đội hình</Button></Link>
          </Space>
        </section>
      ) : null}

      <section className="mini-stat-grid">
        <MiniStat icon={<WalletOutlined />} label="Quỹ đội" value={formatVnd(funds.balance)} />
        <MiniStat icon={<TeamOutlined />} label="Thành viên" value={String(members.length)} />
        <MiniStat icon={<CalendarOutlined />} label="Tháng này" value={`${matches.length} trận`} />
      </section>

      <section className="page-stack">
        <div className="section-header">
          <div>
            <h2>Cần bạn xử lý</h2>
            <p className="muted" style={{ margin: "5px 0 0" }}>Việc nhanh cho đội trưởng và thủ quỹ.</p>
          </div>
        </div>
        <div className="page-stack">
          <TodoRow icon={<CalendarOutlined />} title="Tạo trận mới" desc="Chốt lịch, sân và đối thủ." href="/matches/new" />
          <TodoRow icon={<CheckCircleOutlined />} title="Duyệt thành viên chờ vào đội" desc="Kiểm tra các yêu cầu đăng ký mới." href="/members" />
          <TodoRow icon={<WalletOutlined />} title="Theo dõi người chưa đóng tiền sân" desc="Xem chia tiền và trạng thái đóng quỹ." href="/funds" />
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2>Trận gần đây</h2>
          <Link href="/matches" style={{ color: uiColors.brand.primary, fontWeight: 750 }}>Tất cả</Link>
        </div>
        <div className="page-stack" style={{ marginTop: 10 }}>
          {(recentMatches.length ? recentMatches : matches).slice(0, 3).map((match) => <MatchSummaryCard key={match.id} match={match} />)}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="mini-stat">
      <span className="icon-chip" style={{ width: 32, height: 32 }}>{icon}</span>
      <span className="text-kicker" style={{ display: "block", marginTop: 10 }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TodoRow({ icon, title, desc, href }: { icon: ReactNode; title: string; desc: string; href: string }) {
  return (
    <Link className="surface todo-row" href={href}>
      <span className="icon-chip">{icon}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <strong>{title}</strong>
        <span className="muted" style={{ display: "block", marginTop: 3, fontSize: 12 }}>{desc}</span>
      </span>
      <TrophyOutlined className="muted" />
    </Link>
  );
}
