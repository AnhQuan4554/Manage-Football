"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button, Tag } from "antd";
import { CalendarOutlined, PlusOutlined } from "@ant-design/icons";
import type { Match } from "@/features/matches/types";
import { MatchSummaryCard } from "@/features/matches/components/MatchSummaryCard";
import { formatVnd } from "@/lib/utils/format";

type View = "scheduled" | "history";

export function MatchesBoard({
  matches,
  currentMonthKey,
}: {
  matches: Match[];
  currentMonthKey: string;
}) {
  const [view, setView] = useState<View>("scheduled");
  const [visibleCount, setVisibleCount] = useState(10);
  const currentMonth = monthNumber(currentMonthKey);

  const upcoming = useMemo(
    () =>
      matches
        .filter((match) => match.status === "scheduled")
        .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
    [matches],
  );
  const history = useMemo(
    () =>
      matches
        .filter((match) => match.status !== "scheduled")
        .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)),
    [matches],
  );
  const currentMatches = view === "scheduled" ? upcoming : history;
  const visibleMatches = currentMatches.slice(0, visibleCount);
  const hasMoreMatches = visibleCount < currentMatches.length;

  useEffect(() => {
    setVisibleCount(10);
  }, [view]);

  const currentMonthMatches = useMemo(
    () => matches.filter((match) => match.date.startsWith(currentMonthKey)),
    [currentMonthKey, matches],
  );
  const monthTotal = useMemo(
    () => currentMonthMatches.reduce((sum, match) => sum + match.pitchCost, 0),
    [currentMonthMatches],
  );

  return (
    <div className="page-stack matches-board">
      <section className="matches-stat-grid">
        <StatCard label="Tháng này" value={`${currentMonthMatches.length} trận`} />
        <StatCard label={`Chi phí T${currentMonth}`} value={formatVnd(monthTotal)} />
        <StatCard label="Đã qua" value={`${history.length} trận`} />
      </section>

      <div className="matches-segmented" role="tablist" aria-label="Lọc trận đấu">
        <button
          type="button"
          role="tab"
          aria-selected={view === "scheduled"}
          className={view === "scheduled" ? "matches-tab is-active" : "matches-tab"}
          onClick={() => setView("scheduled")}
        >
          Sắp diễn ra
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "history"}
          className={view === "history" ? "matches-tab is-active" : "matches-tab"}
          onClick={() => setView("history")}
        >
          Đã qua
        </button>
      </div>

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
          <>
            <div className="matches-grid">
              {visibleMatches.map((match) => (
                <MatchSummaryCard key={match.id} match={match} />
              ))}
            </div>
            {hasMoreMatches ? (
              <Button
                className="matches-load-more"
                onClick={() => setVisibleCount((count) => count + 10)}
              >
                Xem thêm 10 trận
              </Button>
            ) : null}
          </>
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

function monthNumber(monthKey: string) {
  return Number(monthKey.split("-")[1]);
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
