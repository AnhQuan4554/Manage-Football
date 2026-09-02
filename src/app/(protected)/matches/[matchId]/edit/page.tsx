import { PageHeader } from "@/components/common/PageHeader";
import { MatchForm } from "@/features/matches/components/MatchForm";
import { getActiveMembers } from "@/features/members/services/memberService";
import { getMatchById, getMatchDetail } from "@/features/matches/services/matchService";
import { getCurrentTeam } from "@/features/team-profile/services/teamService";

export default async function EditMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const [matchResponse, detailResponse, teamResponse, membersResponse] = await Promise.all([
    getMatchById(matchId),
    getMatchDetail(matchId),
    getCurrentTeam(),
    getActiveMembers(),
  ]);
  const match = matchResponse.data;
  const detail = detailResponse.data;
  const team = teamResponse.data;
  const activeMembers = membersResponse.data ?? [];

  if (!match || !team) {
    return <PageHeader title="Không tìm thấy trận" />;
  }

  const participantMemberIds =
    detail?.participants
      .filter(
        (participant) => participant.response === "going" && Boolean(participant.membershipId),
      )
      .map((participant) => participant.membershipId as string) ?? [];

  return (
    <div className="page-stack">
      <PageHeader
        title={match.status === "completed" ? "Cập nhật chi phí trận đã qua" : "Chỉnh sửa trận"}
        subtitle={"vs " + match.opponentName}
      />
      <MatchForm
        teamId={team.id}
        mode="edit"
        matchId={match.id}
        showCostFields={match.status === "completed"}
        recalculateSplitOnSuccess={match.status === "completed"}
        submitLabel={match.status === "completed" ? "Lưu chi phí & chia tiền" : "Lưu thay đổi"}
        memberOptions={activeMembers}
        initialParticipantMemberIds={participantMemberIds}
        initialValues={{
          opponentName: match.opponentName,
          opponentPhone: match.opponentPhone,
          homeScore: String(match.homeScore ?? 0),
          awayScore: String(match.awayScore ?? 0),
          date: match.date,
          time: match.time,
          venueName: match.pitch,
          address: match.address,
          note: match.note,
          ...(match.status === "completed" ? { pitchCost: String(match.pitchCost) } : {}),
        }}
      />
    </div>
  );
}
