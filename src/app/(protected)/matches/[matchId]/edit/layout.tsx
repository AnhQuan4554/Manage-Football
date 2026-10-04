import { AdminPage } from "@/features/auth/components/AdminPage";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return <AdminPage next={"/matches/" + matchId + "/edit"}>{children}</AdminPage>;
}
