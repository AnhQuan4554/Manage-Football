import Link from "next/link";
import { Button, Card, Space, Tag } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { MatchSummaryCard } from "@/features/matches/components/MatchSummaryCard";
import { getNextMatch, getMatches } from "@/features/matches/services/matchService";
import { getActiveMembers } from "@/features/members/services/memberService";
import { getFundOverview } from "@/features/funds/services/fundService";
import { formatDateTime, formatVnd } from "@/lib/utils/format";

export default async function DashboardPage() {
  const [nextMatchResponse, matchesResponse, membersResponse, fundsResponse] = await Promise.all([
    getNextMatch(),
    getMatches(),
    getActiveMembers(),
    getFundOverview(),
  ]);
  const nextMatch = nextMatchResponse.data;
  const matches = matchesResponse.data ?? [];
  const members = membersResponse.data ?? [];
  const funds = fundsResponse.data!;

  return (
    <div className="page-stack">
      <PageHeader title="Trang chủ" subtitle="Trận tiếp theo, việc cần xử lý và tình trạng quỹ đội." />
      {nextMatch ? (
        <section className="hero-card">
          <Tag color="magenta">Trận tiếp theo</Tag>
          <h1 style={{ color: "white", margin: "10px 0 0" }}>
            Pinkstorm FC vs {nextMatch.opponentName}
          </h1>
          <p style={{ color: "rgba(255,255,255,.82)", marginBottom: 16 }}>
            {formatDateTime(nextMatch.date, nextMatch.time)} - {nextMatch.pitch}
          </p>
          <Space wrap>
            <Link href={`/matches/${nextMatch.id}`}><Button type="primary">Chi tiết trận</Button></Link>
            <Link href={`/lineup/${nextMatch.id}`}><Button>Xếp đội hình</Button></Link>
          </Space>
        </section>
      ) : null}

      <section className="stat-grid">
        <div className="stat-tile"><span className="muted">Thành viên</span><strong>{members.length}</strong></div>
        <div className="stat-tile"><span className="muted">Tháng này</span><strong>{matches.length} trận</strong></div>
        <div className="stat-tile"><span className="muted">Quỹ</span><strong>{formatVnd(funds.balance)}</strong></div>
      </section>

      <Card className="surface" title="Cần bạn xử lý">
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <Link href="/matches/new"><Button block>Tạo trận mới</Button></Link>
          <Link href="/members"><Button block>Duyệt thành viên chờ vào đội</Button></Link>
          <Link href="/funds"><Button block>Theo dõi người chưa đóng tiền sân</Button></Link>
        </Space>
      </Card>

      <section>
        <h2 className="section-title">Trận gần đây</h2>
        <div className="page-stack">{matches.map((match) => <MatchSummaryCard key={match.id} match={match} />)}</div>
      </section>
    </div>
  );
}
