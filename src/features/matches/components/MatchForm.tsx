"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Space } from "antd";

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
};

function toDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

export function MatchForm({
  teamId,
  mode,
  matchId,
  initialValues,
  submitLabel,
  showCostFields = false,
  recalculateSplitOnSuccess = false,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<MatchFormValues>({
    opponentName: initialValues?.opponentName ?? "",
    date: initialValues?.date ?? "",
    time: initialValues?.time ?? "",
    venueName: initialValues?.venueName ?? "",
    address: initialValues?.address ?? "",
    pitchCost: initialValues?.pitchCost ?? "",
    note: initialValues?.note ?? "",
  });

  const isEdit = mode === "edit" && Boolean(matchId);

  const canSubmit = useMemo(
    () =>
      Boolean(
        values.opponentName.trim() &&
          values.date &&
          values.time &&
          values.venueName.trim() &&
          (!showCostFields || values.pitchCost !== "") &&
          !pending,
      ),
    [pending, showCostFields, values.date, values.opponentName, values.pitchCost, values.time, values.venueName],
  );

  async function submitMatch(method: "POST" | "PATCH") {
    setError(null);
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
        requestBody.pitchCost = Number(values.pitchCost || 0);
        if (method === "PATCH" && recalculateSplitOnSuccess) {
          requestBody.recalculateSplit = true;
        }
      }

      const response = await fetch(
        method === "POST" ? `/api/teams/${teamId}/matches` : `/api/teams/${teamId}/matches/${matchId}`,
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

      router.push(`/matches/${match.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu trận");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!matchId) return;
    const confirmed = window.confirm("Xóa trận này? Hệ thống sẽ chuyển trạng thái sang đã hủy để giữ lịch sử.");
    if (!confirmed) return;

    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/matches/${matchId}`, { method: "DELETE" });
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
    <section className="match-form-shell">
      <section className="surface-card match-form-section">
        <p className="text-kicker">Đối thủ & thời gian</p>
        <label>Đội đối thủ</label>
        <input className="field" value={values.opponentName} onChange={(e) => setValues((current) => ({ ...current, opponentName: e.target.value }))} placeholder="Hà Đông Legends" />
        <div className="match-form-grid">
          <div>
            <label>Ngày</label>
            <input className="field" type="date" value={values.date} onChange={(e) => setValues((current) => ({ ...current, date: e.target.value }))} />
          </div>
          <div>
            <label>Giờ</label>
            <input className="field" type="time" value={values.time} onChange={(e) => setValues((current) => ({ ...current, time: e.target.value }))} />
          </div>
        </div>
      </section>

      <section className="surface-card match-form-section">
        <p className="text-kicker">Sân bóng</p>
        <label>Tên sân</label>
        <input className="field" value={values.venueName} onChange={(e) => setValues((current) => ({ ...current, venueName: e.target.value }))} placeholder="Sân Phạm Tu - sân số 2" />

        <label>Địa chỉ</label>
        <input className="field" value={values.address} onChange={(e) => setValues((current) => ({ ...current, address: e.target.value }))} placeholder="Ngõ 12 Phạm Tu, Hà Đông, Hà Nội" />
      </section>

      {showCostFields ? (
        <section className="surface-card match-form-section">
          <p className="text-kicker">Chi phí trận đã qua</p>
          <div>
            <label>Tổng tiền đội phải trả (đ)</label>
            <input className="field" type="number" value={values.pitchCost} onChange={(e) => setValues((current) => ({ ...current, pitchCost: e.target.value }))} placeholder="700000" />
          </div>
        </section>
      ) : null}

      <section className="surface-card match-form-section">
        <p className="text-kicker">Ghi chú</p>
        <label>Ghi chú</label>
        <textarea className="field" rows={4} value={values.note} onChange={(e) => setValues((current) => ({ ...current, note: e.target.value }))} placeholder="VD: Mang áo sáng, khởi động 19:10..." />
      </section>

      {error ? <p className="muted" style={{ color: "#b42318" }}>{error}</p> : null}

      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        <Button type="primary" block onClick={() => submitMatch(isEdit ? "PATCH" : "POST")} disabled={!canSubmit}>
          {pending ? "Đang lưu..." : submitLabel ?? (isEdit ? "Lưu thay đổi" : "Tạo trận & thông báo")}
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
