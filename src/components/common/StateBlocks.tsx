import { Button, Skeleton } from "antd";
import { InboxOutlined, LockOutlined, WarningOutlined } from "@ant-design/icons";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface-card" style={{ borderStyle: "dashed", padding: "36px 20px", textAlign: "center" }}>
      <div className="icon-chip" style={{ margin: "0 auto 12px" }}><InboxOutlined /></div>
      <strong>{title}</strong>
      {description ? <p className="muted" style={{ margin: "6px auto 0", maxWidth: 340 }}>{description}</p> : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

export function PermissionNotice({ description }: { description: string }) {
  return (
    <div className="surface-card" style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "var(--warning-soft)" }}>
      <LockOutlined className="muted" style={{ marginTop: 3 }} />
      <div>
        <strong>Bạn không có quyền quản lý</strong>
        <p className="muted" style={{ margin: "3px 0 0" }}>{description}</p>
      </div>
    </div>
  );
}

export function ErrorState({ title = "Không tải được dữ liệu" }: { title?: string }) {
  return (
    <div className="surface-card" style={{ textAlign: "center" }}>
      <WarningOutlined style={{ color: "var(--danger)", fontSize: 24 }} />
      <p style={{ margin: "8px 0 0", fontWeight: 800 }}>{title}</p>
      <Button style={{ marginTop: 12 }}>Thử lại</Button>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="page-stack">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="surface-card" key={index} style={{ display: "flex", gap: 12 }}>
          <Skeleton.Avatar active />
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: "48%" }} />
        </div>
      ))}
    </div>
  );
}
