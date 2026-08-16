export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 style={{ margin: 0 }}>{title}</h1>
      {subtitle ? <p className="muted" style={{ margin: "4px 0 0" }}>{subtitle}</p> : null}
    </div>
  );
}
