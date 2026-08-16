import Image from "next/image";
import { Card, Col, Row, Statistic, Tag } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { getCurrentTeam } from "@/features/team-profile/services/teamService";
import { getActiveMembers } from "@/features/members/services/memberService";
import { getNextMatch } from "@/features/matches/services/matchService";

export default async function TeamPage() {
  const [teamResponse, membersResponse, matchResponse] = await Promise.all([getCurrentTeam(), getActiveMembers(), getNextMatch()]);
  const team = teamResponse.data!;
  const members = membersResponse.data ?? [];
  const next = matchResponse.data;

  return (
    <div className="page-stack">
      <section className="hero-card" style={{ display: "grid", justifyItems: "center", textAlign: "center" }}>
        <Image src="/logo.jpg" alt={team.name} width={144} height={144} className="brand-logo" style={{ width: 144, height: 144, borderRadius: 28 }} />
        <h1 style={{ color: "white", marginBottom: 4 }}>{team.name}</h1>
        <p style={{ color: "rgba(255,255,255,.78)" }}>{team.intro}</p>
      </section>
      <PageHeader title="Giới thiệu đội" subtitle={`${team.area} - sân nhà ${team.homePitch}`} />
      <Row gutter={[12, 12]}>
        <Col xs={12}><Card className="surface"><Statistic title="Thành viên" value={members.length} /></Card></Col>
        <Col xs={12}><Card className="surface"><Statistic title="Lịch đá" value="Thứ 3" /></Card></Col>
      </Row>
      <Card className="surface" title="Trận sắp tới">
        {next ? <span>Pinkstorm FC vs {next.opponentName} tại {next.pitch}</span> : "Chưa có lịch"}
      </Card>
      <Card className="surface" title="Thành viên nổi bật">
        {members.slice(0, 8).map((member) => <Tag color="magenta" key={member.id}>#{member.shirtNumber} {member.nickname}</Tag>)}
      </Card>
    </div>
  );
}
