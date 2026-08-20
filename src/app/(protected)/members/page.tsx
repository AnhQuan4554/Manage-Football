import Link from "next/link";
import { Button, Tag } from "antd";
import { PlusOutlined, RightOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { RoleBadge } from "@/components/common/RoleBadge";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { EmptyState, ErrorState } from "@/components/common/StateBlocks";
import { getMembers } from "@/features/members/services/memberService";

export default async function MembersPage() {
  const membersResponse = await getMembers();
  const members = membersResponse.data ?? [];
  const activeMembers = members.filter((member) => member.status === "active");

  return (
    <div className="page-stack">
      <PageHeader
        title="Thành viên"
        subtitle={`${activeMembers.length} người đang sinh hoạt trong đội.`}
        action={<Link href="/members/new"><Button type="primary" icon={<PlusOutlined />}>Thêm</Button></Link>}
      />

      <section className="page-stack">
        <div className="section-header">
          <h2>Đội hình nhân sự</h2>
          <Tag>{activeMembers.length}</Tag>
        </div>
        <div className="surface" style={{ overflow: "hidden" }}>
          {!membersResponse.success ? (
            <ErrorState
              title="Không thể tải được dữ liệu đội"
              description={membersResponse.message ?? membersResponse.error ?? "Vui lòng thử lại sau."}
            />
          ) : activeMembers.length ? (
            activeMembers.map((member) => (
              <Link className="member-row" href={`/members/${member.id}`} key={member.id}>
                <PlayerAvatar member={member} size={44} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <strong>{member.nickname} #{member.shirtNumber}</strong>
                  <span className="muted" style={{ display: "block", fontSize: 12 }}>{member.fullName}</span>
                </span>
                <RoleBadge role={member.role} />
                <RightOutlined className="muted" />
              </Link>
            ))
          ) : (
            <EmptyState title="Hiện chưa có thành viên" description="Bấm Thêm để tạo thành viên đầu tiên cho đội." />
          )}
        </div>
      </section>
    </div>
  );
}
