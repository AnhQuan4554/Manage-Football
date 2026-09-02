"use client";

import { useRouter } from "next/navigation";
import { Drawer } from "antd";
import { CheckOutlined, SwapOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import type { Team } from "@/features/team-profile/types";
const currentTeamStorageKey = "currentTeamId";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [availableTeams, setAvailableTeams] = useState(teams);
  const [selectedTeamId, setSelectedTeamId] = useState(team.id);
  const selectedTeam = availableTeams.find((item) => item.id === selectedTeamId) ?? team;

  useEffect(() => {
    const savedTeamId =
      window.localStorage.getItem(currentTeamStorageKey) ?? getCookie(currentTeamStorageKey);
    const nextTeamId =
      savedTeamId && teams.some((item) => item.id === savedTeamId) ? savedTeamId : team.id;

    setAvailableTeams(teams);
    setSelectedTeamId(nextTeamId);
    persistTeamId(nextTeamId);
  }, [team.id, teams]);

  function selectTeam(teamId: string) {
    setSelectedTeamId(teamId);
    persistTeamId(teamId);
    setOpen(false);
    router.refresh();
  }

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
        <p className="muted" style={{ margin: "0 0 16px" }}>
          Bạn đang tham gia {availableTeams.length} đội bóng.
        </p>
        <div className="page-stack" style={{ gap: 10 }}>
          {availableTeams.map((item) => {
            const active = item.id === selectedTeamId;

            return (
              <button
                key={item.id}
                type="button"
                className={active ? "team-option team-option-active" : "team-option"}
                onClick={() => selectTeam(item.id)}
              >
                <span className="team-avatar">{initials(item.name)}</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="team-option-name">{item.name}</span>
                  <span className="team-option-meta">
                    {roleLabel[item.myRole]} · {item.area}
                  </span>
                </span>
                {active ? <CheckOutlined style={{ color: "var(--pink)" }} /> : null}
              </button>
            );
          })}
        </div>
      </Drawer>
    </>
  );
}

function persistTeamId(teamId: string) {
  window.localStorage.setItem(currentTeamStorageKey, teamId);
  document.cookie =
    currentTeamStorageKey +
    "=" +
    encodeURIComponent(teamId) +
    "; Path=/; Max-Age=31536000; SameSite=Lax";
}

function getCookie(name: string) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
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
