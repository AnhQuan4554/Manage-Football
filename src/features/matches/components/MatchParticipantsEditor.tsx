"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "antd";
import { CloseOutlined, EditOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { LogoLoading } from "@/components/common/LogoLoading";
import type { TeamMember } from "@/features/members/types";
import type { MatchDetailResponse } from "@/features/matches/services/matchApiService";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

type Props = {
  teamId: string;
  matchId: string;
  isCompleted: boolean;
  members: TeamMember[];
  participants: MatchDetailResponse["participants"];
};

function displayMemberName(member: TeamMember) {
  return member.nickname?.trim() || member.fullName;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getInitialSelectedIds(members: TeamMember[], participants: Props["participants"]) {
  const selectedIds = participants
    .filter((participant) => participant.response === "going" && Boolean(participant.membershipId))
    .map((participant) => participant.membershipId as string);

  return selectedIds.length ? selectedIds : members.map((member) => member.id);
}

export function MatchParticipantsEditor({
  teamId,
  matchId,
  isCompleted,
  members,
  participants,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    getInitialSelectedIds(members, participants),
  );

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedMembers = members.filter((member) => selectedIdSet.has(member.id));
  const availableMembers = members.filter((member) => !selectedIdSet.has(member.id));

  function openEditor() {
    setError(null);
    setSelectedIds(getInitialSelectedIds(members, participants));
    setOpen(true);
  }

  function removeMember(memberId: string) {
    setSelectedIds((current) => current.filter((id) => id !== memberId));
  }

  function addMember(memberId: string) {
    setSelectedIds((current) => Array.from(new Set([...current, memberId])));
  }

  async function saveParticipants() {
    if (!selectedIds.length) {
      setError("Cần chọn ít nhất một người tham gia trận này");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/teams/" + teamId + "/matches/" + matchId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantMemberIds: selectedIds,
          recalculateSplit: isCompleted,
        }),
      });
      const payload = (await response.json()) as ApiResponse<{ id: string }>;

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || payload.error || "Không thể cập nhật người tham gia");
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật người tham gia");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        icon={<EditOutlined />}
        onClick={openEditor}
        className="match-participant-editor-trigger"
      >
        Sửa người tham gia
      </Button>
      <Modal
        centered
        open={open}
        title={null}
        footer={null}
        onCancel={() => (pending ? undefined : setOpen(false))}
        className="match-participant-modal"
        destroyOnHidden
      >
        <div className="match-participant-modal-shell" aria-busy={pending}>
          <div className="match-participant-modal-head">
            <span className="match-detail-icon">
              <TeamOutlined />
            </span>
            <div>
              <span className="text-kicker">Người tham gia</span>
              <h3>{selectedMembers.length} người đi đá</h3>
              <p className="muted">
                Bấm X để bỏ người không tham gia, hoặc thêm lại ở danh sách bên dưới.
              </p>
            </div>
          </div>

          <div className="match-participant-selected-list">
            {selectedMembers.length ? (
              selectedMembers.map((member) => {
                const name = displayMemberName(member);

                return (
                  <span key={member.id} className="match-participant-chip">
                    <span className="match-detail-avatar">{getInitials(name)}</span>
                    <span>
                      <strong>{name}</strong>
                      <small>
                        #{member.shirtNumber || "--"} · {member.fullName}
                      </small>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      aria-label={"Bỏ " + name}
                    >
                      <CloseOutlined />
                    </button>
                  </span>
                );
              })
            ) : (
              <p className="muted match-detail-empty-note">Chưa chọn ai tham gia trận này.</p>
            )}
          </div>

          {availableMembers.length ? (
            <div className="match-participant-add-panel">
              <span className="text-kicker">Thêm lại</span>
              <div className="match-participant-add-list">
                {availableMembers.map((member) => (
                  <button key={member.id} type="button" onClick={() => addMember(member.id)}>
                    <PlusOutlined /> {displayMemberName(member)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="match-participant-error">{error}</p> : null}
          {pending ? <LogoLoading label="Đang lưu người tham gia..." size="sm" /> : null}

          <div className="match-participant-modal-actions">
            <Button onClick={() => setOpen(false)} disabled={pending}>
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={saveParticipants}
              disabled={pending || !selectedIds.length}
            >
              Lưu người tham gia
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
