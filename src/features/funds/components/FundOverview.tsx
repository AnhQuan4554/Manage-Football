"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Collapse, Form, Input, InputNumber, Modal, Progress, Radio, Select, Tabs, Tag } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, EditOutlined, PlusOutlined, RightOutlined } from "@ant-design/icons";
import type { FundCategory, FundTransaction, MatchSplit } from "@/features/funds/types";
import type { Match } from "@/features/matches/types";
import type { TeamMember } from "@/features/members/types";
import { uiColors } from "@/lib/constants/colors";
import { formatDateShort, formatVnd } from "@/lib/utils/format";

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
  split,
  match,
  members,
  matchSplits = [],
  matches = [],
}: {
  balance: number;
  transactions: FundTransaction[];
  split?: MatchSplit;
  match?: Match;
  members: TeamMember[];
  matchSplits?: MatchSplit[];
  matches?: Match[];
}) {
  const [form] = Form.useForm<FundFormValues>();
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FundTransaction | null>(null);
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const matchById = useMemo(() => new Map(matches.map((item) => [item.id, item])), [matches]);
  const currentMonthKey = currentMonth();
  const startingBalance = balance - transactions.reduce((total, item) => total + (item.type === "income" ? item.amount : -item.amount), 0);
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
  const latestSummary = split ? getSplitSummary(split, memberById) : null;
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

    setLocalTransactions((items) => (
      editingTransaction
        ? items.map((item) => (item.id === editingTransaction.id ? nextTransaction : item))
        : [nextTransaction, ...items]
    ));
    setModalOpen(false);
  }

  return (
    <div className="page-stack">
      <section className="hero-card fund-hero">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div>
            <p className="text-kicker" style={{ color: "rgba(255,255,255,.75)", margin: 0 }}>Số dư quỹ hiện tại</p>
            <h1 className="display-title" style={{ color: uiColors.neutral.white, marginTop: 8 }}>{formatVnd(localBalance)}</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Tạo mới quỹ
          </Button>
        </div>
        <div className="mini-stat-grid" style={{ marginTop: 18 }}>
          <HeroStat label={`Đã thu tháng ${monthNumber(currentMonthKey)}`} value={formatVnd(currentMonthIncome)} />
          <HeroStat label={`Đã chi tháng ${monthNumber(currentMonthKey)}`} value={formatVnd(currentMonthExpense)} />
          <HeroStat label="Giao dịch tháng này" value={`${currentMonthTransactions.length} khoản`} />
        </div>
      </section>

      {split && match && latestSummary ? (
        <section className="surface-card">
          <div className="section-header">
            <div>
              <h2>Trận gần nhất</h2>
              <p className="muted" style={{ margin: "5px 0 0" }}>vs {match.opponentName} · {formatDateShort(match.date)}</p>
            </div>
            <Tag color={latestSummary.paid === latestSummary.total ? "success" : "gold"} style={{ marginInlineEnd: 0 }}>
              {latestSummary.paid}/{latestSummary.total}
            </Tag>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginTop: 16 }}>
            <div>
              <span className="text-kicker">Mỗi người</span>
              <strong style={{ display: "block", color: uiColors.brand.primary, fontSize: 30, marginTop: 5 }}>{formatVnd(latestSummary.perHead)}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="text-kicker">Đã đóng</span>
              <strong style={{ display: "block", fontSize: 24, marginTop: 5 }}>{latestSummary.paid}/{latestSummary.total}</strong>
            </div>
          </div>
          <Progress
            percent={latestSummary.total ? Math.round((latestSummary.paid / latestSummary.total) * 100) : 0}
            showInfo={false}
            strokeColor={uiColors.brand.primary}
            trailColor="#ffd1e7"
          />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span className="muted">Còn thiếu</span>
            <strong style={{ color: "var(--danger)" }}>{formatVnd(latestSummary.unpaidAmount)}</strong>
          </div>
          {latestSummary.unpaidMembers.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {latestSummary.unpaidMembers.map((member) => (
                <Tag key={member.id} color="magenta" style={{ marginInlineEnd: 0 }}>{member.nickname}</Tag>
              ))}
            </div>
          ) : null}
          <Link href={`/funds/${match.id}`}>
            <Button type="primary" block style={{ marginTop: 14 }}>Quản lý thu tiền trận này</Button>
          </Link>
        </section>
      ) : null}

      <section className="page-stack">
        <div className="section-header">
          <div>
            <h2>Tiền sân theo trận</h2>
            <p className="muted" style={{ margin: "5px 0 0" }}>Click từng trận để xem ai đã đóng và còn thiếu.</p>
          </div>
        </div>
        <Collapse
          bordered={false}
          expandIconPosition="end"
          className="fund-collapse"
          items={matchSplits.map((item) => buildMatchSplitPanel(item, matchById.get(item.matchId), memberById))}
        />
      </section>

      <section className="page-stack">
        <div className="section-header">
          <div>
            <h2>Thu chi tháng này</h2>
            <p className="muted" style={{ margin: "5px 0 0" }}>Hiển thị toàn bộ khoản thu/chi trong tháng hiện tại.</p>
          </div>
          <Link href="/funds/expenses" style={{ color: uiColors.brand.primary, fontWeight: 750 }}>Tất cả <RightOutlined /></Link>
        </div>
        <div className="surface" style={{ overflow: "hidden" }}>
          {currentMonthTransactions.length ? currentMonthTransactions.map((item) => (
            <TransactionRow
              key={item.id}
              item={item}
              categoryLabel={categoryLabel}
              createdBy={memberById.get(item.createdBy)?.nickname}
              onEdit={() => openEditModal(item)}
            />
          )) : (
            <p className="muted" style={{ margin: 0, padding: 16 }}>Tháng này chưa có giao dịch nào.</p>
          )}
        </div>
      </section>

      <section className="surface-card" style={{ background: "var(--pink-soft)" }}>
        <strong>Gợi ý luồng tạo quỹ</strong>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          Hai tab là hợp lý: quỹ tháng dùng cho khoản đóng định kỳ của toàn đội, phát sinh dùng cho tiền áo,
          liên hoan, donate hoặc khoản chi ngoài trận. Tiền sân theo trận nên sinh từ màn trận đấu/chia tiền để
          tránh nhập tay sai số người.
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
      <span className="text-kicker" style={{ color: "rgba(255,255,255,.72)" }}>{label}</span>
      <strong style={{ display: "block", color: uiColors.neutral.white, marginTop: 6 }}>{value}</strong>
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
          {categoryLabel[item.category]} · {formatDateShort(item.occurredAt)}{createdBy ? ` · ${createdBy}` : ""}
        </span>
      </span>
      <strong style={{ color: income ? uiColors.support.success : uiColors.ink.navy, fontVariantNumeric: "tabular-nums" }}>
        {income ? "+" : "-"}{formatVnd(item.amount)}
      </strong>
      <Button type="text" icon={<EditOutlined />} onClick={onEdit} aria-label="Sửa giao dịch" />
    </div>
  );
}

