import { PageHeader } from "@/components/common/PageHeader";
import { OpponentsListSection } from "@/features/opponents/components/OpponentsListSection";
import { listOpponents } from "@/features/opponents/services/opponentService";

export default async function OpponentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = resolvedSearchParams.q ?? "";
  const opponentsResponse = await listOpponents(query);
  const opponents = opponentsResponse.data ?? [];
  const errorMessage = opponentsResponse.success
    ? undefined
    : opponentsResponse.message ?? opponentsResponse.error ?? "Không thể tải danh sách đối thủ.";

  return (
    <div className="page-stack">
      <PageHeader
        title="Đối thủ"
        subtitle="Lưu lại các đội bạn từng gặp để sau này tìm và đá lại nhanh hơn."
      />

      <OpponentsListSection opponents={opponents} query={query} errorMessage={errorMessage} />
    </div>
  );
}
