import Link from "next/link";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { MatchSummaryCard } from "@/features/matches/components/MatchSummaryCard";
import { getMatches } from "@/features/matches/services/matchService";

export default async function MatchesPage() {
  const matches = (await getMatches()).data ?? [];

  return (
    <div className="page-stack">
      <PageHeader title="Lịch đá" subtitle="Quản lý lịch giao hữu, sân, đối thủ, chi phí và trạng thái Zalo." />
      <Link href="/matches/new"><Button type="primary" icon={<PlusOutlined />} block>Tạo trận mới</Button></Link>
      {matches.map((match) => <MatchSummaryCard key={match.id} match={match} />)}
    </div>
  );
}
