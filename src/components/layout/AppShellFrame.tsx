"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Drawer, Space } from "antd";
import { MenuOutlined, RightOutlined } from "@ant-design/icons";
import { useState, type ReactNode } from "react";
import { bottomTabs, moreLinks } from "@/lib/constants/navigation";
import type { Team } from "@/features/team-profile/types";
import { TeamSwitcher } from "@/components/layout/TeamSwitcher";

type NavItem = (typeof bottomTabs)[number] | (typeof moreLinks)[number];

export function AppShellFrame({ team, teams, children }: { team: Team; teams: Team[]; children: ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryTabs = bottomTabs.slice(0, 4);
  const extraLinks = [bottomTabs[4], ...moreLinks].filter(Boolean);
  const desktopLinks: NavItem[] = [...primaryTabs, ...extraLinks];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <Image src={team.logoUrl || "/logo-transparent.png"} alt="Pinkstorm FC" width={56} height={56} className="brand-logo" />
          <div>
            <strong>{team.name}</strong>
            <div className="muted" style={{ fontSize: 12 }}>{team.area}</div>
          </div>
        </div>
        <nav>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {desktopLinks.map((item) => (
              <ShellLink key={item.href} item={item} pathname={pathname} />
            ))}
          </Space>
        </nav>
        <div className="sidebar-footer">
          <TeamSwitcher team={team} teams={teams} />
        </div>
      </aside>

      <div className="shell-content">
        <header className="mobile-topbar">
          <Image src={team.logoUrl || "/logo-transparent.png"} alt="Pinkstorm FC" width={36} height={36} className="brand-logo" />
          <TeamSwitcher team={team} teams={teams} compact />
        </header>
        <main className="main">{children}</main>
        <nav className="bottom-nav">
          {primaryTabs.map((item) => (
            <ShellLink key={item.href} item={item} pathname={pathname} compact />
          ))}
          <button className="button-reset" type="button" onClick={() => setMoreOpen(true)}>
            <MenuOutlined />
            <span>Thêm</span>
          </button>
        </nav>
      </div>

      <Drawer
        title="Thêm"
        placement="bottom"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        height="auto"
      >
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          {extraLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="drawer-link"
              onClick={() => setMoreOpen(false)}
            >
              <span className="icon-chip"><item.icon /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <strong>{item.label}</strong>
              </span>
              <RightOutlined className="muted" />
            </Link>
          ))}
          <Link href="/login" onClick={() => setMoreOpen(false)}>
            <Button block>Đăng xuất</Button>
          </Link>
        </Space>
      </Drawer>
    </div>
  );
}

function ShellLink({
  item,
  pathname,
  compact = false,
}: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
}) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link className={active ? "nav-link active" : "nav-link"} href={item.href}>
      <item.icon />
      <span>{compact ? item.label.replace("Lịch đá", "Trận") : item.label}</span>
    </Link>
  );
}
