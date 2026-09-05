"use client";

import { useEffect, useState } from "react";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { App, Button, Modal } from "antd";

const pinkstormZaloGroupUrl = "https://zalo.me/g/oirkgi333";

export type ZaloVoteMatchInfo = {
  opponentName: string;
  date: string;
  time: string;
  venueName: string;
};

type ZaloVoteDialogProps = {
  info: ZaloVoteMatchInfo;
  open: boolean;
  onClose: () => void;
  continueLabel?: string;
  onContinue?: () => void;
};

function formatVoteDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (!year || !month || !day || Number.isNaN(date.getTime())) {
    return dateValue;
  }

  const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(date);
  const displayDay = String(day).padStart(2, "0");
  const displayMonth = String(month).padStart(2, "0");

  return `${weekday} ${displayDay}/${displayMonth}/${year}`;
}

export function buildZaloVoteMessage(info: ZaloVoteMatchInfo) {
  const opponentName = info.opponentName.trim();
  const venueName = info.venueName.trim();
  const matchDate = formatVoteDate(info.date);

  return `Tạo vote · ${info.time} ${matchDate} · Sân ${venueName} · với ${opponentName}`;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall back for browsers that expose Clipboard API but deny access.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Trình duyệt không hỗ trợ sao chép tự động");
  }
}

export function ZaloVoteDialog({
  info,
  open,
  onClose,
  continueLabel = "Đóng",
  onContinue,
}: ZaloVoteDialogProps) {
  const { message } = App.useApp();
  const [copied, setCopied] = useState(false);
  const voteMessage = buildZaloVoteMessage(info);

  useEffect(() => {
    if (open) {
      setCopied(false);
    }
  }, [open]);

  async function handleCopyAndOpenGroup() {
    try {
      await copyText(voteMessage);
      setCopied(true);
      message.success("Đã sao chép thông tin trận, đang mở nhóm Zalo");
      window.location.assign(pinkstormZaloGroupUrl);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể sao chép nội dung");
    }
  }

  return (
    <Modal
      centered
      title="Thông tin gửi nhóm Zalo"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <div className="zalo-vote-dialog">
        <pre className="zalo-vote-message">{voteMessage}</pre>
        <div className="zalo-vote-dialog-actions">
          <Button onClick={onContinue ?? onClose}>{continueLabel}</Button>
          <Button
            type="primary"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={() => void handleCopyAndOpenGroup()}
          >
            {copied ? "Đang mở nhóm Zalo" : "Sao chép & mở nhóm Zalo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ZaloVoteCopyButton({ info }: { info: ZaloVoteMatchInfo }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="match-detail-zalo-trigger"
        icon={<CopyOutlined />}
        onClick={() => setOpen(true)}
        aria-label="Sao chép thông tin trận để gửi Zalo"
      >
        <span className="match-detail-zalo-trigger-label">Mẫu Zalo</span>
      </Button>
      <ZaloVoteDialog info={info} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
