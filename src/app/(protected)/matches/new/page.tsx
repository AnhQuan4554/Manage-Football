import { PageHeader } from "@/components/common/PageHeader";

export default function NewMatchPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Tạo trận mới" subtitle="Sau khi tạo xong, màn hình sẽ gợi ý tạo bình chọn Zalo." />
      <section className="surface form-surface">
        <label>Đối thủ</label><input className="field" placeholder="Hà Đông Legends" />
        <label>Ngày</label><input className="field" type="date" />
        <label>Giờ</label><input className="field" type="time" />
        <label>Sân</label><input className="field" placeholder="Sân Phạm Tu - sân số 2" />
        <label>Địa chỉ</label><input className="field" />
        <label>Chi phí sân</label><input className="field" type="number" placeholder="700000" />
        <label>Ghi chú</label><textarea className="field" rows={3} />
        <button className="button-reset primary-action">Tạo trận và tạo bình chọn Zalo</button>
      </section>
    </div>
  );
}
