import { PageHeader } from "@/components/common/PageHeader";
import { MatchForm } from "@/features/matches/components/MatchForm";
import { getMatchById } from "@/features/matches/services/matchService";
import { getCurrentTeam } from "@/features/team-profile/services/teamService";

export default async function EditMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const [matchResponse, teamResponse] = await Promise.all([getMatchById(matchId), getCurrentTeam()]);
  const match = matchResponse.data;
  const team = teamResponse.data;

  if (!match || !team) {
    return <PageHeader title="Không tìm thấy trận" />;
  }

  return (
    <div className="page-stack">
      <PageHeader title="Chỉnh sửa trận" subtitle={`vs ${match.opponentName}`} />
      <MatchForm
        teamId={team.id}
        mode="edit"
        matchId={match.id}
        initialValues={{
          opponentName: match.opponentName,
          date: match.date,
          time: match.time,
          venueName: match.pitch,
          address: match.address,
          pitchCost: String(match.pitchCost),
          opponentContribution: String(match.opponentFee),
          note: match.note,
        }}
      />
    </div>
  );
}
