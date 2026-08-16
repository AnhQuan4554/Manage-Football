import { Card } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { getFundOverview } from "@/features/funds/services/fundService";
import { formatVnd } from "@/lib/utils/format";

export default async function ExpensesPage() {
  const data = (await getFundOverview()).data!;
  return (
    <div className="page-stack">
      <PageHeader title="Thu chi khác" subtitle="Tiền đá bóng, tiền áo, liên hoan/đi nhậu. Không biến thành ERP." />
      <section className="surface form-surface">
        <label>Tên khoản</label><input className="field" />
        <label>Nhóm</label>
        <select className="field">
          <option>Tiền đá bóng</option>
          <option>Tiền áo</option>
          <option>Liên hoan/đi nhậu</option>
        </select>
        <label>Số tiền</label><input className="field" type="number" placeholder="500000" />
        <button className="button-reset primary-action">Lưu khoản thu/chi</button>
      </section>
      <Card className="surface" title="Danh sách">
        <div className="page-stack">
          {data.transactions.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>{item.title}</span>
              <strong>{formatVnd(item.amount)}</strong>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
