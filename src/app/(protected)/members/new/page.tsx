import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { NewMemberForm } from "@/features/members/components/NewMemberForm";

export default function NewMemberPage() {
  return (
    <div className="page-stack member-form-page">
      <div className="member-form-heading">
        <Link className="member-back-link" href="/members"><ArrowLeftOutlined /> Thành viên</Link>
        <h1>Thêm thành viên</h1>
      </div>
      <NewMemberForm />
    </div>
  );
}
