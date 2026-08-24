import Link from "next/link";
import { Button } from "antd";
import { PlusOutlined, RightOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { RoleBadge } from "@/components/common/RoleBadge";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { EmptyState, ErrorState } from "@/components/common/StateBlocks";
import { getMembers } from "@/features/members/services/memberService";

export default async function MembersPage() {
  const membersResponse = await getMembers();
  const members = membersResponse.data ?? [];
  const rolePriority = { captain: 0, owner: 1, treasurer: 2, member: 3 };
  const activeMembers = members
    .filter((member) => member.status === "active")
    .toSorted((first, second) => {
      const roleOrder = rolePriority[first.role] - rolePriority[second.role];

      if (roleOrder !== 0) return roleOrder;
      return first.nickname.localeCompare(second.nickname, "vi");
    });

  return (
    <div className="page-stack members-page">
      <PageHeader
        title="Thành viên"
        subtitle={activeMembers.length + " người đang sinh hoạt trong đội."}
        action={<Link href="/members/new"><Button type="primary" icon={<PlusOutlined />}>Thêm</Button></Link>}
      />

      <section className="page-stack">
        <div className="section-header members-section-header">
          <h2>Đội hình nhân sự</h2>
        </div>
        <div className="surface members-roster-card">
          {!membersResponse.success ? (
            <ErrorState
              title="Không thể tải được dữ liệu đội"
              description={membersResponse.message ?? membersResponse.error ?? "Vui lòng thử lại sau."}
            />
          ) : activeMembers.length ? (
            <div className="members-roster-grid">
              {activeMembers.map((member) => (
                <Link className="member-card-row" href={"/members/" + member.id} key={member.id}>
                  <PlayerAvatar member={member} size={44} />
                  <span className="member-card-copy">
                    <strong>{member.nickname}</strong>
                    <span className="muted">{member.fullName}</span>
                  </span>
                  <RoleBadge role={member.role} />
                  <RightOutlined className="member-card-arrow" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Hiện chưa có thành viên" description="Bấm Thêm để tạo thành viên đầu tiên cho đội." />
          )}
        </div>
      </section>
    </div>
  );
}
