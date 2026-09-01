import Link from "next/link";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { MatchesBoard } from "@/features/matches/components/MatchesBoard";
import { getMatches } from "@/features/matches/services/matchService";

export default async function MatchesPage() {
  const matches = (await getMatches()).data ?? [];
  const currentMonthKey = getCurrentMonthKey();

  return (
    <div className="page-stack">
      <PageHeader
        title="Trận đấu"
        subtitle="Sân 7, lịch giao hữu, đối thủ và tình trạng chốt đội hình."
        action={
          <Link href="/matches/new">
            <Button type="primary" icon={<PlusOutlined />}>
              Tạo trận
            </Button>
          </Link>
        }
      />
      <MatchesBoard matches={matches} currentMonthKey={currentMonthKey} />
    </div>
  );
}

function getCurrentMonthKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";

  return `${year}-${month}`;
}
