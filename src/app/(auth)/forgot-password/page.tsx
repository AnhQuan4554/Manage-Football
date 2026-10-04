import { AuthForm } from "@/features/auth/components/AuthForm";
import { safeNextPath } from "@/features/auth/utils";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return <AuthForm mode="forgot" next={safeNextPath((await searchParams).next)} />;
}
