import { PageHeader } from "@/components/common/PageHeader";
import { getMemberById } from "@/features/members/services/memberService";

export default async function EditMemberPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const member = (await getMemberById(memberId)).data;
  return (
    <div className="page-stack">
      <PageHeader title="Chỉnh sửa thành viên" subtitle={member?.nickname} />
      <section className="surface form-surface">
        <label>Họ tên</label><input className="field" defaultValue={member?.fullName} />
        <label>Biệt danh</label><input className="field" defaultValue={member?.nickname} />
        <label>Số áo</label><input className="field" type="number" defaultValue={member?.shirtNumber} />
        <button className="button-reset primary-action">Lưu thay đổi</button>
      </section>
    </div>
  );
}
