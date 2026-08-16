import Link from "next/link";
import { Button, Card, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { RoleBadge } from "@/components/common/RoleBadge";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { getMembers } from "@/features/members/services/memberService";

export default async function MembersPage() {
  const members = (await getMembers()).data ?? [];

  return (
    <div className="page-stack">
      <PageHeader title="Thành viên" subtitle="Danh sách gọn: avatar, nickname, số áo, vai trò và trạng thái duyệt." />
      <Link href="/members/new"><Button type="primary" icon={<PlusOutlined />} block>Thêm thành viên</Button></Link>
      <Card className="surface">
        <div className="page-stack">
          {members.map((member) => (
            <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <PlayerAvatar member={member} />
              <div style={{ flex: 1 }}>
                <strong>{member.nickname} #{member.shirtNumber}</strong>
                <div className="muted" style={{ fontSize: 12 }}>{member.fullName}</div>
              </div>
              <RoleBadge role={member.role} />
              {member.status === "pending" ? <Tag color="gold">Chờ duyệt</Tag> : null}
              <Link href={`/members/${member.id}`}>Xem</Link>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
