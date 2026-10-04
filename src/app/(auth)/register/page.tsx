import { redirect } from "next/navigation";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { getCurrentAccount } from "@/features/auth/server";
import { safeNextPath } from "@/features/auth/utils";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentAccount()) redirect(next);
  return <AuthForm mode="register" next={next} />;
}
