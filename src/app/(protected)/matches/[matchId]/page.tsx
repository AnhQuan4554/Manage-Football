import Image from "next/image";
import Link from "next/link";
import { Button, Tag } from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DownOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  HourglassOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { MarkMatchCompletedButton } from "@/features/matches/components/MarkMatchCompletedButton";
import { MatchNoteTooltip } from "@/features/matches/components/MatchNoteTooltip";
import { MatchPaymentTabs } from "@/features/matches/components/MatchPaymentTabs";
import { MatchParticipantsEditor } from "@/features/matches/components/MatchParticipantsEditor";
import { OpponentContactMenu } from "@/features/matches/components/OpponentContactMenu";
import { ZaloVoteCopyButton } from "@/features/matches/components/ZaloVoteCard";
import { listTeamMembers } from "@/features/members/services/memberApiService";
import { getMatchDetail } from "@/features/matches/services/matchService";
import { formatDateTime, formatVnd } from "@/lib/utils/format";

function splitDateTime(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function getStatusLabel(status: string) {
  if (status === "completed") return "Đã đá";
  if (status === "cancelled") return "Đã hủy";
  return "Sắp diễn ra";
}

function getRelativeDayLabel(value: string) {
  const target = new Date(value).getTime();
  const now = Date.now();
  const days = Math.round((target - now) / 86_400_000);

  if (days === 0) return "Hôm nay";
  if (days > 0) return `${days} ngày nữa`;
  return `${Math.abs(days)} ngày trước`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const matchResponse = await getMatchDetail(matchId);
  const detail = matchResponse.data;

  if (!detail) return <PageHeader title="Không tìm thấy trận" />;

  const scheduledAt = splitDateTime(detail.match.matchDateTime);
  const members = ((await listTeamMembers(detail.match.teamId)).data ?? []).filter(
    (member) => member.status === "active",
  );
  const participants = detail.participants;
  const isCompleted = detail.match.status === "completed";
  const goingParticipants = participants.filter((participant) => participant.response === "going");
  const notGoingCount = participants.filter(
    (participant) => participant.response === "not_going",
  ).length;
  const collection = detail.collection;
  const paidCount =
    collection?.items.filter((item) => item.status === "paid" || item.status === "overpaid")
      .length ?? 0;
  const paidAmount = collection?.items.reduce((total, item) => total + item.amountPaid, 0) ?? 0;
  const unpaidAmount = collection ? Math.max(0, collection.totalAmount - paidAmount) : 0;
  const perHeadLabel = collection?.items.length
    ? formatVnd(collection.items[0]?.amountDue ?? 0)
    : "Chưa chia";
  const noteText = detail.match.note || "Không có ghi chú";

  return (
    <div className="page-stack match-detail-page">
      <Link href="/matches" className="match-detail-back">
        <ArrowLeftOutlined /> Trận đấu
      </Link>

      <section className="match-detail-hero">
        <div className="match-detail-hero-top">
          <span className="match-detail-relative">
            {getRelativeDayLabel(detail.match.matchDateTime)}
          </span>
          <div className="match-detail-hero-actions">
            <ZaloVoteCopyButton
              info={{
                opponentName: detail.match.opponentName,
                date: scheduledAt.date,
                time: scheduledAt.time,
                venueName: detail.match.venueName,
              }}
            />
            <Tag
              className={`match-detail-status-pill match-card-status--${detail.match.status === "completed" ? "completed" : detail.match.status === "cancelled" ? "cancelled" : "scheduled"}`}
            >
              {getStatusLabel(detail.match.status)}
            </Tag>
          </div>
        </div>

        <div className="match-detail-matchup">
          <div className="match-detail-teams">
            <div className="match-detail-team">
              <span className="match-detail-logo-badge">
                <Image
                  src="/logo-transparent.png"
                  alt="Pinkstorm FC"
                  width={58}
                  height={58}
                  priority
                />
              </span>
              <strong>Pinkstorm FC</strong>
            </div>
            <span className="match-detail-versus">VS</span>
            <div className="match-detail-team">
              <span className="match-detail-team-badge match-detail-team-badge-muted">
                {getInitials(detail.match.opponentName)}
              </span>
              <strong>{detail.match.opponentName}</strong>
            </div>
          </div>
          <div className="match-detail-score">
            <strong>
              {detail.match.homeScore ?? 0} : {detail.match.awayScore ?? 0}
            </strong>
            <span>Tỉ số</span>
          </div>
        </div>
      </section>

      <section className="surface match-detail-info">
        <div className="match-detail-row">
          <span className="match-detail-icon">
            <CalendarOutlined />
          </span>
          <div>
            <span className="text-kicker">Thời gian</span>
            <strong>{formatDateTime(scheduledAt.date, scheduledAt.time)}</strong>
          </div>
        </div>
        <div className="match-detail-row match-detail-row-action">
          <span className="match-detail-icon">
            <EnvironmentOutlined />
          </span>
          <div>
            <span className="text-kicker">Sân bóng</span>
            <strong>{detail.match.venueName}</strong>
            <p className="muted">{detail.match.address || "Chưa có địa chỉ"}</p>
          </div>
        </div>
        {detail.match.opponentPhone ? (
          <div className="match-detail-row">
            <span className="match-detail-icon">
              <TeamOutlined />
            </span>
            <div>
              <span className="text-kicker">Số đối</span>
              <strong>
                <OpponentContactMenu phone={detail.match.opponentPhone} />
              </strong>
              <p className="muted">Chạm để liên hệ Zalo hoặc gọi từ app</p>
            </div>
          </div>
        ) : null}
        <div className="match-detail-row">
          <span className="match-detail-icon">
            <TeamOutlined />
          </span>
          <div>
            <span className="text-kicker">Tham gia</span>
            <strong>{goingParticipants.length} người tham gia</strong>
            <p className="muted">{notGoingCount} vắng</p>
          </div>
        </div>
        <div className="match-detail-row">
          <span className="match-detail-icon">
            <FileTextOutlined />
          </span>
          <div>
            <span className="text-kicker">Ghi chú</span>
            <MatchNoteTooltip text={noteText} />
          </div>
        </div>
      </section>

      <section className="surface match-detail-split-card">
        <div className="match-detail-section-head">
          <div>
            <span className="text-kicker">Chia tiền sân</span>
            <h2>{formatVnd(detail.match.pitchCost)}</h2>
            <p className="muted">
              {goingParticipants.length} người tham gia · {perHeadLabel}/người
            </p>
          </div>
          <span className="match-detail-icon match-detail-money-icon">
            <WalletOutlined />
          </span>
        </div>

        {collection?.items.length ? (
          <div className="match-detail-money-summary">
            <div className="match-detail-money-summary-item is-paid">
              <span className="match-detail-money-summary-icon">
                <CheckCircleOutlined />
              </span>
              <span className="match-detail-money-summary-copy">
                <small>Đã thu</small>
                <strong>
                  {paidCount}/{collection.items.length}
                </strong>
              </span>
            </div>
            <div className="match-detail-money-summary-item is-missing">
              <span className="match-detail-money-summary-icon">
                <HourglassOutlined />
              </span>
              <span className="match-detail-money-summary-copy">
                <small>Còn thiếu</small>
                <strong>{formatVnd(unpaidAmount)}</strong>
              </span>
            </div>
            <div className="match-detail-money-summary-item is-per-head">
              <span className="match-detail-money-summary-icon">
                <UserOutlined />
              </span>
              <span className="match-detail-money-summary-copy">
                <small>Mỗi người</small>
                <strong>{perHeadLabel}</strong>
              </span>
            </div>
          </div>
        ) : (
          <p className="muted match-detail-empty-note">
            Chưa có dữ liệu chia tiền. Cập nhật chi phí và chọn người tham gia để hệ thống tự chia.
          </p>
        )}

        {collection?.items.length ? <MatchPaymentTabs items={collection.items} /> : null}
      </section>

      <details className="surface match-detail-participants">
        <summary className="match-detail-participants-summary">
          <div>
            <span className="text-kicker">Danh sách tham gia</span>
            <h2>{goingParticipants.length} người đã xác nhận</h2>
          </div>
          <DownOutlined className="match-detail-participants-chevron" />
        </summary>
        <div className="match-detail-participants-content">
          <div className="match-detail-participants-toolbar">
            <MatchParticipantsEditor
              teamId={detail.match.teamId}
              matchId={detail.match.id}
              isCompleted={isCompleted}
              members={members}
              participants={participants}
            />
          </div>
          <div className="match-detail-participant-grid">
            {goingParticipants.length ? (
              goingParticipants.map((participant) => (
                <div key={participant.id} className="match-detail-participant-item">
                  <span className="match-detail-avatar">
                    {getInitials(participant.participantName)}
                  </span>
                  <div>
                    <strong>{participant.participantName}</strong>
                    <p className="muted">Tham gia</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted match-detail-empty-note">Chưa có thành viên tham gia.</p>
            )}
          </div>
        </div>
      </details>

      <div className="match-detail-actions">
        <Link href={`/matches/${detail.match.id}/edit`}>
          <Button type="primary" icon={<EditOutlined />}>
            Cập nhật trận
          </Button>
        </Link>
        {detail.match.status === "completed" && collection ? (
          <Link href={`/funds/${detail.match.id}`}>
            <Button icon={<WalletOutlined />}>Thu tiền</Button>
          </Link>
        ) : null}
        {detail.match.status !== "completed" && detail.match.status !== "cancelled" ? (
          <MarkMatchCompletedButton teamId={detail.match.teamId} matchId={detail.match.id} />
        ) : null}
      </div>
    </div>
  );
}
