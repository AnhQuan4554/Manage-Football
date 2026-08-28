"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, message } from "antd";
import { LogoLoading } from "@/components/common/LogoLoading";
import type { AppResponse } from "@/lib/response";
import type { CreateOpponentInput, Opponent } from "@/features/opponents/types";

type CreateOpponentPayload = AppResponse<Opponent>;

type NewOpponentFormProps = {
  teamId: string;
  onCreated?: () => void;
};

export function NewOpponentForm({ teamId, onCreated }: NewOpponentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const body: CreateOpponentInput = {
      name: String(formData.get("name") ?? ""),
      contactName: String(formData.get("contactName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      note: String(formData.get("note") ?? ""),
    };

    let response: Response;
    let payload: CreateOpponentPayload;

    try {
      response = await fetch(`/api/teams/${teamId}/opponents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      payload = (await response.json()) as CreateOpponentPayload;
    } catch {
      setSubmitting(false);
      setError("Không thể kết nối API tạo đối thủ. Vui lòng thử lại.");
      return;
    }

    setSubmitting(false);

    if (!response.ok || !payload.success) {
      setError(payload.message ?? payload.error ?? "Không thể lưu đối thủ.");
      return;
    }

    form.reset();
    message.success(payload.message ?? "Đã lưu đối thủ");
    onCreated?.();
    router.refresh();
  }

  return (
    <form className="form-surface" onSubmit={handleSubmit}>
      {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 14 }} /> : null}
      {submitting ? <LogoLoading label="Đang lưu đối thủ..." size="sm" /> : null}

      <label htmlFor="name">Tên đối thủ</label>
      <input id="name" name="name" className="field" placeholder="Ví dụ: Hà Đông Legends" required />

      <div className="member-form-grid">
        <span>
          <label htmlFor="contactName">Người liên hệ</label>
          <input id="contactName" name="contactName" className="field" placeholder="Anh Nam" />
        </span>
        <span>
          <label htmlFor="phone">Số điện thoại</label>
          <input id="phone" name="phone" className="field" inputMode="tel" placeholder="09xx xxx xxx" />
        </span>
      </div>

      <label htmlFor="note">Ghi chú</label>
      <textarea id="note" name="note" className="field" rows={3} placeholder="Sân hay đá, trình độ, màu áo..." />

      <Button type="primary" htmlType="submit" loading={submitting} block>
        Lưu đối thủ
      </Button>
    </form>
  );
}
