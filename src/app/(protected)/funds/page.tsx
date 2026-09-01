import { PageHeader } from "@/components/common/PageHeader";
import { FundOverview } from "@/features/funds/components/FundOverview";
import { getFundOverview } from "@/features/funds/services/fundService";
import { getMembers } from "@/features/members/services/memberService";

export default async function FundsPage() {
  const [funds, members] = await Promise.all([getFundOverview(), getMembers()]);
  const data = funds.data!;

  return (
    <div className="page-stack">
      <PageHeader
        title="Quỹ đội"
        subtitle="Theo dõi số dư quỹ, khoản thu chi và phát sinh chung."
      />
      <FundOverview
        balance={data.balance}
        transactions={data.transactions}
        members={members.data ?? []}
      />
    </div>
  );
}
