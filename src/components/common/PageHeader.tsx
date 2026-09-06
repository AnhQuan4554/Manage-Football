export function PageHeader({
  title,
  subtitle,
  action,
  variant = "default",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  variant?: "default" | "form";
}) {
  return (
    <div className={variant === "form" ? "page-header form-page-header" : "page-header"}>
      <div style={{ minWidth: 0 }}>
        <h1>{title}</h1>
        {subtitle ? (
          <p className="muted" style={{ margin: "6px 0 0" }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
    </div>
  );
}
