"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Button, Segmented, Tag } from "antd";
import { CalendarOutlined, PlusOutlined } from "@ant-design/icons";
import type { Match } from "@/features/matches/types";
import { MatchSummaryCard } from "@/features/matches/components/MatchSummaryCard";
import { formatVnd } from "@/lib/utils/format";

type View = "scheduled" | "history";

export function MatchesBoard({ matches }: { matches: Match[] }) {
  const [view, setView] = useState<View>("scheduled");
  const currentMonth = new Intl.DateTimeFormat("vi-VN", { month: "numeric" }).format(new Date());

  const upcoming = useMemo(() => matches.filter((match) => match.status === "scheduled"), [matches]);
  const history = useMemo(() => matches.filter((match) => match.status !== "scheduled"), [matches]);
  const currentMatches = view === "scheduled" ? upcoming : history;
  const monthTotal = useMemo(
    () => matches.reduce((sum, match) => sum + match.pitchCost, 0),
    [matches],
  );

  return (
    <div className="page-stack matches-board">
      <section className="matches-stat-grid">
        <StatCard label="Tháng này" value={`${matches.length} trận`} />
        <StatCard label={`Chi phí T${currentMonth}`} value={formatVnd(monthTotal)} />
        <StatCard label="Đã qua" value={`${history.length} trận`} />
      </section>

      <Segmented
        className="matches-segmented"
        block
        size="large"
        value={view}
        onChange={(value) => setView(value as View)}
        options={[
          { label: "Sắp diễn ra", value: "scheduled" },
          { label: "Đã qua", value: "history" },
        ]}
      />

      <section className="page-stack">
        <div className="section-header">
          <div>
            <h2>{view === "scheduled" ? "Sắp diễn ra" : "Đã qua"}</h2>
            <p className="muted" style={{ margin: "5px 0 0" }}>
              {view === "scheduled"
                ? "Các trận đang chờ chốt quân và đội hình."
                : "Lịch sử trận đã hoàn thành và xử lý chi phí sau trận."}
            </p>
          </div>
          <Tag color={view === "scheduled" ? "magenta" : "green"}>{currentMatches.length}</Tag>
        </div>

        {currentMatches.length ? (
          <div className="matches-grid">
            {currentMatches.map((match) => (
              <MatchSummaryCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={view === "scheduled" ? "Chưa có trận sắp diễn ra" : "Chưa có trận đã qua"}
            description={
              view === "scheduled"
                ? "Hãy tạo trận mới để bắt đầu chốt lịch."
                : "Khi trận hoàn thành, dữ liệu lịch sử sẽ hiển thị ở đây."
            }
            action={
              view === "scheduled" ? (
                <Link href="/matches/new">
                  <Button type="primary" icon={<PlusOutlined />}>
                    Tạo trận mới
                  </Button>
                </Link>
              ) : null
            }
          />
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini-stat matches-stat-card">
      <span className="text-kicker">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card matches-empty">
      <CalendarOutlined className="muted" style={{ fontSize: 24 }} />
      <strong>{title}</strong>
      <p className="muted">{description}</p>
      {action}
    </div>
  );
}
