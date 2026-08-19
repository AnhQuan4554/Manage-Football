"use client";

import Link from "next/link";
import { Button, Progress, Tag } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import type { FundTransaction, MatchSplit } from "@/features/funds/types";
import type { Match } from "@/features/matches/types";
import type { TeamMember } from "@/features/members/types";
import { uiColors } from "@/lib/constants/colors";
import { formatDateShort, formatVnd } from "@/lib/utils/format";

export function FundOverview({
  balance,
  transactions,
  split,
  match,
  members,
}: {
  balance: number;
  transactions: FundTransaction[];
  split?: MatchSplit;
  match?: Match;
  members: TeamMember[];
}) {
  const perHead = split && split.includedMemberIds.length ? split.totalAmount / split.includedMemberIds.length : 0;
  const paid = split?.paidMemberIds.length ?? 0;
  const total = split?.includedMemberIds.length ?? 0;
  const unpaid = split ? split.includedMemberIds.filter((id) => !split.paidMemberIds.includes(id)) : [];
  const memberById = new Map(members.map((member) => [member.id, member]));
  const categoryLabel: Record<FundTransaction["category"], string> = {
    football: "Tiền đá bóng",
    kit: "Tiền áo",
    party: "Liên hoan",
  };

  return (
    <div className="page-stack">
      <section className="hero-card">
        <p className="text-kicker" style={{ color: "rgba(255,255,255,.75)", margin: 0 }}>Số dư quỹ hiện tại</p>
        <h1 className="display-title" style={{ color: uiColors.neutral.white, marginTop: 8 }}>{formatVnd(balance)}</h1>
        <div className="mini-stat-grid" style={{ marginTop: 16 }}>
          <div style={{ borderRadius: 16, background: "rgba(255,255,255,.12)", padding: 12 }}>
            <span className="text-kicker" style={{ color: "rgba(255,255,255,.72)" }}>Gần đây</span>
            <strong style={{ display: "block", color: uiColors.neutral.white, marginTop: 6 }}>{transactions.length} giao dịch</strong>
          </div>
          <div style={{ borderRadius: 16, background: "rgba(255,255,255,.12)", padding: 12 }}>
            <span className="text-kicker" style={{ color: "rgba(255,255,255,.72)" }}>Cần thu</span>
            <strong style={{ display: "block", color: uiColors.neutral.white, marginTop: 6 }}>{unpaid.length} người</strong>
          </div>
          <div style={{ borderRadius: 16, background: "rgba(255,255,255,.12)", padding: 12 }}>
            <span className="text-kicker" style={{ color: "rgba(255,255,255,.72)" }}>Mỗi người</span>
            <strong style={{ display: "block", color: uiColors.neutral.white, marginTop: 6 }}>{formatVnd(perHead)}</strong>
          </div>
        </div>
      </section>

      {split && match ? (
        <section className="surface-card">
          <div className="section-header">
            <div>
              <h2>Trận gần nhất</h2>
              <p className="muted" style={{ margin: "5px 0 0" }}>vs {match.opponentName}</p>
            </div>
            <Tag color={paid === total ? "success" : "gold"} style={{ marginInlineEnd: 0 }}>{paid}/{total}</Tag>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginTop: 16 }}>
            <div>
              <span className="text-kicker">Mỗi người</span>
              <strong style={{ display: "block", color: uiColors.brand.primary, fontSize: 30, marginTop: 5 }}>{formatVnd(perHead)}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="text-kicker">Đã đóng</span>
              <strong style={{ display: "block", fontSize: 24, marginTop: 5 }}>{paid}/{total}</strong>
            </div>
          </div>
          <Progress percent={total ? Math.round((paid / total) * 100) : 0} strokeColor={uiColors.brand.primary} />
          {unpaid.length ? (
            <p className="muted" style={{ margin: "8px 0 0" }}>
              Còn thiếu: {unpaid.map((id) => memberById.get(id)?.nickname).filter(Boolean).join(", ")}
            </p>
          ) : (
            <p style={{ color: uiColors.support.success, margin: "8px 0 0", fontWeight: 750 }}>Đã thu đủ trận này</p>
          )}
          <Link href={`/funds/${match.id}`}><Button type="primary" block style={{ marginTop: 14 }}>Quản lý chia tiền</Button></Link>
        </section>
      ) : null}

      <section className="page-stack">
        <div className="section-header">
          <h2>Thu chi gần đây</h2>
          <Link href="/funds/expenses" style={{ color: uiColors.brand.primary, fontWeight: 750 }}>Tất cả</Link>
        </div>
        <div className="surface" style={{ overflow: "hidden" }}>
          {transactions.slice(0, 5).map((item) => (
            <div className="transaction-row" key={item.id}>
              <span className="icon-chip" style={{ background: item.type === "income" ? "var(--success-soft)" : "var(--pink-soft)", color: item.type === "income" ? "var(--success)" : "var(--pink)" }}>
                {item.type === "income" ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <strong>{item.title}</strong>
                <span className="muted" style={{ display: "block", marginTop: 3, fontSize: 12 }}>
                  {categoryLabel[item.category]} · {formatDateShort(item.occurredAt)}
                </span>
              </span>
              <strong style={{ color: item.type === "income" ? uiColors.support.success : uiColors.ink.navy, fontVariantNumeric: "tabular-nums" }}>
                {item.type === "income" ? "+" : "-"}{formatVnd(item.amount)}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
