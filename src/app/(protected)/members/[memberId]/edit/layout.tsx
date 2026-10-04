import { AdminPage } from "@/features/auth/components/AdminPage";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  return <AdminPage next={"/members/" + memberId + "/edit"}>{children}</AdminPage>;
}