function buildMatchSplitPanel(
  split: MatchSplit,
  match: Match | undefined,
  memberById: Map<string, TeamMember>,
) {
  const summary = getSplitSummary(split, memberById);

  return {
    key: split.matchId,
    label: (
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <span style={{ minWidth: 0 }}>
          <strong>vs {match?.opponentName ?? "Chưa rõ đối thủ"}</strong>
          <span className="muted" style={{ display: "block", fontSize: 12 }}>
            {match ? `${formatDateShort(match.date)} · ${formatVnd(split.totalAmount)} · ${formatVnd(summary.perHead)}/người` : formatVnd(split.totalAmount)}
          </span>
        </span>
        <Tag color={summary.paid === summary.total ? "success" : "gold"} style={{ marginInlineEnd: 0 }}>
          {summary.paid}/{summary.total}
        </Tag>
      </div>
    ),
    children: (
      <div className="page-stack" style={{ gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          <MiniMoney label="Mỗi người" value={summary.perHead} />
          <MiniMoney label="Đã thu" value={summary.paidAmount} />
          <MiniMoney label="Còn thiếu" value={summary.unpaidAmount} danger />
        </div>
        <div>
          <span className="text-kicker">Còn thiếu</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {summary.unpaidMembers.length ? summary.unpaidMembers.map((member) => (
              <Tag key={member.id} color="magenta" style={{ marginInlineEnd: 0 }}>{member.nickname} · {formatVnd(summary.perHead)}</Tag>
            )) : <Tag color="success">Đã thu đủ</Tag>}
          </div>
        </div>
        <div>
          <span className="text-kicker">Đã đóng</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {summary.paidMembers.map((member) => (
              <Tag key={member.id} color="green" style={{ marginInlineEnd: 0 }}>{member.nickname}</Tag>
            ))}
          </div>
        </div>
      </div>
    ),
  };
}

function MiniMoney({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div style={{ borderRadius: 14, background: "var(--bg)", padding: 12 }}>
      <span className="text-kicker">{label}</span>
      <strong style={{ display: "block", marginTop: 5, color: danger ? "var(--danger)" : "var(--navy)" }}>{formatVnd(value)}</strong>
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
      <Form.Item label="Tên khoản" name="title" rules={[{ required: true, message: "Nhập tên khoản" }]}>
        <Input placeholder="Ví dụ: Quỹ tháng 8 hoặc Donate thêm cho đội" />
      </Form.Item>
      <Form.Item label="Số tiền" name="amount" rules={[{ required: true, message: "Nhập số tiền" }]}>
        <InputNumber min={0} style={{ width: "100%" }} placeholder="500000" />
      </Form.Item>
      <Form.Item label="Ngày ghi nhận" name="occurredAt" rules={[{ required: true, message: "Chọn ngày" }]}>
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
                    Dùng khi cả đội đóng định kỳ. Sau này nên tự sinh công nợ cho từng thành viên.
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

function getSplitSummary(split: MatchSplit, memberById: Map<string, TeamMember>) {
  const perHead = split.includedMemberIds.length ? split.totalAmount / split.includedMemberIds.length : 0;
  const paidMembers = split.paidMemberIds
    .map((id) => memberById.get(id))
    .filter((member): member is TeamMember => Boolean(member));
  const unpaidMembers = split.includedMemberIds
    .filter((id) => !split.paidMemberIds.includes(id))
    .map((id) => memberById.get(id))
    .filter((member): member is TeamMember => Boolean(member));

  return {
    perHead,
    total: split.includedMemberIds.length,
    paid: split.paidMemberIds.length,
    paidAmount: split.paidMemberIds.length * perHead,
    unpaidAmount: unpaidMembers.length * perHead,
    paidMembers,
    unpaidMembers,
  };
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthNumber(monthKey: string) {
  return Number(monthKey.split("-")[1]);
}
