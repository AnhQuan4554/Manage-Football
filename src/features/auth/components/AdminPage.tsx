import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/features/auth/server";
import { isAdmin, safeNextPath } from "@/features/auth/utils";

export async function AdminPage({ next, children }: { next: string; children: React.ReactNode }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?next=" + encodeURIComponent(safeNextPath(next)));
  if (!isAdmin(account)) {
    return (
      <section className="surface form-surface" role="status">
        <h1>Bạn đang ở chế độ chỉ xem</h1>
        <p>Tài khoản này chưa có quyền quản trị. Liên hệ quản trị viên để được cấp quyền.</p>
        <Link href="/dashboard">Quay lại trang chủ</Link>
      </section>
    );
  }
  return <>{children}</>;
}
