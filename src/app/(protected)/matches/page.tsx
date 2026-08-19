import Link from "next/link";
import { Button, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { MatchSummaryCard } from "@/features/matches/components/MatchSummaryCard";
import { getMatches } from "@/features/matches/services/matchService";
import { formatVnd } from "@/lib/utils/format";

export default async function MatchesPage() {
  const matches = (await getMatches()).data ?? [];
  const upcoming = matches.filter((match) => match.status === "scheduled");
  const history = matches.filter((match) => match.status !== "scheduled");
  const monthTotal = matches.reduce((sum, match) => sum + match.pitchCost + match.opponentFee, 0);

  return (
    <div className="page-stack">
      <PageHeader
        title="Trận đấu"
        subtitle="Sân 7, lịch giao hữu, đối thủ, chi phí và trạng thái Zalo."
        action={<Link href="/matches/new"><Button type="primary" icon={<PlusOutlined />}>Tạo trận</Button></Link>}
      />

      <section className="mini-stat-grid">
        <MiniStat label="Tổng lịch" value={`${matches.length} trận`} />
        <MiniStat label="Sắp diễn ra" value={`${upcoming.length} trận`} />
        <MiniStat label="Chi phí" value={formatVnd(monthTotal)} />
      </section>

      <section className="page-stack">
        <div className="section-header">
          <div>
            <h2>Sắp diễn ra</h2>
            <p className="muted" style={{ margin: "5px 0 0" }}>Các trận cần chốt quân và đội hình.</p>
          </div>
          <Tag color="magenta">{upcoming.length}</Tag>
        </div>
        {upcoming.map((match) => <MatchSummaryCard key={match.id} match={match} />)}
      </section>

      <section className="page-stack">
        <div className="section-header">
          <div>
            <h2>Đã qua</h2>
            <p className="muted" style={{ margin: "5px 0 0" }}>Lịch sử trận và chi phí phát sinh.</p>
          </div>
          <Tag>{history.length}</Tag>
        </div>
        <div className="two-col-grid">
          {history.map((match) => <MatchSummaryCard key={match.id} match={match} />)}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini-stat">
      <span className="text-kicker">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
