import { createClient } from "@/lib/supabase/server";
import { fail, ok, type AppResponse } from "@/lib/response";

type DbMatch = {
  id: string;
  team_id: string;
  opponent_name: string;
  opponent_phone: string | null;
  home_score: number | string;
  away_score: number | string;
  match_date_time: string;
  venue_name: string;
  address: string | null;
  pitch_cost: number | string;
  opponent_contribution: number | string;
  note: string | null;
  status: "draft" | "open" | "lineup_ready" | "completed" | "cancelled";
  cancelled_reason: string | null;
  published_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type DbMatchParticipant = {
  id: string;
  match_id: string;
  membership_id: string | null;
  guest_id: string | null;
  participant_name: string;
  response: "unknown" | "going" | "not_going";
  chargeable: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type DbLineup = {
  id: string;
  match_id: string;
  formation_code: string;
  status: "draft" | "published";
  version: number;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbLineupSlot = {
  id: string;
  lineup_id: string;
  slot_key: string;
  participant_id: string;
  x: number | string;
  y: number | string;
  created_at: string;
  updated_at: string;
};

type DbCollection = {
  id: string;
  team_id: string;
  match_id: string | null;
  type: "match" | "shirt" | "party" | "other";
  title: string;
  total_amount: number | string;
  status: "draft" | "open" | "closed" | "cancelled";
  rounding_step: number | string;
  note: string | null;
  due_date: string | null;
  closed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type DbCollectionItem = {
  id: string;
  collection_id: string;
  membership_id: string | null;
  guest_id: string | null;
  participant_name: string;
  amount_due: number | string;
  amount_paid: number | string;
  status: "unpaid" | "partial" | "paid" | "overpaid" | "waived";
  chargeable: boolean;
  note: string | null;
  paid_at: string | null;
  paid_by: string | null;
  payment_note: string | null;
  created_at: string;
  updated_at: string;
};

type DbTeamMember = {
  id: string;
  team_id: string;
  user_id: string | null;
  full_name: string | null;
  role: "owner" | "captain" | "deputy" | "member" | "treasurer";
  jersey_number: number | null;
  nickname: string | null;
  status: "pending" | "active" | "inactive" | "removed";
  joined_at: string;
  created_at: string;
  updated_at: string;
};

type DbProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type DbOpponent = {
  id: string;
  team_id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  note: string | null;
  last_played_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MatchApiInput = {
  opponentName: string;
  opponentPhone?: string | null;
  homeScore?: number;
  awayScore?: number;
  matchDateTime: string;
  venueName: string;
  address?: string | null;
  pitchCost?: number;
  opponentContribution?: number;
  note?: string | null;
  status?: DbMatch["status"];
  participantMemberIds?: string[];
};

export type MatchApiUpdateInput = Partial<MatchApiInput> & {
  cancelledReason?: string | null;
  participantMemberIds?: string[];
  recalculateSplit?: boolean;
};

export type MatchSplitInput = {
  includedMemberIds?: string[];
  mode?: "all_members" | "going";
  roundingStep?: number;
};

export type CollectionItemPaymentInput = {
  action: "mark_paid" | "mark_unpaid";
  paidAt?: string;
  paymentNote?: string | null;
};

export type BulkCollectionItemPaymentInput = {
  action: "mark_paid";
  itemIds: string[];
  paidAt: string;
  paymentNote?: string | null;
};

export type MatchDetailResponse = {
  match: ReturnType<typeof normalizeMatch>;
  participants: ReturnType<typeof normalizeParticipant>[];
  lineup: {
    id: string;
    matchId: string;
    formationCode: string;
    status: DbLineup["status"];
    version: number;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    slots: {
      id: string;
      slotKey: string;
      participantId: string;
      x: number;
      y: number;
    }[];
  } | null;
  collection: {
    id: string;
    type: DbCollection["type"];
    title: string;
    totalAmount: number;
    status: DbCollection["status"];
    roundingStep: number;
    note: string | null;
    dueDate: string | null;
    closedAt: string | null;
    items: {
      id: string;
      membershipId: string | null;
      guestId: string | null;
      participantName: string;
      amountDue: number;
      amountPaid: number;
      status: DbCollectionItem["status"];
      chargeable: boolean;
      note: string | null;
      paidAt: string | null;
      paidBy: string | null;
      paymentNote: string | null;
    }[];
  } | null;
};

const defaultSplitStep = 1000;
const matchSelect =
  "id, team_id, opponent_name, opponent_phone, home_score, away_score, match_date_time, venue_name, address, pitch_cost, opponent_contribution, note, status, cancelled_reason, published_at, completed_at, created_by, updated_by, created_at, updated_at";
const collectionSelect =
  "id, team_id, match_id, type, title, total_amount, status, rounding_step, note, due_date, closed_at, created_by, created_at, updated_at";
const collectionItemSelect =
  "id, collection_id, membership_id, guest_id, participant_name, amount_due, amount_paid, status, chargeable, note, paid_at, paid_by, payment_note, created_at, updated_at";

function asNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function normalizeMatch(row: DbMatch) {
  return {
    id: row.id,
    teamId: row.team_id,
    opponentName: row.opponent_name,
    opponentPhone: row.opponent_phone,
    homeScore: asNumber(row.home_score),
    awayScore: asNumber(row.away_score),
    matchDateTime: row.match_date_time,
    venueName: row.venue_name,
    address: row.address,
    pitchCost: asNumber(row.pitch_cost),
    opponentContribution: asNumber(row.opponent_contribution),
    note: row.note,
    status: row.status,
    cancelledReason: row.cancelled_reason,
    publishedAt: row.published_at,
    completedAt: row.completed_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeParticipant(row: DbMatchParticipant) {
  return {
    id: row.id,
    matchId: row.match_id,
    membershipId: row.membership_id,
    guestId: row.guest_id,
    participantName: row.participant_name,
    response: row.response,
    chargeable: row.chargeable,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeCollection(row: DbCollection) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    totalAmount: asNumber(row.total_amount),
    status: row.status,
    roundingStep: asNumber(row.rounding_step),
    note: row.note,
    dueDate: row.due_date,
    closedAt: row.closed_at,
  };
}

function normalizeCollectionItem(row: DbCollectionItem) {
  return {
    id: row.id,
    membershipId: row.membership_id,
    guestId: row.guest_id,
    participantName: row.participant_name,
    amountDue: asNumber(row.amount_due),
    amountPaid: asNumber(row.amount_paid),
    status: row.status,
    chargeable: row.chargeable,
    note: row.note,
    paidAt: row.paid_at,
    paidBy: row.paid_by,
    paymentNote: row.payment_note,
  };
}

function normalizeLineup(row: DbLineup, slots: DbLineupSlot[]) {
  return {
    id: row.id,
    matchId: row.match_id,
    formationCode: row.formation_code,
    status: row.status,
    version: row.version,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slots: slots.map((slot) => ({
      id: slot.id,
      slotKey: slot.slot_key,
      participantId: slot.participant_id,
      x: asNumber(slot.x),
      y: asNumber(slot.y),
    })),
  };
}

function normalizeProfile(row: DbProfile) {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
  };
}

function participantSplitKey(participant: {
  membershipId: string | null;
  guestId: string | null;
  id: string;
}) {
  return participant.membershipId ?? participant.guestId ?? participant.id;
}

async function upsertOpponent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  name: string,
  lastPlayedAt?: string | null,
) {
  const { data, error } = await supabase
    .from("opponents")
    .upsert(
      {
        team_id: teamId,
        name: name.trim(),
        last_played_at: lastPlayedAt ?? null,
      },
      { onConflict: "team_id,name" },
    )
    .select("id, team_id, name, contact_name, phone, note, last_played_at, created_at, updated_at")
    .single();

  if (error) {
    return { error };
  }

  return { data: data as DbOpponent };
}

function isMissingOpponentSchemaError(error: { message?: string; code?: string }) {
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.message?.includes("public.opponents") ||
    error.message?.includes("schema cache")
  );
}

function isValidDateTime(value: string) {
  return !Number.isNaN(Date.parse(value));
}

function computeSplitShares(totalAmount: number, count: number, roundingStep = defaultSplitStep) {
  if (count <= 0) {
    return [];
  }

  const step = Math.max(1, Math.trunc(roundingStep));
  const perHead = Math.max(0, Math.ceil(totalAmount / count / step) * step);

  return Array.from({ length: count }, () => perHead);
}

function computeCollectionItemStatus(
  amountDue: number,
  amountPaid: number,
  previousStatus?: DbCollectionItem["status"],
): DbCollectionItem["status"] {
  if (previousStatus === "waived") return "waived";
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid < amountDue) return "partial";
  if (amountPaid === amountDue) return "paid";
  return "overpaid";
}

async function loadTeamMembers(supabase: Awaited<ReturnType<typeof createClient>>, teamId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select(
      "id, team_id, user_id, full_name, role, jersey_number, nickname, status, joined_at, created_at, updated_at",
    )
    .eq("team_id", teamId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  if (error) {
    return { error };
  }

  const members = (data ?? []) as DbTeamMember[];
  const userIds = members.map((member) => member.user_id).filter((id): id is string => Boolean(id));

  const profilesMap = new Map<string, ReturnType<typeof normalizeProfile>>();
  if (userIds.length) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, avatar_url")
      .in("id", userIds);

    if (profileError) {
      return { error: profileError };
    }

    (profiles ?? []).forEach((profile) => {
      profilesMap.set(profile.id, normalizeProfile(profile as DbProfile));
    });
  }

  return {
    data: members.map((member) => {
      const profile = member.user_id ? profilesMap.get(member.user_id) : undefined;
      return {
        ...member,
        profile,
      };
    }),
  };
}

function normalizeMemberIds(memberIds: string[] | undefined) {
  return Array.from(
    new Set(
      (memberIds ?? [])
        .filter((memberId): memberId is string => typeof memberId === "string")
        .map((memberId) => memberId.trim())
        .filter(Boolean),
    ),
  );
}

function getMemberParticipantName(
  member: DbTeamMember & { profile?: ReturnType<typeof normalizeProfile> },
) {
  return member.profile?.fullName ?? member.full_name ?? member.nickname ?? "Th\u00e0nh vi\u00ean";
}

async function syncMatchParticipants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  matchId: string,
  memberIds: string[],
) {
  const selectedMemberIds = normalizeMemberIds(memberIds);

  if (!selectedMemberIds.length) {
    return { data: [] as string[] };
  }

  const membersResult = await loadTeamMembers(supabase, teamId);
  if ("error" in membersResult && membersResult.error) {
    return { error: membersResult.error };
  }

  const selectedMemberIdSet = new Set(selectedMemberIds);
  const selectedMembers = (membersResult.data ?? []).filter((member) =>
    selectedMemberIdSet.has(member.id),
  );

  if (selectedMembers.length !== selectedMemberIds.length) {
    return {
      error: new Error(
        "M\u1ed9t s\u1ed1 th\u00e0nh vi\u00ean kh\u00f4ng h\u1ee3p l\u1ec7 ho\u1eb7c kh\u00f4ng c\u00f2n active",
      ),
    };
  }

  const upsertPayload = selectedMembers.map((member) => ({
    match_id: matchId,
    membership_id: member.id,
    guest_id: null,
    participant_name: getMemberParticipantName(member),
    response: "going" as const,
    chargeable: true,
  }));

  const { error: upsertError } = await supabase
    .from("match_participants")
    .upsert(upsertPayload, { onConflict: "match_id,membership_id" });

  if (upsertError) {
    return { error: upsertError };
  }

  const existingResult = await supabase
    .from("match_participants")
    .select("id, membership_id")
    .eq("match_id", matchId)
    .not("membership_id", "is", null);

  if (existingResult.error) {
    return { error: existingResult.error };
  }

  const unselectedParticipantIds = (existingResult.data ?? [])
    .filter(
      (participant) =>
        participant.membership_id && !selectedMemberIdSet.has(participant.membership_id),
    )
    .map((participant) => participant.id);

  if (unselectedParticipantIds.length) {
    const { error: updateError } = await supabase
      .from("match_participants")
      .update({ response: "not_going", chargeable: false })
      .in("id", unselectedParticipantIds);

    if (updateError) {
      return { error: updateError };
    }
  }

  return { data: selectedMemberIds };
}

export async function listTeamMatches(
  teamId: string,
): Promise<AppResponse<ReturnType<typeof normalizeMatch>[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("team_id", teamId)
    .neq("status", "cancelled")
    .order("match_date_time", { ascending: false });

  if (error) {
    return fail(error.message, "Không thể tải danh sách trận");
  }

  return ok(((data ?? []) as DbMatch[]).map(normalizeMatch));
}

export async function createTeamMatch(
  teamId: string,
  input: MatchApiInput,
): Promise<AppResponse<ReturnType<typeof normalizeMatch>>> {
  if (!input.opponentName?.trim()) return fail("opponentName is required");
  if (!input.matchDateTime || !isValidDateTime(input.matchDateTime))
    return fail("matchDateTime is invalid");
  if (!input.venueName?.trim()) return fail("venueName is required");
  if (input.homeScore !== undefined && (!Number.isInteger(input.homeScore) || input.homeScore < 0))
    return fail("homeScore must be a non-negative integer");
  if (input.awayScore !== undefined && (!Number.isInteger(input.awayScore) || input.awayScore < 0))
    return fail("awayScore must be a non-negative integer");
  if (input.pitchCost !== undefined && (!Number.isFinite(input.pitchCost) || input.pitchCost < 0))
    return fail("pitchCost must be a non-negative number");
  if (
    input.opponentContribution !== undefined &&
    (!Number.isFinite(input.opponentContribution) || input.opponentContribution < 0)
  )
    return fail("opponentContribution must be a non-negative number");

  const supabase = await createClient();
  const opponentResult = await upsertOpponent(
    supabase,
    teamId,
    input.opponentName,
    input.status === "completed" ? input.matchDateTime : null,
  );

  if ("error" in opponentResult && opponentResult.error) {
    if (!isMissingOpponentSchemaError(opponentResult.error)) {
      return fail(opponentResult.error.message, "Không thể lưu đối thủ");
    }
  }

  const { data, error } = await supabase
    .from("matches")
    .insert({
      team_id: teamId,
      opponent_name: input.opponentName.trim(),
      opponent_phone: input.opponentPhone?.trim() || null,
      home_score: input.homeScore ?? 0,
      away_score: input.awayScore ?? 0,
      match_date_time: input.matchDateTime,
      venue_name: input.venueName.trim(),
      address: input.address?.trim() || null,
      pitch_cost: input.pitchCost ?? 0,
      opponent_contribution: input.opponentContribution ?? 0,
      note: input.note?.trim() || null,
      status: input.status ?? "draft",
    })
    .select(matchSelect)
    .single();

  if (error) {
    return fail(error.message, "Không thể tạo trận");
  }

  let participantMemberIds: string[];
  if (input.participantMemberIds !== undefined) {
    if (!Array.isArray(input.participantMemberIds)) {
      return fail("participantMemberIds must be an array");
    }
    participantMemberIds = normalizeMemberIds(input.participantMemberIds);
  } else {
    const membersResult = await loadTeamMembers(supabase, teamId);
    if ("error" in membersResult && membersResult.error) {
      return fail(
        membersResult.error.message,
        "Không thể tạo danh sách thành viên tham gia mặc định",
      );
    }
    participantMemberIds = (membersResult.data ?? []).map((member) => member.id);
  }

  const participantResult = await syncMatchParticipants(
    supabase,
    teamId,
    (data as DbMatch).id,
    participantMemberIds,
  );

  if ("error" in participantResult && participantResult.error) {
    return fail(
      participantResult.error.message,
      "Không thể tạo danh sách thành viên tham gia mặc định",
    );
  }

  return ok(normalizeMatch(data as DbMatch), "Tạo trận thành công");
}

export async function updateTeamMatch(
  teamId: string,
  matchId: string,
  input: MatchApiUpdateInput,
): Promise<AppResponse<ReturnType<typeof normalizeMatch>>> {
  const patch: Record<string, unknown> = {};
  let opponentNameChanged = false;

  if (input.opponentName !== undefined) {
    if (!input.opponentName.trim()) return fail("opponentName is required");
    patch.opponent_name = input.opponentName.trim();
    opponentNameChanged = true;
  }
  if (input.opponentPhone !== undefined) {
    patch.opponent_phone = input.opponentPhone?.trim() || null;
  }
  if (input.homeScore !== undefined) {
    if (!Number.isInteger(input.homeScore) || input.homeScore < 0)
      return fail("homeScore must be a non-negative integer");
    patch.home_score = input.homeScore;
  }
  if (input.awayScore !== undefined) {
    if (!Number.isInteger(input.awayScore) || input.awayScore < 0)
      return fail("awayScore must be a non-negative integer");
    patch.away_score = input.awayScore;
  }
  if (input.matchDateTime !== undefined) {
    if (!isValidDateTime(input.matchDateTime)) return fail("matchDateTime is invalid");
    patch.match_date_time = input.matchDateTime;
  }
  if (input.venueName !== undefined) {
    if (!input.venueName.trim()) return fail("venueName is required");
    patch.venue_name = input.venueName.trim();
  }
  if (input.address !== undefined) {
    patch.address = input.address?.trim() || null;
  }
  if (input.pitchCost !== undefined) {
    if (!Number.isFinite(input.pitchCost) || input.pitchCost < 0)
      return fail("pitchCost must be a non-negative number");
    patch.pitch_cost = input.pitchCost;
  }
  if (input.opponentContribution !== undefined) {
    if (!Number.isFinite(input.opponentContribution) || input.opponentContribution < 0)
      return fail("opponentContribution must be a non-negative number");
    patch.opponent_contribution = input.opponentContribution;
  }
  if (input.note !== undefined) {
    patch.note = input.note?.trim() || null;
  }
  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === "completed") {
      patch.completed_at = new Date().toISOString();
    }
  }
  if (input.cancelledReason !== undefined) {
    patch.cancelled_reason = input.cancelledReason?.trim() || null;
  }

  const supabase = await createClient();
  let syncedParticipantMemberIds: string[] | undefined;

  if (input.participantMemberIds !== undefined) {
    if (!Array.isArray(input.participantMemberIds)) {
      return fail("participantMemberIds must be an array");
    }

    syncedParticipantMemberIds = normalizeMemberIds(input.participantMemberIds);
    if (input.recalculateSplit && !syncedParticipantMemberIds.length) {
      return fail(
        "participantMemberIds is required",
        "Ch\u1ecdn \u00edt nh\u1ea5t m\u1ed9t th\u00e0nh vi\u00ean tham gia \u0111\u1ec3 chia ti\u1ec1n",
      );
    }

    const participantResult = await syncMatchParticipants(
      supabase,
      teamId,
      matchId,
      syncedParticipantMemberIds,
    );

    if ("error" in participantResult && participantResult.error) {
      return fail(
        participantResult.error.message,
        "Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt th\u00e0nh vi\u00ean tham gia",
      );
    }

    syncedParticipantMemberIds = participantResult.data;
  }

  let data: DbMatch | null = null;

  if (Object.keys(patch).length) {
    const updateResult = await supabase
      .from("matches")
      .update(patch)
      .eq("team_id", teamId)
      .eq("id", matchId)
      .select(matchSelect)
      .maybeSingle();

    if (updateResult.error) {
      return fail(updateResult.error.message, "Không thể cập nhật trận");
    }

    data = updateResult.data as DbMatch | null;
  } else {
    const matchResult = await getTeamMatchRecord(supabase, teamId, matchId);
    if ("error" in matchResult && matchResult.error) {
      return fail(matchResult.error.message, "Không thể tải trận");
    }

    data = matchResult.data;
  }

  if (!data) {
    return fail("NOT_FOUND", "Trận đấu không tồn tại");
  }

  if (opponentNameChanged) {
    const opponentResult = await upsertOpponent(
      supabase,
      teamId,
      data.opponent_name,
      data.status === "completed" ? data.match_date_time : null,
    );

    if ("error" in opponentResult && opponentResult.error) {
      if (!isMissingOpponentSchemaError(opponentResult.error)) {
        return fail(opponentResult.error.message, "Không thể lưu đối thủ");
      }
    }
  }

  if (input.recalculateSplit && data.status === "completed") {
    const splitResult = await recalculateMatchSplit(
      teamId,
      matchId,
      syncedParticipantMemberIds
        ? { includedMemberIds: syncedParticipantMemberIds }
        : { mode: "going" },
    );
    if (!splitResult.success) {
      return fail(splitResult.error ?? "Không thể cập nhật chia tiền", splitResult.message);
    }
  }

  return ok(normalizeMatch(data as DbMatch), "Cập nhật trận thành công");
}

