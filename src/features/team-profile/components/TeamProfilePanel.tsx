"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, Col, Row, Statistic, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { LogoLoading } from "@/components/common/LogoLoading";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState } from "@/components/common/StateBlocks";
import type { AppResponse } from "@/lib/response";
import type { Team } from "@/features/team-profile/types";
import type { TeamMember } from "@/features/members/types";
import type { Match } from "@/features/matches/types";
import { uiColors } from "@/lib/constants/colors";

type TeamsPayload = AppResponse<Team[]>;
type MembersPayload = AppResponse<TeamMember[]>;
type MatchesPayload = AppResponse<ReturnType<() => Match[]> | Match[]>;

const currentTeamStorageKey = "currentTeamId";

export function TeamProfilePanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    async function loadTeamProfile() {
      setLoading(true);
      setError(null);

      const teamsResponse = await fetch("/api/teams", { cache: "no-store" });
      const teamsPayload = (await teamsResponse.json()) as TeamsPayload;

      if (!teamsResponse.ok || !teamsPayload.success) {
        throw new Error(teamsPayload.message ?? teamsPayload.error ?? "Không thể tải danh sách đội");
      }

      const teams = teamsPayload.data ?? [];
      const selectedTeamId = getSelectedTeamId();
      const nextTeam = selectedTeamId
        ? teams.find((item) => item.id === selectedTeamId) ?? teams[0]
        : teams[0];

      if (!nextTeam) {
        setTeam(null);
        setMembers([]);
        setMatches([]);
        return;
      }

      persistSelectedTeamId(nextTeam.id);
      setTeam(nextTeam);

      const [membersResponse, matchesResponse] = await Promise.all([
        fetch(`/api/teams/${nextTeam.id}/members`, { cache: "no-store" }),
        fetch(`/api/teams/${nextTeam.id}/matches`, { cache: "no-store" }),
      ]);
      const membersPayload = (await membersResponse.json()) as MembersPayload;
      const matchesPayload = (await matchesResponse.json()) as MatchesPayload;

      setMembers(membersPayload.success ? membersPayload.data ?? [] : []);
      setMatches(matchesPayload.success ? matchesPayload.data ?? [] : []);
    }

    loadTeamProfile()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu đội");
        setTeam(null);
        setMembers([]);
        setMatches([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-stack">
        <TeamHeader />
        <section className="hero-card">
          <LogoLoading label="Đang tải dữ liệu đội..." size="lg" fullPage />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack">
        <TeamHeader />
        <section className="surface" style={{ overflow: "hidden" }}>
          <ErrorState title="Không thể tải được dữ liệu đội" description={error} />
        </section>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="page-stack">
        <TeamHeader />
        <EmptyState title="Chưa có đội" description="Bấm Thêm để tạo đội đầu tiên trong hệ thống." />
      </div>
    );
  }

  const activeMembers = members.filter((member) => member.status === "active");
  const nextMatch = matches
    .filter((match) => match.status === "scheduled")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0];

  return (
    <div className="page-stack">
      <TeamHeader subtitle={`${team.memberCount} thành viên trong đội.`} />
      <section className="hero-card" style={{ display: "grid", justifyItems: "center", textAlign: "center" }}>
        <Image
          src={team.logoUrl || "/logo-transparent.png"}
          alt={team.name}
          width={144}
          height={144}
          className="brand-logo"
          style={{ width: 144, height: 144, borderRadius: 28 }}
        />
        <h1 style={{ color: uiColors.neutral.white, marginBottom: 4 }}>{team.name}</h1>
        <p style={{ color: "rgba(255,255,255,.78)" }}>{team.intro || "Chưa có giới thiệu đội."}</p>
      </section>

      <section className="page-stack">
        <div className="section-header">
          <h2>Thông tin đội</h2>
        </div>
        <Card className="surface">
          <p className="muted" style={{ margin: 0 }}>
            {team.area} - sân nhà {team.homePitch}
          </p>
        </Card>
      </section>

      <Row gutter={[12, 12]}>
        <Col xs={12}><Card className="surface"><Statistic title="Thành viên" value={activeMembers.length} /></Card></Col>
        <Col xs={12}><Card className="surface"><Statistic title="Lịch đá" value={nextMatch ? "Sắp tới" : "Chưa có"} /></Card></Col>
      </Row>

      <Card className="surface" title="Trận sắp tới">
        {nextMatch ? <span>{team.name} vs {nextMatch.opponentName} tại {nextMatch.pitch}</span> : "Chưa có lịch"}
      </Card>

      <Card className="surface" title="Thành viên nổi bật">
        {activeMembers.length ? (
          activeMembers.slice(0, 8).map((member) => (
            <Tag color="magenta" key={member.id}>#{member.shirtNumber} {member.nickname}</Tag>
          ))
        ) : (
          <EmptyState title="Hiện chưa có thành viên" description="Khi thêm thành viên vào đội này, danh sách sẽ hiển thị tại đây." />
        )}
      </Card>
    </div>
  );
}

function TeamHeader({ subtitle = "Quản lý thông tin đội bóng." }: { subtitle?: string }) {
  return (
    <PageHeader
      title="Đội"
      subtitle={subtitle}
      action={<Link href="/team/new"><Button type="primary" icon={<PlusOutlined />}>Thêm</Button></Link>}
    />
  );
}

function getSelectedTeamId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(currentTeamStorageKey) ?? getCookie(currentTeamStorageKey);
}

function persistSelectedTeamId(teamId: string) {
  window.localStorage.setItem(currentTeamStorageKey, teamId);
  document.cookie = `${currentTeamStorageKey}=${encodeURIComponent(teamId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function getCookie(name: string) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}
