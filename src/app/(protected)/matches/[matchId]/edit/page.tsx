import { PageHeader } from "@/components/common/PageHeader";
import { getMatchById } from "@/features/matches/services/matchService";

export default async function EditMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = (await getMatchById(matchId)).data;

  return (
    <div className="page-stack">
      <PageHeader title="Chỉnh sửa trận" subtitle={match ? `vs ${match.opponentName}` : "Không tìm thấy trận"} />
      <section className="surface form-surface">
        <label>Đối thủ</label><input className="field" defaultValue={match?.opponentName} />
        <label>Sân</label><input className="field" defaultValue={match?.pitch} />
        <label>Địa chỉ</label><input className="field" defaultValue={match?.address} />
        <label>Chi phí sân</label><input className="field" type="number" defaultValue={match?.pitchCost} />
        <label>Ghi chú</label><textarea className="field" rows={3} defaultValue={match?.note} />
        <button className="button-reset primary-action">Lưu thay đổi</button>
      </section>
    </div>
  );
}
