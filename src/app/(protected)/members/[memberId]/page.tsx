import Link from "next/link";
import { Button, Card, Descriptions } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { RoleBadge } from "@/components/common/RoleBadge";
import { getMemberById } from "@/features/members/services/memberService";

export default async function MemberDetailPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const member = (await getMemberById(memberId)).data;
  if (!member) return <PageHeader title="Không tìm thấy thành viên" />;

  return (
    <div className="page-stack">
      <PageHeader title={`${member.nickname} #${member.shirtNumber}`} subtitle={member.fullName} />
      <Link href={`/members/${member.id}/edit`}><Button type="primary">Chỉnh sửa</Button></Link>
      <Card className="surface">
        <Descriptions column={1}>
          <Descriptions.Item label="Vai trò"><RoleBadge role={member.role} /></Descriptions.Item>
          <Descriptions.Item label="Điện thoại">{member.phone}</Descriptions.Item>
          <Descriptions.Item label="Ngày sinh">{member.birthday}</Descriptions.Item>
          <Descriptions.Item label="Gia nhập">{member.joinedAt}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
