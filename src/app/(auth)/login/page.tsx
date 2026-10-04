import { redirect } from "next/navigation";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { getCurrentAccount } from "@/features/auth/server";
import { safeNextPath } from "@/features/auth/utils";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (await getCurrentAccount()) redirect(next);
  const error = params.error
    ? "Không thể hoàn tất xác thực. Liên kết có thể đã hết hạn hoặc bạn đã hủy đăng nhập. Vui lòng thử lại."
    : "";
  return <AuthForm next={next} initialError={error} />;
}
