import { PageHeader } from "@/components/common/PageHeader";

export default function SettingsPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Cài đặt" subtitle="Tài khoản, đội hiện tại, vai trò và thông báo." />
      <section className="surface form-surface">
        <label>Tên hiển thị</label><input className="field" defaultValue="Quân Béo" />
        <label>Đội hiện tại</label>
        <select className="field">
          <option>Pinkstorm FC</option>
          <option>FC Phòng Kinh Doanh</option>
        </select>
        <label className="check-row"><input type="checkbox" defaultChecked /> Thông báo trận mới</label>
        <label className="check-row"><input type="checkbox" defaultChecked /> Nhắc đóng quỹ</label>
      </section>
    </div>
  );
}
