"use client";

import { useState } from "react";
import { Tabs, Tag } from "antd";
import type { MatchDetailResponse } from "@/features/matches/services/matchApiService";
import { formatVnd } from "@/lib/utils/format";

type CollectionItem = NonNullable<MatchDetailResponse["collection"]>["items"][number];

function isPaid(item: CollectionItem) {
  return item.status === "paid" || item.status === "overpaid";
}

function PaymentList({ items, emptyText }: { items: CollectionItem[]; emptyText: string }) {
  if (!items.length) {
    return <p className="muted match-detail-payment-empty">{emptyText}</p>;
  }

  return (
    <div className="match-detail-payment-list">
      {items.map((item) => {
        const paid = isPaid(item);

        return (
          <div key={item.id} className="match-detail-payment-item">
            <span>{item.participantName}</span>
            <strong>{formatVnd(item.amountDue)}</strong>
            <Tag color={paid ? "success" : "magenta"}>{paid ? "Đã đóng" : "Chưa đóng"}</Tag>
          </div>
        );
      })}
    </div>
  );
}

function TabLabel({ label, count }: { label: string; count: number }) {
  return (
    <span className="match-detail-payment-tab-label">
      {label}
      <span>{count}</span>
    </span>
  );
}

export function MatchPaymentTabs({ items }: { items: CollectionItem[] }) {
  const [activeKey, setActiveKey] = useState<"unpaid" | "paid">("unpaid");
  const unpaidItems = items.filter((item) => !isPaid(item));
  const paidItems = items.filter(isPaid);

  return (
    <Tabs
      className={`match-detail-payment-tabs match-detail-payment-tabs--${activeKey}`}
      activeKey={activeKey}
      onChange={(key) => setActiveKey(key === "paid" ? "paid" : "unpaid")}
      items={[
        {
          key: "unpaid",
          label: <TabLabel label="Chưa đóng" count={unpaidItems.length} />,
          children: <PaymentList items={unpaidItems} emptyText="Tất cả thành viên đã đóng đủ." />,
        },
        {
          key: "paid",
          label: <TabLabel label="Đã đóng" count={paidItems.length} />,
          children: <PaymentList items={paidItems} emptyText="Chưa có thành viên đã đóng." />,
        },
      ]}
    />
  );
}
