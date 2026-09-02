"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Dropdown, type MenuProps } from "antd";
import { MessageOutlined, PhoneOutlined } from "@ant-design/icons";

type OpponentContactMenuProps = {
  phone: string;
};

function normalizePhoneForUrl(phone: string) {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  return hasPlus ? "+" + digits : digits;
}

function getZaloUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? "https://zalo.me/" + digits : "https://zalo.me";
}

function isInstalledAppShell() {
  if (typeof window === "undefined") return false;

  const standaloneNavigator = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    standaloneNavigator.standalone === true
  );
}

export function OpponentContactMenu({ phone }: OpponentContactMenuProps) {
  const [showAppActions, setShowAppActions] = useState(false);
  const normalizedPhone = normalizePhoneForUrl(phone);

  useEffect(() => {
    setShowAppActions(isInstalledAppShell());
  }, []);

  const items = useMemo<MenuProps["items"]>(() => {
    const contactItems: MenuProps["items"] = [
      {
        key: "zalo",
        icon: <MessageOutlined />,
        label: (
          <a href={getZaloUrl(phone)} target="_blank" rel="noreferrer">
            Liên hệ Zalo
          </a>
        ),
      },
    ];

    if (showAppActions && normalizedPhone) {
      contactItems.push(
        {
          key: "call",
          icon: <PhoneOutlined />,
          label: <a href={"tel:" + normalizedPhone}>Gọi điện</a>,
        },
        {
          key: "sms",
          icon: <MessageOutlined />,
          label: <a href={"sms:" + normalizedPhone}>Nhắn SMS</a>,
        },
      );
    }

    return contactItems;
  }, [normalizedPhone, phone, showAppActions]);

  return (
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
      <Button type="link" className="match-detail-phone-button">
        {phone}
      </Button>
    </Dropdown>
  );
}
