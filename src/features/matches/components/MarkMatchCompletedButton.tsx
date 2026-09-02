"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, message } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { LogoLoading } from "@/components/common/LogoLoading";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

type Props = {
  teamId: string;
  matchId: string;
};

export function MarkMatchCompletedButton({ teamId, matchId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function markCompleted() {
    setPending(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const payload = (await response.json()) as ApiResponse<{ id: string }>;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || payload.error || "Không thể cập nhật trạng thái trận");
      }

      message.success("Đã chuyển trận sang đã đá");
      router.push(`/matches/${matchId}/edit`);
      router.refresh();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái trận");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="action-loading-stack" aria-busy={pending}>
      {pending ? <LogoLoading label="Đang cập nhật trận..." size="sm" /> : null}
      <Button
        type="primary"
        icon={<CheckCircleOutlined />}
        disabled={pending}
        onClick={markCompleted}
      >
        Đã đá
      </Button>
    </span>
  );
}
