"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

export function BackButton({ label, fallbackHref }: { label: string; fallbackHref: string }) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button type="button" className="button-reset match-detail-back" onClick={goBack}>
      <ArrowLeftOutlined /> {label}
    </button>
  );
}
