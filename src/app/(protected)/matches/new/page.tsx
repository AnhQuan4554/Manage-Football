import { PageHeader } from "@/components/common/PageHeader";
import { MatchForm } from "@/features/matches/components/MatchForm";
import { getCurrentTeam } from "@/features/team-profile/services/teamService";

export default async function NewMatchPage() {
  const team = (await getCurrentTeam()).data;

  if (!team) {
    return <PageHeader title="Không tìm thấy team" />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        variant="form"
        title="Tạo trận mới"
        subtitle="Sau khi tạo xong, sao chép thông tin ngắn gọn và mở nhóm Zalo."
      />
      <MatchForm teamId={team.id} mode="create" submitLabel="Tạo trận và lấy nội dung Zalo" />
    </div>
  );
}
