"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, message } from "antd";
import { LogoLoading } from "@/components/common/LogoLoading";
import type { AppResponse } from "@/lib/response";
import type { Team } from "@/features/team-profile/types";
import type { TeamMember, TeamRole } from "@/features/members/types";

const currentTeamStorageKey = "currentTeamId";

type TeamsPayload = AppResponse<Team[]>;
type CreateMemberPayload = AppResponse<TeamMember>;

export function NewMemberForm() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState("");
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeams() {
      const response = await fetch("/api/teams", { cache: "no-store" });
      const payload = (await response.json()) as TeamsPayload;
      const items = payload.data ?? [];
      const savedTeamId = window.localStorage.getItem(currentTeamStorageKey);
      const selectedTeam = items.find((team) => team.id === savedTeamId) ?? items[0];

      setTeams(items);
      setTeamId(selectedTeam?.id ?? "");
    }

    loadTeams().catch(() => {
      setError("Không thể tải danh sách đội. Vui lòng thử lại.");
    }).finally(() => setLoadingTeams(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const selectedTeamId = String(formData.get("teamId") ?? teamId);

    if (!selectedTeamId) {
      setError("Chưa chọn đội để thêm thành viên.");
      return;
    }

    const shirtNumber = Number(formData.get("shirtNumber"));
    const body = {
      fullName: String(formData.get("fullName") ?? ""),
      nickname: String(formData.get("nickname") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      shirtNumber,
      role: String(formData.get("role") ?? "member") as TeamRole,
      status: "active",
    };

    setSubmitting(true);
    let response: Response;
    let payload: CreateMemberPayload;

    try {
      response = await fetch(`/api/teams/${selectedTeamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      payload = (await response.json()) as CreateMemberPayload;
    } catch {
      setSubmitting(false);
      setError("Không thể kết nối API tạo thành viên. Vui lòng thử lại.");
      return;
    }

    setSubmitting(false);

    if (!response.ok || !payload.success) {
      setError(payload.message ?? payload.error ?? "Không thể lưu thành viên.");
      return;
    }

    window.localStorage.setItem(currentTeamStorageKey, selectedTeamId);
    document.cookie = `currentTeamId=${encodeURIComponent(selectedTeamId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    message.success(payload.message ?? "Đã lưu thành viên");
    router.push("/members");
    router.refresh();
  }

  return (
    <form className="surface form-surface" onSubmit={handleSubmit}>
      {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 14 }} /> : null}

      {loadingTeams ? <LogoLoading label="Đang tải danh sách đội..." size="sm" /> : null}
      {submitting ? <LogoLoading label="Đang lưu thành viên..." size="sm" /> : null}

      <label htmlFor="teamId">Đội</label>
      <select
        id="teamId"
        name="teamId"
        className="field"
        value={teamId}
        onChange={(event) => setTeamId(event.target.value)}
        disabled={loadingTeams || submitting}
        required
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>

      <label htmlFor="fullName">Họ tên</label>
      <input id="fullName" name="fullName" className="field" required />

      <label htmlFor="nickname">Biệt danh</label>
      <input id="nickname" name="nickname" className="field" />

      <label htmlFor="phone">Số điện thoại</label>
      <input id="phone" name="phone" className="field" inputMode="tel" />

      <label htmlFor="shirtNumber">Số áo</label>
      <input id="shirtNumber" name="shirtNumber" className="field" type="number" min={0} max={99} required />

      <label htmlFor="role">Vai trò</label>
      <select id="role" name="role" className="field" defaultValue="member">
        <option value="member">Thành viên</option>
        <option value="treasurer">Thủ quỹ</option>
        <option value="captain">Đội trưởng</option>
      </select>

      <Button type="primary" htmlType="submit" loading={submitting} disabled={loadingTeams} block>
        Lưu thành viên
      </Button>
    </form>
  );
}
