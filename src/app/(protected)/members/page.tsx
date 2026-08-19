import Link from "next/link";
import { Button, Tag } from "antd";
import { CheckCircleOutlined, PlusOutlined, RightOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { RoleBadge } from "@/components/common/RoleBadge";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { EmptyState } from "@/components/common/StateBlocks";
import { getMembers } from "@/features/members/services/memberService";

export default async function MembersPage() {
  const members = (await getMembers()).data ?? [];
  const activeMembers = members.filter((member) => member.status === "active");
  const pendingMembers = members.filter((member) => member.status === "pending");

  return (
    <div className="page-stack">
      <PageHeader
        title="Thành viên"
        subtitle={`${activeMembers.length} người đang sinh hoạt trong đội.`}
        action={<Link href="/members/new"><Button type="primary" icon={<PlusOutlined />}>Thêm</Button></Link>}
      />

      <section className="page-stack">
        <div className="section-header">
          <div>
            <h2>Chờ duyệt vào đội</h2>
            <p className="muted" style={{ margin: "5px 0 0" }}>{pendingMembers.length ? `${pendingMembers.length} yêu cầu mới` : "Không có yêu cầu nào"}</p>
          </div>
        </div>
        {pendingMembers.length === 0 ? (
          <EmptyState title="Chưa có yêu cầu nào" description="Khi có người đăng ký, yêu cầu sẽ hiện ở đây để bạn duyệt." />
        ) : (
          pendingMembers.map((member) => (
            <div className="surface-card" key={member.id}>
              <div className="member-row" style={{ padding: 0 }}>
                <PlayerAvatar member={member} size={44} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <strong>{member.fullName}</strong>
                  <span className="muted" style={{ display: "block", fontSize: 12 }}>{member.phone} · số áo {member.shirtNumber}</span>
                </span>
                <Tag color="gold" style={{ marginInlineEnd: 0 }}>Mới</Tag>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button type="primary" icon={<CheckCircleOutlined />} style={{ flex: 1 }}>Chấp nhận</Button>
                <Button style={{ flex: 1 }}>Từ chối</Button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="page-stack">
        <div className="section-header">
          <h2>Đội hình nhân sự</h2>
          <Tag>{activeMembers.length}</Tag>
        </div>
        <div className="surface" style={{ overflow: "hidden" }}>
          {activeMembers.map((member) => (
            <Link className="member-row" href={`/members/${member.id}`} key={member.id}>
              <PlayerAvatar member={member} size={44} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <strong>{member.nickname} #{member.shirtNumber}</strong>
                <span className="muted" style={{ display: "block", fontSize: 12 }}>{member.fullName}</span>
              </span>
              <RoleBadge role={member.role} />
              <RightOutlined className="muted" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
