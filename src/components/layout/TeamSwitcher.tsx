"use client";

import Link from "next/link";
import { Button, Drawer, Tag } from "antd";
import { CheckOutlined, ClockCircleOutlined, PlusOutlined, SwapOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { Team } from "@/features/team-profile/types";

const roleLabel: Record<Team["myRole"], string> = {
  owner: "Chủ đội",
  captain: "Đội trưởng",
  treasurer: "Thủ quỹ",
  member: "Thành viên",
};

export function TeamSwitcher({
  team,
  teams,
  compact = false,
}: {
  team: Team;
  teams: Team[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(team.id);
  const selectedTeam = teams.find((item) => item.id === selectedTeamId) ?? team;

  return (
    <>
      <button
        type="button"
        className={compact ? "team-switcher team-switcher-compact" : "team-switcher"}
        onClick={() => setOpen(true)}
      >
        <span style={{ minWidth: 0, flex: 1 }}>
          <span className="team-switcher-name">{selectedTeam.name}</span>
          {!compact ? (
            <span className="team-switcher-meta">
              {roleLabel[selectedTeam.myRole]} · {selectedTeam.memberCount} thành viên
            </span>
          ) : null}
        </span>
        <SwapOutlined className="muted" />
      </button>

      <Drawer
        className="team-switcher-drawer"
        title="Chuyển đội"
        placement="bottom"
        open={open}
        onClose={() => setOpen(false)}
        height="auto"
      >
        <p className="muted" style={{ margin: "0 0 16px" }}>Bạn đang tham gia {teams.length} đội bóng.</p>
        <div className="page-stack" style={{ gap: 10 }}>
          {teams.map((item) => {
            const active = item.id === selectedTeamId;
            const pending = item.intro.toLowerCase().includes("chờ duyệt");

            return (
              <button
                key={item.id}
                type="button"
                className={active ? "team-option team-option-active" : "team-option"}
                onClick={() => {
                  setSelectedTeamId(item.id);
                  setOpen(false);
                }}
              >
                <span className="team-avatar">{initials(item.name)}</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="team-option-name">
                    {item.name}
                    {pending ? (
                      <Tag color="gold" icon={<ClockCircleOutlined />} style={{ marginInlineStart: 6, marginInlineEnd: 0 }}>
                        Chờ duyệt
                      </Tag>
                    ) : null}
                  </span>
                  <span className="team-option-meta">{roleLabel[item.myRole]} · {item.area}</span>
                </span>
                {active ? <CheckOutlined style={{ color: "var(--pink)" }} /> : null}
              </button>
            );
          })}
          <Link href="/pending" onClick={() => setOpen(false)}>
            <Button block icon={<PlusOutlined />} className="join-team-button">
              Tham gia đội mới
            </Button>
          </Link>
        </div>
      </Drawer>
    </>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
