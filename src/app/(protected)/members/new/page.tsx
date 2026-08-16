import { PageHeader } from "@/components/common/PageHeader";

export default function NewMemberPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Thêm thành viên" subtitle="Chỉ đội trưởng được CRUD thông tin thành viên." />
      <section className="surface form-surface">
        <label>Họ tên</label><input className="field" />
        <label>Biệt danh</label><input className="field" />
        <label>Số áo</label><input className="field" type="number" min={1} max={99} />
        <label>Vai trò</label>
        <select className="field"><option>Thành viên</option><option>Thủ quỹ</option></select>
        <button className="button-reset primary-action">Lưu thành viên</button>
      </section>
    </div>
  );
}
