import { PageHeader } from "@/components/common/PageHeader";
import { NewMemberForm } from "@/features/members/components/NewMemberForm";

export default function NewMemberPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Thêm thành viên" subtitle="Chỉ đội trưởng được CRUD thông tin thành viên." />
      <NewMemberForm />
    </div>
  );
}
