"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, message } from "antd";
import { LogoLoading } from "@/components/common/LogoLoading";
import type { AppResponse } from "@/lib/response";
import type { Team } from "@/features/team-profile/types";

type CreateTeamPayload = AppResponse<Team>;

export function NewTeamForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const body = {
      name: String(formData.get("name") ?? ""),
      area: String(formData.get("area") ?? ""),
      homePitch: String(formData.get("homePitch") ?? ""),
      intro: String(formData.get("intro") ?? ""),
    };

    let response: Response;
    let payload: CreateTeamPayload;

    try {
      response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      payload = (await response.json()) as CreateTeamPayload;
    } catch {
      setSubmitting(false);
      setError("Không thể kết nối API tạo đội. Vui lòng thử lại.");
      return;
    }

    setSubmitting(false);

    if (!response.ok || !payload.success || !payload.data) {
      setError(payload.message ?? payload.error ?? "Không thể lưu đội.");
      return;
    }

    window.localStorage.setItem("currentTeamId", payload.data.id);
    document.cookie = `currentTeamId=${encodeURIComponent(payload.data.id)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    message.success(payload.message ?? "Đã lưu đội");
    router.push("/team");
    router.refresh();
  }

  return (
    <form className="surface form-surface" onSubmit={handleSubmit} aria-busy={submitting}>
      {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 14 }} /> : null}
      {submitting ? <LogoLoading label="Đang lưu đội..." size="sm" /> : null}

      <label htmlFor="name">Tên đội</label>
      <input id="name" name="name" className="field" placeholder="Ví dụ: Pinkstorm FC" required />

      <label htmlFor="area">Khu vực</label>
      <input id="area" name="area" className="field" placeholder="Ví dụ: Hà Đông, Hà Nội" />

      <label htmlFor="homePitch">Sân nhà</label>
      <input id="homePitch" name="homePitch" className="field" placeholder="Ví dụ: Sân Phạm Tu" />

      <label htmlFor="intro">Giới thiệu</label>
      <textarea
        id="intro"
        name="intro"
        className="field"
        rows={4}
        placeholder="Mô tả ngắn về đội."
      />

      <Button type="primary" htmlType="submit" disabled={submitting} block>
        Lưu đội
      </Button>
    </form>
  );
}
