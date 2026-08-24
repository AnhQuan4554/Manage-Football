"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { App, Button } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppResponse } from "@/lib/response";

type DeletePayload = AppResponse<{ id: string }>;

export function DeleteMemberButton({ teamId, memberId, memberName }: { teamId: string; memberId: string; memberName: string }) {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    modal.confirm({
      title: "Xóa thành viên?",
      content: "Bạn có chắc chắn muốn xóa " + memberName + " khỏi hệ thống không?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      centered: true,
      async onOk() {
        setDeleting(true);

        try {
          const response = await fetch("/api/teams/" + teamId + "/members/" + memberId, { method: "DELETE" });
          const payload = (await response.json()) as DeletePayload;

          if (!response.ok || !payload.success) {
            message.error(payload.message ?? payload.error ?? "Không thể xóa thành viên.");
            return;
          }

          message.success(payload.message ?? "Đã xóa thành viên");
          router.push("/members");
          router.refresh();
        } catch {
          message.error("Không thể kết nối API xóa thành viên.");
        } finally {
          setDeleting(false);
        }
      },
    });
  }

  return (
    <Button className="member-danger-button" icon={<DeleteOutlined />} loading={deleting} onClick={confirmDelete}>
      Xóa
    </Button>
  );
}
