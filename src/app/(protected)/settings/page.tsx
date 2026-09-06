import { PageHeader } from "@/components/common/PageHeader";
import { PushSettings } from "@/features/notifications/components/PushSettings";

export default function SettingsPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Cài đặt" subtitle="Tài khoản, đội hiện tại, vai trò và thông báo." />
      <section className="surface form-surface">
        <label>Tên hiển thị</label>
        <input className="field" defaultValue="Quân Béo" />
        <label>Đội hiện tại</label>
        <select className="field">
          <option>Pinkstorm FC</option>
          <option>FC Phòng Kinh Doanh</option>
        </select>
      </section>
      <PushSettings />
    </div>
  );
}
