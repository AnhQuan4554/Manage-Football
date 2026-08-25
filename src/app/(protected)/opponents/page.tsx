import { Input, List, Tag } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { listOpponents } from "@/features/opponents/services/opponentService";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function OpponentsPage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = searchParams?.q ?? "";
  const opponentsResponse = await listOpponents(query);
  const opponents = opponentsResponse.data ?? [];

  return (
    <div className="page-stack">
      <PageHeader title="Đối thủ" subtitle="Lưu lại các đội bạn từng gặp để sau này tìm và đá lại nhanh hơn." />
      <section className="surface-card">
        <form action="/opponents" method="get">
          <Input.Search
            name="q"
            placeholder="Tìm theo tên đối thủ..."
            defaultValue={query}
            allowClear
            enterButton="Tìm"
          />
        </form>
      </section>

      <section className="surface-card">
        {opponentsResponse.success ? (
          <List
            dataSource={opponents}
            locale={{ emptyText: "Chưa có đối thủ nào được lưu." }}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong>{item.name}</strong>
                      {item.lastPlayedAt ? <Tag color="magenta">Đã gặp</Tag> : <Tag>Chưa đá</Tag>}
                    </div>
                  }
                  description={
                    <div className="muted" style={{ display: "grid", gap: 4 }}>
                      <span>{item.contactName || "Chưa có người liên hệ"}{item.phone ? ` · ${item.phone}` : ""}</span>
                      <span>{item.note || "Không có ghi chú"}</span>
                      {item.lastPlayedAt ? <span>Gặp gần nhất: {formatDateTime(item.lastPlayedAt)}</span> : null}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            {opponentsResponse.message ?? opponentsResponse.error ?? "Không thể tải danh sách đối thủ."}
          </p>
        )}
      </section>
    </div>
  );
}
