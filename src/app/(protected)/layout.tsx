import { AppShell } from "@/components/layout/AppShell";
import { RefreshOnResume } from "@/components/common/RefreshOnResume";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <RefreshOnResume />
      {children}
    </AppShell>
  );
}
