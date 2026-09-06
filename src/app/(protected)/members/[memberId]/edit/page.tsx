import { PageHeader } from "@/components/common/PageHeader";
import { EditMemberForm } from "@/features/members/components/EditMemberForm";
import { getMemberById } from "@/features/members/services/memberService";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const member = (await getMemberById(memberId)).data;

  if (!member) {
    return <PageHeader title="Không tìm thấy thành viên" />;
  }

  return (
    <div className="page-stack member-form-page">
      <PageHeader variant="form" title="Chỉnh sửa thành viên" subtitle={member.nickname} />
      <EditMemberForm member={member} />
    </div>
  );
}
