import { PageHeader } from "@/components/common/PageHeader";
import { PushSettings } from "@/features/notifications/components/PushSettings";
import { AccountMenu } from "@/features/auth/components/AccountMenu";
import { getCurrentAccount } from "@/features/auth/server";
import { getCurrentTeam } from "@/features/team-profile/services/teamService";
import { isAdmin } from "@/features/auth/utils";

export default async function SettingsPage() {
  const [account, teamResponse] = await Promise.all([getCurrentAccount(), getCurrentTeam()]);
  return (
    <div className="page-stack">
      <PageHeader title="Cài đặt" subtitle="Tài khoản, đội hiện tại, vai trò và thông báo." />
      <section className="surface form-surface">
        <h2>Tài khoản</h2>
        <AccountMenu account={account} />
        {account ? <p className="account-email muted">{account.email}</p> : null}
        <p className="muted">Đội hiện tại: {teamResponse.data?.name || "Chưa chọn đội"}</p>
        {isAdmin(account) ? (
          <p className="auth-feedback auth-feedback-success">Tài khoản của bạn có quyền admin.</p>
        ) : null}
      </section>
      <PushSettings />
    </div>
  );
}