export async function deleteTeamMatch(teamId: string, matchId: string): Promise<AppResponse<true>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .delete()
    .eq("team_id", teamId)
    .eq("id", matchId)
    .select("id")
    .maybeSingle();

  if (error) {
    return fail(error.message, "Không thể xoá trận");
  }

  if (!data) {
    return fail("MATCH_NOT_FOUND", "Trận không tồn tại hoặc bạn không có quyền xoá");
  }

  return ok(true, "Đã xoá trận");
}

async function getTeamMatchRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  matchId: string,
) {
  const { data: match, error } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("team_id", teamId)
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    return { error };
  }

  if (!match) {
    return { data: null };
  }

  return { data: match as DbMatch };
}

export async function getTeamMatch(
  teamId: string,
  matchId: string,
): Promise<AppResponse<MatchDetailResponse>> {
  const supabase = await createClient();
  const matchResult = await getTeamMatchRecord(supabase, teamId, matchId);

  if ("error" in matchResult && matchResult.error) {
    return fail(matchResult.error.message, "Không thể tải trận");
  }

  if (!matchResult.data) {
    return fail("NOT_FOUND", "Trận đấu không tồn tại");
  }

  const [participantsResult, lineupResult, collectionResult] = await Promise.all([
    supabase
      .from("match_participants")
      .select(
        "id, match_id, membership_id, guest_id, participant_name, response, chargeable, note, created_at, updated_at",
      )
      .eq("match_id", matchId)
      .order("created_at", { ascending: true }),
    supabase
      .from("lineups")
      .select(
        "id, match_id, formation_code, status, version, created_by, published_at, created_at, updated_at",
      )
      .eq("match_id", matchId)
      .maybeSingle(),
    supabase.from("collections").select(collectionSelect).eq("match_id", matchId).maybeSingle(),
  ]);

  if (participantsResult.error)
    return fail(participantsResult.error.message, "Không thể tải người tham gia");
  if (lineupResult.error) return fail(lineupResult.error.message, "Không thể tải đội hình");
  if (collectionResult.error)
    return fail(collectionResult.error.message, "Không thể tải chia tiền");

  const lineup = lineupResult.data as DbLineup | null;
  const collection = collectionResult.data as DbCollection | null;

  const [slotsResult, itemsResult] = await Promise.all([
    lineup
      ? supabase
          .from("lineup_slots")
          .select("id, lineup_id, slot_key, participant_id, x, y, created_at, updated_at")
          .eq("lineup_id", lineup.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    collection
      ? supabase
          .from("collection_items")
          .select(collectionItemSelect)
          .eq("collection_id", collection.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (slotsResult.error) return fail(slotsResult.error.message, "Không thể tải slot đội hình");
  if (itemsResult.error) return fail(itemsResult.error.message, "Không thể tải collection items");

  return ok({
    match: normalizeMatch(matchResult.data),
    participants: ((participantsResult.data ?? []) as DbMatchParticipant[]).map(
      normalizeParticipant,
    ),
    lineup: lineup ? normalizeLineup(lineup, (slotsResult.data ?? []) as DbLineupSlot[]) : null,
    collection: collection
      ? {
          ...normalizeCollection(collection),
          items: ((itemsResult.data ?? []) as DbCollectionItem[]).map(normalizeCollectionItem),
        }
      : null,
  });
}

export async function recalculateMatchSplit(
  teamId: string,
  matchId: string,
  input: MatchSplitInput,
): Promise<AppResponse<MatchDetailResponse["collection"]>> {
  const supabase = await createClient();
  const matchResult = await getTeamMatchRecord(supabase, teamId, matchId);

  if ("error" in matchResult && matchResult.error) {
    return fail(matchResult.error.message, "Không thể tải trận");
  }

  if (!matchResult.data) {
    return fail("NOT_FOUND", "Trận đấu không tồn tại");
  }

  const match = matchResult.data;
  const teamCost = Math.max(0, asNumber(match.pitch_cost));

  const [participantsResult, collectionResult] = await Promise.all([
    supabase
      .from("match_participants")
      .select(
        "id, match_id, membership_id, guest_id, participant_name, response, chargeable, note, created_at, updated_at",
      )
      .eq("match_id", matchId)
      .order("created_at", { ascending: true }),
    supabase.from("collections").select(collectionSelect).eq("match_id", matchId).maybeSingle(),
  ]);

  if (participantsResult.error)
    return fail(participantsResult.error.message, "Không thể tải người tham gia");
  if (collectionResult.error)
    return fail(collectionResult.error.message, "Không thể tải collection");

  const participants = ((participantsResult.data ?? []) as DbMatchParticipant[]).map(
    normalizeParticipant,
  );
  const selectedMembershipIds = input.includedMemberIds?.filter(Boolean) ?? [];
  const goingParticipants = participants.filter(
    (participant) =>
      participant.response === "going" &&
      participant.chargeable &&
      Boolean(participant.membershipId),
  );
  const includedMembershipIds = selectedMembershipIds.length
    ? selectedMembershipIds
    : goingParticipants.map((participant) => participant.membershipId as string);

  if (!includedMembershipIds.length) {
    return fail("No chargeable members were found", "Không có thành viên tham gia để chia tiền");
  }

  const roundingStep = Math.max(1, Math.trunc(input.roundingStep ?? defaultSplitStep));
  const shares = computeSplitShares(teamCost, includedMembershipIds.length, roundingStep);

  const existingCollection = collectionResult.data as DbCollection | null;
  let collectionData = existingCollection
    ? existingCollection
    : ({
        ...(
          await supabase
            .from("collections")
            .insert({
              team_id: teamId,
              match_id: matchId,
              type: "match",
              title: `Chia tiền trận ${match.opponent_name}`,
              total_amount: teamCost,
              status: "open",
              rounding_step: roundingStep,
            })
            .select(collectionSelect)
            .single()
        ).data,
      } as DbCollection);

  if (!collectionData) {
    return fail("Could not create collection", "Không thể tạo collection chia tiền");
  }

  if (existingCollection) {
    const { error: updateCollectionError } = await supabase
      .from("collections")
      .update({
        total_amount: teamCost,
        rounding_step: roundingStep,
        status: "open",
      })
      .eq("id", existingCollection.id);

    if (updateCollectionError) {
      return fail(updateCollectionError.message, "Không thể cập nhật collection chia tiền");
    }

    collectionData = {
      ...existingCollection,
      total_amount: teamCost,
      rounding_step: roundingStep,
      status: "open",
    };
  }

  const existingItemsResult = await supabase
    .from("collection_items")
    .select(collectionItemSelect)
    .eq("collection_id", collectionData.id);

  if (existingItemsResult.error) {
    return fail(existingItemsResult.error.message, "Không thể đọc items cũ");
  }

  const existingItems = (existingItemsResult.data ?? []) as DbCollectionItem[];
  const existingByKey = new Map(
    existingItems.map((item) => [
      item.membership_id ?? item.guest_id ?? item.participant_name,
      item,
    ]),
  );
  const participantByKey = new Map(
    participants
      .filter((participant) => participant.chargeable && participant.response === "going")
      .map((participant) => [participantSplitKey(participant), participant]),
  );
  const missingParticipantMemberIds = includedMembershipIds.filter(
    (membershipId) => !participantByKey.has(membershipId),
  );
  const memberNameById = new Map<string, string>();

  if (missingParticipantMemberIds.length) {
    const membersResult = await loadTeamMembers(supabase, teamId);
    if ("error" in membersResult && membersResult.error) {
      return fail(membersResult.error.message, "Không thể tải thành viên để chia tiền");
    }

    for (const member of membersResult.data ?? []) {
      if (missingParticipantMemberIds.includes(member.id)) {
        memberNameById.set(member.id, getMemberParticipantName(member));
      }
    }
  }

  const payload = includedMembershipIds.map((membershipId, index) => {
    const participant = participantByKey.get(membershipId);
    const existing = existingByKey.get(membershipId);
    const amountDue = shares[index] ?? 0;
    const amountPaid = existing ? asNumber(existing.amount_paid) : 0;
    const status = computeCollectionItemStatus(amountDue, amountPaid, existing?.status);

    return {
      id: existing?.id,
      collection_id: collectionData.id,
      membership_id: participant?.membershipId ?? membershipId,
      guest_id: participant?.guestId ?? null,
      participant_name:
        participant?.participantName ??
        memberNameById.get(membershipId) ??
        `Thành viên ${index + 1}`,
      amount_due: amountDue,
      amount_paid: amountPaid,
      status,
      chargeable: true,
      note: existing?.note ?? null,
      paid_at: existing?.paid_at ?? null,
      paid_by: existing?.paid_by ?? null,
      payment_note: existing?.payment_note ?? null,
    };
  });

  for (const item of payload) {
    if (item.id) {
      const patch = { ...item };
      delete patch.id;
      const { error: updateItemError } = await supabase
        .from("collection_items")
        .update(patch)
        .eq("id", item.id)
        .eq("collection_id", collectionData.id);

      if (updateItemError) {
        return fail(updateItemError.message, "Không thể cập nhật item chia tiền");
      }

      continue;
    }

    const insertPayload = { ...item };
    delete insertPayload.id;
    const { error: insertItemError } = await supabase
      .from("collection_items")
      .insert(insertPayload);
    if (insertItemError) {
      return fail(insertItemError.message, "Không thể tạo item chia tiền");
    }
  }

  const activeKeys = new Set(
    payload.map((item) => item.membership_id ?? item.guest_id ?? item.participant_name),
  );
  const removableItemIds = existingItems
    .filter((item) => !activeKeys.has(item.membership_id ?? item.guest_id ?? item.participant_name))
    .filter((item) => asNumber(item.amount_paid) <= 0)
    .map((item) => item.id);

  if (removableItemIds.length) {
    const { error: deleteError } = await supabase
      .from("collection_items")
      .delete()
      .in("id", removableItemIds)
      .eq("collection_id", collectionData.id);

    if (deleteError) {
      return fail(deleteError.message, "Không thể xoá item không còn trong danh sách chia tiền");
    }
  }

  const { data: reloadedItems, error: reloadError } = await supabase
    .from("collection_items")
    .select(collectionItemSelect)
    .eq("collection_id", collectionData.id)
    .order("created_at", { ascending: true });

  if (reloadError) {
    return fail(reloadError.message, "Không thể tải lại collection items");
  }

  const response = {
    ...normalizeCollection(collectionData),
    items: ((reloadedItems ?? []) as DbCollectionItem[]).map(normalizeCollectionItem),
  };

  return ok(response, "Đã cập nhật chia tiền");
}

export async function updateCollectionItemsPayment(
  teamId: string,
  matchId: string,
  input: BulkCollectionItemPaymentInput,
): Promise<AppResponse<ReturnType<typeof normalizeCollectionItem>[]>> {
  if (input.action !== "mark_paid") {
    return fail("action is invalid", "Hành động cập nhật tiền không hợp lệ");
  }

  if (!Array.isArray(input.itemIds) || !input.itemIds.length) {
    return fail("itemIds is required", "Chọn ít nhất một người để xác nhận đã đóng");
  }

  const itemIds = Array.from(
    new Set(
      input.itemIds
        .filter((itemId): itemId is string => typeof itemId === "string")
        .map((itemId) => itemId.trim())
        .filter(Boolean),
    ),
  );

  if (!itemIds.length) {
    return fail("itemIds is required", "Chọn ít nhất một người để xác nhận đã đóng");
  }

  if (!input.paidAt || Number.isNaN(Date.parse(input.paidAt))) {
    return fail("paidAt is invalid", "Thời gian đóng tiền không hợp lệ");
  }

  const supabase = await createClient();
  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select(collectionSelect)
    .eq("team_id", teamId)
    .eq("match_id", matchId)
    .maybeSingle();

  if (collectionError) {
    return fail(collectionError.message, "Không thể tải đợt thu tiền");
  }

  if (!collection) {
    return fail("NOT_FOUND", "Chưa có đợt thu tiền cho trận này");
  }

  const collectionId = (collection as DbCollection).id;
  const { data: items, error: itemsError } = await supabase
    .from("collection_items")
    .select(collectionItemSelect)
    .eq("collection_id", collectionId)
    .in("id", itemIds);

  if (itemsError) {
    return fail(itemsError.message, "Không thể tải danh sách khoản đóng tiền");
  }

  const currentItems = (items ?? []) as DbCollectionItem[];
  if (currentItems.length !== itemIds.length) {
    return fail("ITEM_NOT_FOUND", "Một số khoản đóng tiền không thuộc trận này");
  }

  const invalidItems = currentItems.filter(
    (item) => item.status !== "unpaid" && item.status !== "partial",
  );
  if (invalidItems.length) {
    return fail(
      "ITEM_STATUS_INVALID",
      "Chỉ có thể xác nhận những khoản chưa đóng hoặc đóng thiếu",
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData.user?.id ?? null;
  const updatedItems: ReturnType<typeof normalizeCollectionItem>[] = [];

  for (const item of currentItems) {
    const { data: updatedItem, error: updateError } = await supabase
      .from("collection_items")
      .update({
        amount_paid: asNumber(item.amount_due),
        status: "paid" as const,
        paid_at: item.paid_at ?? input.paidAt,
        paid_by: item.paid_by ?? currentUserId,
        payment_note: input.paymentNote?.trim() || item.payment_note,
      })
      .eq("id", item.id)
      .eq("collection_id", collectionId)
      .select(collectionItemSelect)
      .single();

    if (updateError) {
      return fail(updateError.message, "Không thể cập nhật một khoản đóng tiền");
    }

    updatedItems.push(normalizeCollectionItem(updatedItem as DbCollectionItem));
  }

  return ok(updatedItems, `Đã xác nhận ${updatedItems.length} người đã đóng`);
}

export async function updateCollectionItemPayment(
  teamId: string,
  matchId: string,
  itemId: string,
  input: CollectionItemPaymentInput,
): Promise<AppResponse<ReturnType<typeof normalizeCollectionItem>>> {
  if (input.action !== "mark_paid" && input.action !== "mark_unpaid") {
    return fail("action is invalid", "Hành động cập nhật tiền không hợp lệ");
  }

  if (input.action === "mark_paid" && (!input.paidAt || Number.isNaN(Date.parse(input.paidAt)))) {
    return fail("paidAt is invalid", "Thời gian đóng tiền không hợp lệ");
  }

  const supabase = await createClient();
  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select(collectionSelect)
    .eq("team_id", teamId)
    .eq("match_id", matchId)
    .maybeSingle();

  if (collectionError) {
    return fail(collectionError.message, "Không thể tải đợt thu tiền");
  }

  if (!collection) {
    return fail("NOT_FOUND", "Chưa có đợt thu tiền cho trận này");
  }

  const { data: item, error: itemError } = await supabase
    .from("collection_items")
    .select(collectionItemSelect)
    .eq("id", itemId)
    .eq("collection_id", (collection as DbCollection).id)
    .maybeSingle();

  if (itemError) {
    return fail(itemError.message, "Không thể tải khoản đóng tiền");
  }

  if (!item) {
    return fail("NOT_FOUND", "Không tìm thấy khoản đóng tiền");
  }

  const currentItem = item as DbCollectionItem;
  if (
    input.action === "mark_paid" &&
    currentItem.status !== "unpaid" &&
    currentItem.status !== "partial"
  ) {
    return fail(
      "ITEM_STATUS_INVALID",
      "Chỉ có thể xác nhận những khoản chưa đóng hoặc đóng thiếu",
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData.user?.id ?? null;

  const patch =
    input.action === "mark_paid"
      ? {
          amount_paid: asNumber(currentItem.amount_due),
          status: "paid" as const,
          paid_at: currentItem.paid_at ?? input.paidAt,
          paid_by: currentItem.paid_by ?? currentUserId,
          payment_note: input.paymentNote?.trim() || currentItem.payment_note,
        }
      : {
          amount_paid: 0,
          status: "unpaid" as const,
          paid_at: null,
          paid_by: null,
          payment_note: input.paymentNote?.trim() || null,
        };

  const { data: updatedItem, error: updateError } = await supabase
    .from("collection_items")
    .update(patch)
    .eq("id", currentItem.id)
    .eq("collection_id", currentItem.collection_id)
    .select(collectionItemSelect)
    .single();

  if (updateError) {
    return fail(updateError.message, "Không thể cập nhật trạng thái đóng tiền");
  }

  return ok(
    normalizeCollectionItem(updatedItem as DbCollectionItem),
    input.action === "mark_paid" ? "Đã xác nhận đóng tiền" : "Đã hoàn tác đóng tiền",
  );
}
