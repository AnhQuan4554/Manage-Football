import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarOutlined, CheckCircleOutlined, TeamOutlined, TrophyOutlined, WalletOutlined } from "@ant-design/icons";
import { FeaturedMatchHero } from "@/features/matches/components/FeaturedMatchHero";
import { MatchSummaryCard } from "@/features/matches/components/MatchSummaryCard";
import { getMatches } from "@/features/matches/services/matchService";
import { getActiveMembers } from "@/features/members/services/memberService";
import { getFundOverview } from "@/features/funds/services/fundService";
import { mockMatches } from "@/lib/constants/mockData";
import { uiColors } from "@/lib/constants/colors";
import { formatVnd } from "@/lib/utils/format";

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
  const featuredMatch = nextMatch ?? mockMatches.find((match) => match.status === "scheduled");
  const members = membersResponse.data ?? [];
  const funds = fundsResponse.data!;
  const recentMatches = matches.filter((match) => match.status !== "scheduled").slice(0, 3);

  return (
    <div className="page-stack">
      {featuredMatch ? (
        <FeaturedMatchHero match={featuredMatch} />
      ) : null}

      <section className="mini-stat-grid">
        <MiniStat icon={<WalletOutlined />} label="Quỹ đội" value={formatVnd(funds.balance)} />
        <MiniStat icon={<TeamOutlined />} label="Thành viên" value={String(members.length)} />
        <MiniStat icon={<CalendarOutlined />} label="Tháng này" value={`${matches.length} trận`} />
        <MiniStat icon={<WalletOutlined />} label="Trận chưa đủ" value={String(funds.incompleteMatchCount ?? 0)} />
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
