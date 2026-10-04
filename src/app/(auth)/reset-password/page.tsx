import { redirect } from "next/navigation";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { getCurrentAccount } from "@/features/auth/server";

export default async function ResetPasswordPage() {
  if (!(await getCurrentAccount())) redirect("/login?error=recovery");
  return <AuthForm mode="reset" />;
}
