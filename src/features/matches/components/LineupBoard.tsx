import { Card, Col, Row, Segmented, Space, Tag } from "antd";
import { formations } from "@/features/matches/schemas/formations";
import type { Match } from "@/features/matches/types";
import type { TeamMember } from "@/features/members/types";

export function LineupBoard({ match, members, editable = true }: { match: Match; members: TeamMember[]; editable?: boolean }) {
  const formation = formations[match.formation];
  const memberById = new Map(members.map((member) => [member.id, member]));
  const onPitch = new Set(Object.values(match.lineup).filter(Boolean));
  const confirmed = members.filter((member) => match.attendance[member.id] === "going");

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <SpaceBlock>
          <Segmented
            block
            value={formation.label}
            options={Object.values(formations).map((item) => ({ label: item.label, value: item.label }))}
          />
          <div className="pitch">
            <div className="pitch-line-mid" />
            {formation.slots.map((slot) => {
              const member = match.lineup[slot.id] ? memberById.get(match.lineup[slot.id]!) : undefined;
              return (
                <div className="slot" key={slot.id} style={{ left: `${slot.x}%`, top: `${slot.y}%` }}>
                  <div className="slot-avatar">{member ? member.shirtNumber : slot.label}</div>
                  <div className="slot-name">{member ? member.nickname : "Trống"}</div>
                </div>
              );
            })}
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {editable ? "Base đã chuẩn bị UI chạm/kéo thả; nối state thật ở bước production." : "Chế độ chỉ xem đội hình."}
          </p>
        </SpaceBlock>
      </Col>
      <Col xs={24} lg={10}>
        <Card className="surface" title="Cầu thủ sẵn sàng">
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            {confirmed.map((member) => (
              <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="slot-avatar" style={{ width: 36, height: 36, borderWidth: 2 }}>{member.shirtNumber}</div>
                <div style={{ flex: 1 }}>
                  <strong>{member.nickname}</strong>
                  <div className="muted" style={{ fontSize: 12 }}>{member.fullName}</div>
                </div>
                <Tag color={onPitch.has(member.id) ? "success" : "default"}>{onPitch.has(member.id) ? "Trên sân" : "Dự bị"}</Tag>
              </div>
            ))}
          </Space>
        </Card>
      </Col>
    </Row>
  );
}

function SpaceBlock({ children }: { children: React.ReactNode }) {
  return <Card className="surface" styles={{ body: { display: "grid", gap: 12 } }}>{children}</Card>;
}
