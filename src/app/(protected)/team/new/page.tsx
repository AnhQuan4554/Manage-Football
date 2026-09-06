import { PageHeader } from "@/components/common/PageHeader";
import { NewTeamForm } from "@/features/team-profile/components/NewTeamForm";

export default function NewTeamPage() {
  return (
    <div className="page-stack">
      <PageHeader variant="form" title="Thêm đội" subtitle="Tạo đội mới trong hệ thống." />
      <NewTeamForm />
    </div>
  );
}
