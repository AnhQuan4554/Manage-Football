"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Checkbox, Space, Tag } from "antd";
import { LogoLoading } from "@/components/common/LogoLoading";
import { MoneyInput } from "@/components/common/MoneyInput";
import { normalizeMoneyInput, parseMoneyInput } from "@/lib/utils/format";
import type { TeamMember } from "@/features/members/types";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

type MatchFormValues = {
  opponentName: string;
  date: string;
  time: string;
  venueName: string;
  address: string;
  pitchCost: string;
  note: string;
};

type Props = {
  teamId: string;
  mode: "create" | "edit";
  matchId?: string;
  initialValues?: Partial<MatchFormValues>;
  submitLabel?: string;
  showCostFields?: boolean;
  recalculateSplitOnSuccess?: boolean;
  memberOptions?: TeamMember[];
  initialParticipantMemberIds?: string[];
};

const defaultMatchTime = "19:15";

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function getNextWeekTuesday() {
  const today = new Date();
  const value = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntilNextWeekTuesday = ((2 - value.getDay() + 7) % 7) + 7;
  value.setDate(value.getDate() + daysUntilNextWeekTuesday);

  return formatDateInputValue(value);
}

function openNativePicker(input: HTMLInputElement & { showPicker?: () => void }) {
  try {
    input.showPicker?.();
  } catch {
    input.focus();
  }
}

function toDateTime(date: string, time: string) {
  return new Date(date + "T" + time + ":00+07:00").toISOString();
}

function displayMemberName(member: TeamMember) {
  return member.nickname?.trim() || member.fullName;
}

