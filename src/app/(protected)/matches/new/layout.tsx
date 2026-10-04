import { AdminPage } from "@/features/auth/components/AdminPage";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminPage next="/matches/new">{children}</AdminPage>;
}
