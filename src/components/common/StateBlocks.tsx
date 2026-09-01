import { Button } from "antd";
import { InboxOutlined, LockOutlined, WarningOutlined } from "@ant-design/icons";
import { LogoLoading } from "@/components/common/LogoLoading";

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
    <div
      className="surface-card"
      style={{ borderStyle: "dashed", padding: "36px 20px", textAlign: "center" }}
    >
      <div className="icon-chip" style={{ margin: "0 auto 12px" }}>
        <InboxOutlined />
      </div>
      <strong>{title}</strong>
      {description ? (
        <p className="muted" style={{ margin: "6px auto 0", maxWidth: 340 }}>
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

export function PermissionNotice({ description }: { description: string }) {
  return (
    <div
      className="surface-card"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        background: "var(--warning-soft)",
      }}
    >
      <LockOutlined className="muted" style={{ marginTop: 3 }} />
      <div>
        <strong>Bạn không có quyền quản lý</strong>
        <p className="muted" style={{ margin: "3px 0 0" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

export function ErrorState({
  title = "Không tải được dữ liệu",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="surface-card" style={{ textAlign: "center" }}>
      <WarningOutlined style={{ color: "var(--danger)", fontSize: 24 }} />
      <p style={{ margin: "8px 0 0", fontWeight: 700 }}>{title}</p>
      {description ? (
        <p className="muted" style={{ margin: "6px auto 0", maxWidth: 360 }}>
          {description}
        </p>
      ) : null}
      <Button style={{ marginTop: 12 }}>Thử lại</Button>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <LogoLoading label="Đang tải dữ liệu..." size={rows > 4 ? "lg" : "md"} fullPage={rows > 4} />
  );
}
