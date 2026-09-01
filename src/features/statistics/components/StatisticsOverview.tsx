"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Alert, Button, Collapse, Progress, Tag } from "antd";
import type { MatchSplit, MatchSplitSummary } from "@/features/funds/types";
import type { Match } from "@/features/matches/types";
import type { TeamMember } from "@/features/members/types";
import { uiColors } from "@/lib/constants/colors";
import { formatDateShort, formatVnd } from "@/lib/utils/format";

export function StatisticsOverview({
  split,
  match,
  members,
  matchSplits = [],
  matches = [],
}: {
  split?: MatchSplit;
  match?: Match;
  members: TeamMember[];
  matchSplits?: MatchSplit[];
  matches?: Match[];
}) {
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const matchById = useMemo(() => new Map(matches.map((item) => [item.id, item])), [matches]);
  const currentMonthKey = currentMonth();
  const [selectedDebtMonth, setSelectedDebtMonth] = useState(currentMonthKey);
  const latestSummary = split ? getSplitSummary(split, memberById) : null;
  const splitSummaries = matchSplits
    .map((item) => ({
      split: item,
      match: matchById.get(item.matchId),
      summary: getSplitSummary(item, memberById),
    }))
    .sort((a, b) => Number(a.summary.isComplete) - Number(b.summary.isComplete));
  const unpaidMatchSummaries = splitSummaries.filter((item) => !item.summary.isComplete);
  const debtMonthOptions = useMemo(
    () => buildDebtMonthOptions(matchSplits, matchById, currentMonthKey),
    [currentMonthKey, matchById, matchSplits],
  );
  const monthlyDebtReport = useMemo(
    () => buildMonthlyDebtReport(selectedDebtMonth, matchSplits, matchById, members),
    [matchById, matchSplits, members, selectedDebtMonth],
  );

  return (
    <div className="page-stack statistics-page">
      <section className="surface-card member-debt-card">
        <div className="section-header member-debt-head">
          <div>
            <span className="text-kicker">Công nợ tháng</span>
            <h2>Tiền sân từng thành viên</h2>
            <p className="muted" style={{ margin: "5px 0 0" }}>
              Lọc theo tháng đá trận, tính từ dữ liệu chia tiền thật.
            </p>
          </div>
          <label className="member-debt-month-picker">
            <span>Tháng</span>
            <select
              value={selectedDebtMonth}
              onChange={(event) => setSelectedDebtMonth(event.target.value)}
            >
              {debtMonthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="member-debt-stats">
          <MiniMoney label="Phải thu" value={monthlyDebtReport.totalDue} />
          <MiniMoney label="Đã thu" value={monthlyDebtReport.totalPaid} />
          <MiniMoney label="Còn thiếu" value={monthlyDebtReport.totalMissing} danger />
        </div>

        {monthlyDebtReport.rows.length ? (
          <div className="member-debt-list">
            {monthlyDebtReport.rows.map((row) => (
              <details key={row.memberId} className="member-debt-row" open={row.missingAmount > 0}>
                <summary>
                  <span className="member-debt-person">
                    <span className="member-debt-avatar">{getInitials(row.name)}</span>
                    <span>
                      <strong>{row.name}</strong>
                      <small>
                        {row.matchCount} trận · đã đóng {formatVnd(row.paidAmount)}
                      </small>
                    </span>
                  </span>
                  <span className="member-debt-money">
                    <span>
                      Phải đóng <strong>{formatVnd(row.dueAmount)}</strong>
                    </span>
                    <span className={row.missingAmount > 0 ? "is-danger" : "is-success"}>
                      Còn thiếu <strong>{formatVnd(row.missingAmount)}</strong>
                    </span>
                  </span>
                </summary>
                <div className="member-debt-detail-list">
                  {row.matches.map((item) => (
                    <Link
                      key={item.matchId}
                      href={"/funds/" + item.matchId}
                      className="member-debt-detail"
                    >
                      <span>
                        <strong>vs {item.opponentName}</strong>
                        <small>{formatDateShort(item.date)}</small>
                      </span>
                      <span>
                        <small>Đã đóng</small>
                        <strong>{formatVnd(item.amountPaid)}</strong>
                      </span>
                      <span className={item.missingAmount > 0 ? "is-danger" : "is-success"}>
                        <small>Còn thiếu</small>
                        <strong>{formatVnd(item.missingAmount)}</strong>
                      </span>
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="member-debt-empty">Tháng này chưa có dữ liệu chia tiền sân.</p>
        )}
      </section>

      {split && match && latestSummary ? (
        <section className="surface-card statistics-latest-card">
          <div className="section-header">
            <div>
              <h2>Trận gần nhất</h2>
              <p className="muted" style={{ margin: "5px 0 0" }}>
                vs {match.opponentName} · {formatDateShort(match.date)}
              </p>
            </div>
            <Tag
              color={latestSummary.paid === latestSummary.total ? "success" : "gold"}
              style={{ marginInlineEnd: 0 }}
            >
              {latestSummary.paid}/{latestSummary.total}
            </Tag>
          </div>
          <div className="statistics-latest-money">
            <div>
              <span className="text-kicker">Mỗi người</span>
              <strong>{formatVnd(latestSummary.perHead)}</strong>
            </div>
            <div>
              <span className="text-kicker">Đã đóng</span>
              <strong>
                {latestSummary.paid}/{latestSummary.total}
              </strong>
            </div>
          </div>
          <Progress
            percent={
              latestSummary.total ? Math.round((latestSummary.paid / latestSummary.total) * 100) : 0
            }
            showInfo={false}
            strokeColor={uiColors.brand.primary}
            trailColor="#ffd1e7"
          />
          <div className="statistics-latest-missing">
            <span className="muted">Còn thiếu</span>
            <strong>{formatVnd(latestSummary.unpaidAmount)}</strong>
          </div>
          {(latestSummary.unpaidMembers ?? []).length ? (
            <div className="statistics-tag-list">
              {(latestSummary.unpaidMembers ?? []).map((member) => (
                <Tag key={member.id} color="magenta" style={{ marginInlineEnd: 0 }}>
                  {displayMemberName(member)}
                </Tag>
              ))}
            </div>
          ) : null}
          <Link href={`/funds/${match.id}`}>
            <Button type="primary" block className="statistics-primary-action">
              Quản lý thu tiền trận này
            </Button>
          </Link>
        </section>
      ) : null}

      <section className="surface-card">
        <div className="section-header">
          <div>
            <h2>Trận chưa đóng đủ</h2>
            <p className="muted" style={{ margin: "5px 0 0" }}>
              Chỉ cần mở từng trận để xem ai đã đóng và ai còn thiếu.
            </p>
          </div>
        </div>
        {unpaidMatchSummaries.length ? (
          <div className="page-stack" style={{ gap: 10 }}>
            {unpaidMatchSummaries.map(({ split: item, match, summary }) => (
              <Link
                key={item.matchId}
                href={`/funds/${item.matchId}`}
                className="surface statistics-unpaid-row"
              >
                <span style={{ minWidth: 0 }}>
                  <strong>vs {match?.opponentName ?? "Chưa rõ đối thủ"}</strong>
                  <span className="muted">
                    {match
                      ? `${formatDateShort(match.date)} · ${formatVnd(summary.perHead)}/người`
                      : formatVnd(item.totalAmount)}
                  </span>
                </span>
                <Tag color="magenta" style={{ marginInlineEnd: 0 }}>
                  Thiếu {summary.unpaidCount}/{summary.totalCount}
                </Tag>
              </Link>
            ))}
          </div>
        ) : (
          <Alert
            type="success"
            showIcon
            message="Tất cả trận đã thu đủ"
            description="Không còn trận nào thiếu tiền sân trong danh sách hiện tại."
          />
        )}
      </section>

      <section className="page-stack">
        <div className="section-header">
          <div>
            <h2>Tiền sân theo trận</h2>
            <p className="muted" style={{ margin: "5px 0 0" }}>
              Click từng trận để xem ai đã đóng và còn thiếu.
            </p>
          </div>
        </div>
        <Collapse
          bordered={false}
          expandIconPosition="end"
          className="fund-collapse"
          items={matchSplits.map((item) =>
            buildMatchSplitPanel(item, matchById.get(item.matchId), memberById),
          )}
        />
      </section>
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
      <div className="statistics-split-panel-label">
        <span style={{ minWidth: 0 }}>
          <strong>vs {match?.opponentName ?? "Chưa rõ đối thủ"}</strong>
          <span className="muted">
            {match
              ? `${formatDateShort(match.date)} · ${formatVnd(split.totalAmount)} · ${formatVnd(summary.perHead)}/người`
              : formatVnd(split.totalAmount)}
          </span>
        </span>
        <Tag
          color={summary.paid === summary.total ? "success" : "gold"}
          style={{ marginInlineEnd: 0 }}
        >
          {summary.paid}/{summary.total}
        </Tag>
      </div>
    ),
    children: (
      <div className="page-stack" style={{ gap: 12 }}>
        <div className="statistics-split-money-grid">
          <MiniMoney label="Mỗi người" value={summary.perHead} />
          <MiniMoney label="Đã thu" value={summary.paidAmount} />
          <MiniMoney label="Còn thiếu" value={summary.unpaidAmount} danger />
        </div>
        <div>
          <span className="text-kicker">Còn thiếu</span>
          <div className="statistics-tag-list">
            {(summary.unpaidMembers ?? []).length ? (
              (summary.unpaidMembers ?? []).map((member) => (
                <Tag key={member.id} color="magenta" style={{ marginInlineEnd: 0 }}>
                  {displayMemberName(member)} · {formatVnd(summary.perHead)}
                </Tag>
              ))
            ) : (
              <Tag color="success">Đã thu đủ</Tag>
            )}
          </div>
        </div>
        <div>
          <span className="text-kicker">Đã đóng</span>
          <div className="statistics-tag-list">
            {(summary.paidMembers ?? []).map((member) => (
              <Tag key={member.id} color="green" style={{ marginInlineEnd: 0 }}>
                {displayMemberName(member)}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    ),
  };
}

function MiniMoney({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="mini-money" data-danger={danger || undefined}>
      <span className="text-kicker">{label}</span>
      <strong>{formatVnd(value)}</strong>
    </div>
  );
}

type DebtMonthOption = {
  value: string;
  label: string;
};

type MemberDebtMatch = {
  matchId: string;
  opponentName: string;
  date: string;
  amountDue: number;
  amountPaid: number;
  missingAmount: number;
};

type MemberDebtRow = {
  memberId: string;
  name: string;
  matchCount: number;
  dueAmount: number;
  paidAmount: number;
  missingAmount: number;
  matches: MemberDebtMatch[];
};

function buildDebtMonthOptions(
  matchSplits: MatchSplit[],
  matchById: Map<string, Match>,
  fallbackMonth: string,
): DebtMonthOption[] {
  const monthKeys = new Set<string>([fallbackMonth]);

  matchSplits.forEach((split) => {
    const matchDate = matchById.get(split.matchId)?.date;
    if (matchDate) {
      monthKeys.add(matchDate.slice(0, 7));
    }
  });

  return Array.from(monthKeys)
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ value, label: formatMonthLabel(value) }));
}

function buildMonthlyDebtReport(
  monthKey: string,
  matchSplits: MatchSplit[],
  matchById: Map<string, Match>,
  members: TeamMember[],
) {
  const rowsByMember = new Map<string, MemberDebtRow>();

  members.forEach((member) => {
    rowsByMember.set(member.id, {
      memberId: member.id,
      name: displayMemberName(member),
      matchCount: 0,
      dueAmount: 0,
      paidAmount: 0,
      missingAmount: 0,
      matches: [],
    });
  });

  matchSplits.forEach((split) => {
    const match = matchById.get(split.matchId);
    if (!match || !match.date.startsWith(monthKey)) {
      return;
    }

    split.items.forEach((item) => {
      if (!item.chargeable || !item.membershipId) {
        return;
      }

      const row = rowsByMember.get(item.membershipId) ?? {
        memberId: item.membershipId,
        name: item.participantName,
        matchCount: 0,
        dueAmount: 0,
        paidAmount: 0,
        missingAmount: 0,
        matches: [],
      };
      const amountDue = Math.max(0, item.amountDue);
      const amountPaid = Math.max(0, item.amountPaid);
      const missingAmount = Math.max(0, amountDue - amountPaid);

      row.matchCount += 1;
      row.dueAmount += amountDue;
      row.paidAmount += amountPaid;
      row.missingAmount += missingAmount;
      row.matches.push({
        matchId: split.matchId,
        opponentName: match.opponentName,
        date: match.date,
        amountDue,
        amountPaid,
        missingAmount,
      });
      rowsByMember.set(row.memberId, row);
    });
  });

  const rows = Array.from(rowsByMember.values())
    .filter((row) => row.matchCount > 0)
    .sort(
      (a, b) =>
        b.missingAmount - a.missingAmount ||
        b.dueAmount - a.dueAmount ||
        a.name.localeCompare(b.name),
    );

  return {
    rows,
    totalDue: rows.reduce((sum, row) => sum + row.dueAmount, 0),
    totalPaid: rows.reduce((sum, row) => sum + row.paidAmount, 0),
    totalMissing: rows.reduce((sum, row) => sum + row.missingAmount, 0),
  };
}

function displayMemberName(member: TeamMember) {
  return member.nickname?.trim() || member.fullName;
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "PS"
  );
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return "Tháng " + Number(month) + " / " + year;
}

function getSplitPerHead(split: MatchSplit, totalCount: number) {
  const firstDueItem = split.items.find((item) => item.chargeable && item.amountDue > 0);
  return (
    firstDueItem?.amountDue ??
    (totalCount ? Math.round(split.totalAmount / totalCount / 1000) * 1000 : 0)
  );
}

function getSplitSummary(
  split: MatchSplit,
  memberById: Map<string, TeamMember>,
): MatchSplitSummary {
  const perHead = getSplitPerHead(split, split.includedMemberIds.length);
  const paidMembers = split.paidMemberIds
    .map((id) => memberById.get(id))
    .filter((member): member is TeamMember => Boolean(member));
  const unpaidMembers = split.includedMemberIds
    .filter((id) => !split.paidMemberIds.includes(id))
    .map((id) => memberById.get(id))
    .filter((member): member is TeamMember => Boolean(member));
  const paidAmount = split.items.reduce((sum, item) => sum + item.amountPaid, 0);
  const dueAmount = split.items
    .filter((item) => item.chargeable)
    .reduce((sum, item) => sum + item.amountDue, 0);

  return {
    ...split,
    perHead,
    total: split.includedMemberIds.length,
    paid: split.paidMemberIds.length,
    paidAmount,
    unpaidAmount: Math.max(0, dueAmount - paidAmount),
    totalCount: split.includedMemberIds.length,
    paidCount: split.paidMemberIds.length,
    unpaidCount: unpaidMembers.length,
    paidMembers,
    unpaidMembers,
    unpaidMemberIds: split.includedMemberIds.filter((id) => !split.paidMemberIds.includes(id)),
    isComplete: unpaidMembers.length === 0,
  };
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
