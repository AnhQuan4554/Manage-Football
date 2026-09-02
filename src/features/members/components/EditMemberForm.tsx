"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, App, Button } from "antd";
import { LogoLoading } from "@/components/common/LogoLoading";
import type { AppResponse } from "@/lib/response";
import type { TeamMember } from "@/features/members/types";

type UpdateMemberPayload = AppResponse<TeamMember>;

type EditMemberFormProps = {
  member: TeamMember;
};

export function EditMemberForm({ member }: EditMemberFormProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const shirtNumber = Number(formData.get("shirtNumber"));
    const body = {
      fullName: String(formData.get("fullName") ?? ""),
      nickname: String(formData.get("nickname") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      shirtNumber,
    };

    setSubmitting(true);
    let response: Response;
    let payload: UpdateMemberPayload;

    try {
      response = await fetch(`/api/teams/${member.teamId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      payload = (await response.json()) as UpdateMemberPayload;
    } catch {
      setSubmitting(false);
      setError("Không thể kết nối API cập nhật thành viên. Vui lòng thử lại.");
      return;
    }

    setSubmitting(false);

    if (!response.ok || !payload.success) {
      setError(payload.message ?? payload.error ?? "Không thể cập nhật thành viên.");
      return;
    }

    message.success(payload.message ?? "Đã cập nhật thành viên");
    router.push(`/members/${member.id}`);
    router.refresh();
  }

  return (
    <form
      className="surface form-surface member-form-card"
      onSubmit={handleSubmit}
      aria-busy={submitting}
    >
      {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 14 }} /> : null}
      {submitting ? <LogoLoading label="Đang lưu thành viên..." size="sm" /> : null}

      <label htmlFor="fullName">Họ tên</label>
      <input
        id="fullName"
        name="fullName"
        className="field"
        defaultValue={member.fullName}
        required
      />

      <label htmlFor="nickname">Biệt danh</label>
      <input id="nickname" name="nickname" className="field" defaultValue={member.nickname} />

      <label htmlFor="shirtNumber">Số áo</label>
      <input
        id="shirtNumber"
        name="shirtNumber"
        className="field"
        type="number"
        min={0}
        max={99}
        defaultValue={member.shirtNumber}
        required
      />

      <label htmlFor="phone">Số điện thoại</label>
      <input
        id="phone"
        name="phone"
        className="field"
        inputMode="tel"
        defaultValue={member.phone}
        placeholder="09xx xxx xxx"
      />

      <Button type="primary" htmlType="submit" disabled={submitting} block>
        Lưu thay đổi
      </Button>
    </form>
  );
}
