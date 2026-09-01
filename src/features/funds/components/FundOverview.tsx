"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Radio, Select, Tabs } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  EditOutlined,
  PlusOutlined,
  RightOutlined,
} from "@ant-design/icons";
import type { FundCategory, FundTransaction } from "@/features/funds/types";
import type { TeamMember } from "@/features/members/types";
import { uiColors } from "@/lib/constants/colors";
import { formatDateShort, formatMoneyInput, formatVnd, parseMoneyInput } from "@/lib/utils/format";

type FundFormValues = {
  title: string;
  amount: number;
  type: FundTransaction["type"];
  category: FundCategory;
  occurredAt: string;
  note?: string;
};

export function FundOverview({
  balance,
  transactions,
  members,
}: {
  balance: number;
  transactions: FundTransaction[];
  members: TeamMember[];
}) {
  const [form] = Form.useForm<FundFormValues>();
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FundTransaction | null>(null);
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const currentMonthKey = currentMonth();
  const startingBalance =
    balance -
    transactions.reduce(
      (total, item) => total + (item.type === "income" ? item.amount : -item.amount),
      0,
    );
  const localBalance = localTransactions.reduce(
    (total, item) => total + (item.type === "income" ? item.amount : -item.amount),
    startingBalance,
  );
  const currentMonthTransactions = localTransactions
    .filter((item) => item.occurredAt.startsWith(currentMonthKey))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const currentMonthIncome = currentMonthTransactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);
  const currentMonthExpense = currentMonthTransactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);
  const categoryLabel: Record<FundTransaction["category"], string> = {
    football: "Tiền đá bóng",
    kit: "Tiền áo",
    party: "Liên hoan",
  };

  function openCreateModal() {
    setEditingTransaction(null);
    form.resetFields();
    form.setFieldsValue({
      type: "income",
      category: "football",
      occurredAt: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  }

  function openEditModal(item: FundTransaction) {
    setEditingTransaction(item);
    form.setFieldsValue({
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category,
      occurredAt: item.occurredAt,
      note: item.note,
    });
    setModalOpen(true);
  }

  function saveTransaction(values: FundFormValues) {
    const nextTransaction: FundTransaction = {
      id: editingTransaction?.id ?? `local-${Date.now()}`,
      teamId: editingTransaction?.teamId ?? "team-pinkstorm",
      type: values.type,
      category: values.category,
      amount: values.amount,
      title: values.title,
      note: values.note,
      occurredAt: values.occurredAt,
      createdBy: editingTransaction?.createdBy ?? "local-user",
    };

    setLocalTransactions((items) =>
      editingTransaction
        ? items.map((item) => (item.id === editingTransaction.id ? nextTransaction : item))
        : [nextTransaction, ...items],
    );
    setModalOpen(false);
  }

  return (
    <div className="page-stack">
      <section className="hero-card fund-hero">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          <div>
            <p className="text-kicker" style={{ color: "rgba(255,255,255,.75)", margin: 0 }}>
              Số dư quỹ hiện tại
            </p>
            <h1 className="display-title" style={{ color: uiColors.neutral.white, marginTop: 8 }}>
              {formatVnd(localBalance)}
            </h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Tạo mới quỹ
          </Button>
        </div>
        <div className="mini-stat-grid" style={{ marginTop: 18 }}>
          <HeroStat
            label={`Đã thu tháng ${monthNumber(currentMonthKey)}`}
            value={formatVnd(currentMonthIncome)}
          />
          <HeroStat
            label={`Đã chi tháng ${monthNumber(currentMonthKey)}`}
            value={formatVnd(currentMonthExpense)}
          />
          <HeroStat
            label="Giao dịch tháng này"
            value={`${currentMonthTransactions.length} khoản`}
          />
        </div>
      </section>

      <section className="page-stack">
        <div className="section-header">
          <div>
            <h2>Thu chi tháng này</h2>
            <p className="muted" style={{ margin: "5px 0 0" }}>
              Hiển thị toàn bộ khoản thu/chi trong tháng hiện tại.
            </p>
          </div>
          <Link href="/funds/expenses" style={{ color: uiColors.brand.primary, fontWeight: 500 }}>
            Tất cả <RightOutlined />
          </Link>
        </div>
        <div className="surface" style={{ overflow: "hidden" }}>
          {currentMonthTransactions.length ? (
            currentMonthTransactions.map((item) => (
              <TransactionRow
                key={item.id}
                item={item}
                categoryLabel={categoryLabel}
                createdBy={memberById.get(item.createdBy)?.nickname}
                onEdit={() => openEditModal(item)}
              />
            ))
          ) : (
            <p className="muted" style={{ margin: 0, padding: 16 }}>
              Tháng này chưa có giao dịch nào.
            </p>
          )}
        </div>
      </section>

      <section className="surface-card" style={{ background: "var(--pink-soft)" }}>
        <strong>Gợi ý luồng tạo quỹ</strong>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          Quỹ dùng cho khoản thu/chi chung như quỹ tháng, tiền áo, liên hoan, donate hoặc khoản chi
          ngoài trận. Theo dõi ai đóng đủ/chưa đủ tiền sân đã được chuyển sang tab Thống kê.
        </p>
      </section>

      <FundModal
        form={form}
        open={modalOpen}
        editing={Boolean(editingTransaction)}
        onCancel={() => setModalOpen(false)}
        onFinish={saveTransaction}
      />
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: 16, background: "rgba(255,255,255,.12)", padding: 12 }}>
      <span className="text-kicker" style={{ color: "rgba(255,255,255,.72)" }}>
        {label}
      </span>
      <strong style={{ display: "block", color: uiColors.neutral.white, marginTop: 6 }}>
        {value}
      </strong>
    </div>
  );
}