export function MatchForm({
  teamId,
  mode,
  matchId,
  initialValues,
  submitLabel,
  showCostFields = false,
  recalculateSplitOnSuccess = false,
  memberOptions = [],
  initialParticipantMemberIds = [],
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [participantMemberIds, setParticipantMemberIds] = useState<string[]>(
    initialParticipantMemberIds.filter(Boolean),
  );
  const [values, setValues] = useState<MatchFormValues>({
    opponentName: initialValues?.opponentName ?? "",
    date: initialValues?.date ?? (mode === "create" ? getNextWeekTuesday() : ""),
    time: initialValues?.time ?? (mode === "create" ? defaultMatchTime : ""),
    venueName: initialValues?.venueName ?? "",
    address: initialValues?.address ?? "",
    pitchCost: normalizeMoneyInput(initialValues?.pitchCost ?? ""),
    note: initialValues?.note ?? "",
  });

  const isEdit = mode === "edit" && Boolean(matchId);
  const requiresParticipants = showCostFields && recalculateSplitOnSuccess;

  const canSubmit = useMemo(
    () =>
      Boolean(
        values.opponentName.trim() &&
        values.date &&
        values.time &&
        values.venueName.trim() &&
        (!showCostFields || values.pitchCost !== "") &&
        (!requiresParticipants || participantMemberIds.length > 0) &&
        !pending,
      ),
    [
      participantMemberIds.length,
      pending,
      requiresParticipants,
      showCostFields,
      values.date,
      values.opponentName,
      values.pitchCost,
      values.time,
      values.venueName,
    ],
  );

  function toggleParticipant(memberId: string, checked: boolean) {
    setParticipantMemberIds((current) =>
      checked
        ? Array.from(new Set([...current, memberId]))
        : current.filter((id) => id !== memberId),
    );
  }

  async function submitMatch(method: "POST" | "PATCH") {
    setError(null);

    if (requiresParticipants && !participantMemberIds.length) {
      setError("Chọn ít nhất một thành viên tham gia để chia tiền");
      return;
    }

    setPending(true);

    try {
      const requestBody: Record<string, unknown> = {
        opponentName: values.opponentName,
        matchDateTime: toDateTime(values.date, values.time),
        venueName: values.venueName,
        address: values.address,
        note: values.note,
      };

      if (showCostFields) {
        requestBody.pitchCost = parseMoneyInput(values.pitchCost);
        if (method === "PATCH" && recalculateSplitOnSuccess) {
          requestBody.participantMemberIds = participantMemberIds;
          requestBody.recalculateSplit = true;
        }
      }

      const response = await fetch(
        method === "POST"
          ? "/api/teams/" + teamId + "/matches"
          : "/api/teams/" + teamId + "/matches/" + matchId,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
      );

      const responsePayload = (await response.json()) as ApiResponse<{ id: string }>;
      if (!response.ok || !responsePayload.success || !responsePayload.data) {
        throw new Error(responsePayload.message || responsePayload.error || "Không thể lưu trận");
      }

      const match = responsePayload.data;

      router.push("/matches/" + match.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu trận");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!matchId) return;
    const confirmed = window.confirm(
      "Xóa trận này? Hệ thống sẽ chuyển trạng thái sang đã hủy để giữ lịch sử.",
    );
    if (!confirmed) return;

    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/teams/" + teamId + "/matches/" + matchId, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || payload.error || "Không thể xóa trận");
      }

      router.push("/matches");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa trận");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="match-form-shell" aria-busy={pending}>
      <section className="surface-card match-form-section">
        <p className="text-kicker">Đối thủ & thời gian</p>
        <label>Đội đối thủ</label>
        <input
          className="field"
          value={values.opponentName}
          onChange={(e) => setValues((current) => ({ ...current, opponentName: e.target.value }))}
          placeholder="Hà Đông Legends"
        />
        <div className="match-form-grid">
          <div>
            <label>Ngày</label>
            <input
              className="field"
              type="date"
              value={values.date}
              onClick={(e) => openNativePicker(e.currentTarget)}
              onFocus={(e) => openNativePicker(e.currentTarget)}
              onChange={(e) => setValues((current) => ({ ...current, date: e.target.value }))}
            />
          </div>
          <div>
            <label>Giờ</label>
            <input
              className="field"
              type="time"
              value={values.time}
              onClick={(e) => openNativePicker(e.currentTarget)}
              onFocus={(e) => openNativePicker(e.currentTarget)}
              onChange={(e) => setValues((current) => ({ ...current, time: e.target.value }))}
            />
          </div>
        </div>
      </section>

      <section className="surface-card match-form-section">
        <p className="text-kicker">Sân bóng</p>
        <label>Tên sân</label>
        <input
          className="field"
          value={values.venueName}
          onChange={(e) => setValues((current) => ({ ...current, venueName: e.target.value }))}
          placeholder="Sân Phạm Tu - sân số 2"
        />

        <label>Địa chỉ</label>
        <input
          className="field"
          value={values.address}
          onChange={(e) => setValues((current) => ({ ...current, address: e.target.value }))}
          placeholder="Ngõ 12 Phạm Tu, Hà Đông, Hà Nội"
        />
      </section>

      {showCostFields ? (
        <section className="surface-card match-form-section">
          <p className="text-kicker">Chi phí trận đã qua</p>
          <div>
            <label>Tổng tiền đội phải trả (đ)</label>
            <MoneyInput
              className="field"
              value={values.pitchCost}
              onChange={(pitchCost) => setValues((current) => ({ ...current, pitchCost }))}
              placeholder="700.000"
            />
          </div>
        </section>
      ) : null}

      {requiresParticipants ? (
        <section className="surface-card match-form-section">
          <div className="match-form-section-head">
            <div>
              <p className="text-kicker">Thành viên tham gia</p>
              <label>Chọn người đã đá trận này</label>
            </div>
            <Tag className="match-form-count">{participantMemberIds.length} người</Tag>
          </div>
          <div className="match-participant-actions">
            <Button
              size="small"
              onClick={() => setParticipantMemberIds(memberOptions.map((member) => member.id))}
            >
              Chọn tất cả
            </Button>
            <Button size="small" onClick={() => setParticipantMemberIds([])}>
              Bỏ chọn
            </Button>
          </div>
          <div className="match-participant-grid">
            {memberOptions.map((member) => (
              <label key={member.id} className="match-participant-option">
                <Checkbox
                  checked={participantMemberIds.includes(member.id)}
                  onChange={(event) => toggleParticipant(member.id, event.target.checked)}
                />
                <span>
                  <strong>{displayMemberName(member)}</strong>
                  <small>
                    #{member.shirtNumber || "--"} · {member.fullName}
                  </small>
                </span>
              </label>
            ))}
          </div>
          {!memberOptions.length ? (
            <p className="muted" style={{ margin: 0 }}>
              Chưa có thành viên active để chọn chia tiền.
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="surface-card match-form-section">
        <p className="text-kicker">Ghi chú</p>
        <label>Ghi chú</label>
        <textarea
          className="field"
          rows={4}
          value={values.note}
          onChange={(e) => setValues((current) => ({ ...current, note: e.target.value }))}
          placeholder="VD: Mang áo sáng, khởi động 19:10..."
        />
      </section>

      {error ? (
        <p className="muted" style={{ color: "#b42318" }}>
          {error}
        </p>
      ) : null}

      {pending ? (
        <LogoLoading label={isEdit ? "Đang lưu trận..." : "Đang tạo trận..."} size="sm" />
      ) : null}

      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        <Button
          type="primary"
          block
          onClick={() => submitMatch(isEdit ? "PATCH" : "POST")}
          disabled={!canSubmit}
        >
          {submitLabel ?? (isEdit ? "Lưu thay đổi" : "Tạo trận & thông báo")}
        </Button>
        {isEdit ? (
          <Button danger block onClick={handleDelete} disabled={pending}>
            Xóa trận
          </Button>
        ) : null}
      </Space>
    </section>
  );
}
