"use client";

import Link from "next/link";
import { Button, Card, List, Progress, Space, Tag } from "antd";
import type { FundTransaction, MatchSplit } from "@/features/funds/types";
import type { Match } from "@/features/matches/types";
import type { TeamMember } from "@/features/members/types";
import { formatVnd } from "@/lib/utils/format";

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

  return (
    <div className="page-stack">
      <section className="hero-card">
        <span style={{ color: "rgba(255,255,255,.75)" }}>Số dư quỹ hiện tại</span>
        <h1 style={{ color: "white", margin: "4px 0 0" }}>{formatVnd(balance)}</h1>
      </section>

      {split && match ? (
        <Card className="surface" title={`Chia tiền trận vs ${match.opponentName}`}>
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Space style={{ justifyContent: "space-between", width: "100%" }}>
              <div>
                <span className="muted">Mỗi người</span>
                <h2 style={{ margin: 0, color: "#d41478" }}>{formatVnd(perHead)}</h2>
              </div>
              <Tag color={paid === total ? "success" : "gold"}>{paid}/{total} đã đóng</Tag>
            </Space>
            <Progress percent={total ? Math.round((paid / total) * 100) : 0} />
            <p className="muted" style={{ margin: 0 }}>
              Còn thiếu: {unpaid.map((id) => memberById.get(id)?.nickname).filter(Boolean).join(", ")}
            </p>
            <Link href={`/funds/${match.id}`}><Button type="primary" block>Quản lý chia tiền</Button></Link>
          </Space>
        </Card>
      ) : null}

      <Card className="surface" title="Thu chi gần đây">
        <List
          dataSource={transactions}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.title}
                description={`${item.category === "football" ? "Tiền đá bóng" : item.category === "kit" ? "Tiền áo" : "Liên hoan"} - ${item.occurredAt}`}
              />
              <strong style={{ color: item.type === "income" ? "#11875d" : "#151927" }}>
                {item.type === "income" ? "+" : "-"}{formatVnd(item.amount)}
              </strong>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