function TransactionRow({
  item,
  categoryLabel,
  createdBy,
  onEdit,
}: {
  item: FundTransaction;
  categoryLabel: Record<FundTransaction["category"], string>;
  createdBy?: string;
  onEdit: () => void;
}) {
  const income = item.type === "income";

  return (
    <div className="transaction-row">
      <span
        className="icon-chip"
        style={{
          background: income ? "var(--success-soft)" : "var(--pink-soft)",
          color: income ? "var(--success)" : "var(--pink)",
        }}
      >
        {income ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <strong>{item.title}</strong>
        <span className="muted" style={{ display: "block", marginTop: 3, fontSize: 12 }}>
          {categoryLabel[item.category]} · {formatDateShort(item.occurredAt)}
          {createdBy ? ` · ${createdBy}` : ""}
        </span>
      </span>
      <strong
        style={{
          color: income ? uiColors.support.success : uiColors.ink.navy,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {income ? "+" : "-"}
        {formatVnd(item.amount)}
      </strong>
      <Button type="text" icon={<EditOutlined />} onClick={onEdit} aria-label="Sửa giao dịch" />
    </div>
  );
}

function FundModal({
  form,
  open,
  editing,
  onCancel,
  onFinish,
}: {
  form: ReturnType<typeof Form.useForm<FundFormValues>>[0];
  open: boolean;
  editing: boolean;
  onCancel: () => void;
  onFinish: (values: FundFormValues) => void;
}) {
  const commonFields = (
    <>
      <Form.Item
        label="Tên khoản"
        name="title"
        rules={[{ required: true, message: "Nhập tên khoản" }]}
      >
        <Input placeholder="Ví dụ: Quỹ tháng 9 hoặc Donate thêm cho đội" />
      </Form.Item>
      <Form.Item
        label="Số tiền"
        name="amount"
        rules={[{ required: true, message: "Nhập số tiền" }]}
      >
        <InputNumber<number>
          min={0}
          style={{ width: "100%" }}
          placeholder="500.000"
          formatter={(value) => formatMoneyInput(value)}
          parser={(value) => parseMoneyInput(value)}
        />
      </Form.Item>
      <Form.Item
        label="Ngày ghi nhận"
        name="occurredAt"
        rules={[{ required: true, message: "Chọn ngày" }]}
      >
        <Input type="date" />
      </Form.Item>
      <Form.Item label="Loại giao dịch" name="type">
        <Radio.Group>
          <Radio.Button value="income">Thu vào</Radio.Button>
          <Radio.Button value="expense">Chi ra</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="Nhóm" name="category">
        <Select
          options={[
            { value: "football", label: "Tiền đá bóng" },
            { value: "kit", label: "Tiền áo" },
            { value: "party", label: "Liên hoan" },
          ]}
        />
      </Form.Item>
      <Form.Item label="Ghi chú" name="note">
        <Input.TextArea rows={3} placeholder="Ghi chú thêm nếu có" />
      </Form.Item>
    </>
  );

  return (
    <Modal
      title={editing ? "Sửa quỹ" : "Tạo mới quỹ"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={editing ? "Lưu thay đổi" : "Tạo khoản"}
      cancelText="Huỷ"
      destroyOnHidden
    >
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Tabs
          items={[
            {
              key: "monthly",
              label: "Quỹ tháng",
              children: (
                <>
                  <p className="muted" style={{ marginTop: 0 }}>
                    Dùng khi cả đội đóng định kỳ hoặc ghi nhận khoản quỹ chung.
                  </p>
                  {commonFields}
                </>
              ),
            },
            {
              key: "extra",
              label: "Phát sinh",
              children: (
                <>
                  <p className="muted" style={{ marginTop: 0 }}>
                    Dùng cho tiền áo, liên hoan, donate thêm hoặc khoản chi ngoài trận.
                  </p>
                  {commonFields}
                </>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthNumber(monthKey: string) {
  return Number(monthKey.split("-")[1]);
}
