import Link from "next/link";
import { ArrowLeftOutlined, NumberOutlined, PhoneOutlined, TeamOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { RoleBadge } from "@/components/common/RoleBadge";
import { DeleteMemberButton } from "@/features/members/components/DeleteMemberButton";
import { getMemberById } from "@/features/members/services/memberService";

function formatJoinedAt(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default async function MemberDetailPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const member = (await getMemberById(memberId)).data;

  if (!member) {
    return (
      <div className="page-stack">
        <Link className="member-back-link" href="/members"><ArrowLeftOutlined /> Thành viên</Link>
        <section className="surface-card">Không tìm thấy thành viên</section>
      </div>
    );
  }

  return (
    <div className="page-stack member-detail-page">
      <Link className="member-back-link" href="/members"><ArrowLeftOutlined /> Thành viên</Link>

      <section className="member-detail-hero">
        <PlayerAvatar member={member} size={96} />
        <h1>{member.nickname}</h1>
        <p>{member.fullName}</p>
        <RoleBadge role={member.role} />
      </section>

      <section className="surface member-info-card">
        <div className="member-info-row">
          <span className="member-info-icon"><NumberOutlined /></span>
          <span>
            <span className="text-kicker">Số áo</span>
            <strong>{member.shirtNumber}</strong>
          </span>
        </div>
        <div className="member-info-row">
          <span className="member-info-icon"><PhoneOutlined /></span>
          <span>
            <span className="text-kicker">Số điện thoại</span>
            <strong>{member.phone || "Chưa cập nhật"}</strong>
          </span>
        </div>
      </section>

      <section className="surface member-info-card">
        <div className="member-info-row">
          <span className="member-info-icon"><TeamOutlined /></span>
          <span>
            <span className="text-kicker">Tham gia đội từ</span>
            <strong>{formatJoinedAt(member.joinedAt)}</strong>
          </span>
        </div>
      </section>

      <div className="member-detail-actions">
        <Link href={"/members/" + member.id + "/edit"}><Button type="primary" block>Chỉnh sửa thông tin</Button></Link>
        <DeleteMemberButton teamId={member.teamId} memberId={member.id} memberName={member.nickname} />
      </div>
    </div>
  );
}
