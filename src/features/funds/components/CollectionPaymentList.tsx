"use client";

import { Button, DatePicker, Input, Modal, Space, Tag, TimePicker, message } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatVnd } from "@/lib/utils/format";
import type { AppResponse } from "@/lib/response";
import type { MatchSplit } from "@/features/funds/types";
import type { TeamMember } from "@/features/members/types";

type PaymentItem = MatchSplit["items"][number];

type PaymentPayload = AppResponse<PaymentItem>;

const statusMeta: Record<PaymentItem["status"], { label: string; color: string }> = {
  unpaid: { label: "Chưa đóng", color: "default" },
  partial: { label: "Đóng thiếu", color: "gold" },
  paid: { label: "Đã đóng đủ", color: "success" },
  overpaid: { label: "Đóng thừa", color: "blue" },
  waived: { label: "Miễn đóng", color: "purple" },
};

function formatPaidAt(value: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getBalanceLabel(item: PaymentItem) {
  const delta = item.amountPaid - item.amountDue;

  if (delta > 0) return `Thừa ${formatVnd(delta)}`;
  if (delta < 0 && item.amountPaid > 0) return `Thiếu ${formatVnd(Math.abs(delta))}`;
  if (item.amountPaid <= 0) return "Chưa thu";
  return "Đủ tiền";
}

export function CollectionPaymentList({
  teamId,
  matchId,
  items,
  members,
}: {
  teamId: string;
  matchId: string;
  items: PaymentItem[];
  members: TeamMember[];
}) {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState<PaymentItem | null>(null);
  const [paidDate, setPaidDate] = useState<Dayjs>(dayjs());
  const [paidTime, setPaidTime] = useState<Dayjs>(dayjs());
  const [paymentNote, setPaymentNote] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const memberById = new Map(members.map((member) => [member.id, member]));

  function openPaidModal(item: PaymentItem) {
    const now = dayjs();
    setActiveItem(item);
    setPaidDate(now);
    setPaidTime(now);
    setPaymentNote(item.paymentNote ?? "");
  }

  async function updatePayment(item: PaymentItem, action: "mark_paid" | "mark_unpaid") {
    setSubmittingId(item.id);

    const paidAt = paidDate
      .hour(paidTime.hour())
      .minute(paidTime.minute())
      .second(0)
      .millisecond(0)
      .toISOString();

    try {
      const response = await fetch(`/api/teams/${teamId}/matches/${matchId}/collection-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          paidAt,
          paymentNote,
        }),
      });
      const payload = (await response.json()) as PaymentPayload;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? payload.error ?? "Không thể cập nhật tiền");
      }

      message.success(payload.message ?? "Đã cập nhật tiền");
      setActiveItem(null);
      router.refresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể cập nhật tiền");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <>
      <div className="page-stack">
        {items.map((item) => {
          const member = item.membershipId ? memberById.get(item.membershipId) : undefined;
          const meta = statusMeta[item.status];
          const paidAt = formatPaidAt(item.paidAt);
          const canMarkPaid = item.status === "unpaid" || item.status === "partial";
          const canUndo = item.status === "paid" || item.status === "overpaid";

          return (
            <div
              key={item.id}
              style={{
                alignItems: "center",
                border: "1px solid rgba(15, 23, 42, 0.08)",
                borderRadius: 16,
                display: "grid",
                gap: 12,
                gridTemplateColumns: "minmax(0, 1fr) auto",
                padding: 14,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Space wrap size={8}>
                  <strong>{member?.nickname || item.participantName}</strong>
                  <Tag color={meta.color}>{meta.label}</Tag>
                </Space>
                <p className="muted" style={{ margin: "6px 0 0" }}>
                  Phải đóng {formatVnd(item.amountDue)} · Đã đóng {formatVnd(item.amountPaid)} · {getBalanceLabel(item)}
                </p>
                {paidAt ? (
                  <p className="muted" style={{ margin: "4px 0 0" }}>
                    Xác nhận lần đầu: {paidAt}
                  </p>
                ) : null}
              </div>

              <Space wrap style={{ justifyContent: "flex-end" }}>
                {canMarkPaid ? (
                  <Button type="primary" onClick={() => openPaidModal(item)} disabled={submittingId === item.id}>
                    {item.status === "partial" ? "Xác nhận đủ" : "Đã đóng"}
                  </Button>
                ) : null}
                {canUndo ? (
                  <Button danger onClick={() => updatePayment(item, "mark_unpaid")} loading={submittingId === item.id}>
                    Hoàn tác
                  </Button>
                ) : null}
              </Space>
            </div>
          );
        })}
      </div>

      <Modal
        title={activeItem ? `Xác nhận ${activeItem.participantName} đã đóng` : "Xác nhận đã đóng"}
        open={Boolean(activeItem)}
        onCancel={() => setActiveItem(null)}
        footer={null}
        destroyOnHidden
      >
        {activeItem ? (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <p className="muted" style={{ margin: 0 }}>
              Mặc định là thời điểm mở popup, có thể chọn lại ngày giờ trước khi xác nhận.
            </p>
            <div>
              <label>Ngày đóng</label>
              <DatePicker value={paidDate} onChange={(value) => value && setPaidDate(value)} style={{ width: "100%" }} format="DD/MM/YYYY" />
            </div>
            <div>
              <label>Giờ đóng</label>
              <TimePicker value={paidTime} onChange={(value) => value && setPaidTime(value)} style={{ width: "100%" }} format="HH:mm" />
            </div>
            <div>
              <label>Ghi chú</label>
              <Input.TextArea
                rows={3}
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder="VD: chuyển khoản, tiền mặt, gộp nhiều trận..."
              />
            </div>
            <Button type="primary" block loading={submittingId === activeItem.id} onClick={() => updatePayment(activeItem, "mark_paid")}>
              Xác nhận đã đóng đủ
            </Button>
          </Space>
        ) : null}
      </Modal>
    </>
  );
}
