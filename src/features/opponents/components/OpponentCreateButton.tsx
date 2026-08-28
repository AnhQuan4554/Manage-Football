"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { useState } from "react";
import { NewOpponentForm } from "@/features/opponents/components/NewOpponentForm";

export function OpponentCreateButton({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
        Tạo mới
      </Button>
      <Modal
        title="Thêm đối thủ"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnHidden
        width={680}
      >
        <p className="muted" style={{ margin: "0 0 18px" }}>
          Lưu đội bạn để lần sau tạo trận nhanh hơn.
        </p>
        <NewOpponentForm teamId={teamId} onCreated={() => setOpen(false)} />
      </Modal>
    </>
  );
}
