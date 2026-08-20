import { createClient } from "@/lib/supabase/server";
import { fail, ok, type AppResponse } from "@/lib/response";

type DbMatch = {
  id: string;
  team_id: string;
  opponent_name: string;
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
  status: "unpaid" | "partial" | "paid" | "waived";
  chargeable: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type DbTeamMember = {
  id: string;
  team_id: string;
  user_id: string | null;
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

export type MatchApiInput = {
  opponentName: string;
  matchDateTime: string;
  venueName: string;
  address?: string | null;
  pitchCost: number;
  opponentContribution: number;
  note?: string | null;
  status?: DbMatch["status"];
};

export type MatchApiUpdateInput = Partial<MatchApiInput> & {
  cancelledReason?: string | null;
};

export type MatchSplitInput = {
  includedMemberIds?: string[];
  mode?: "all_members" | "going";
  roundingStep?: number;
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
    }[];
  } | null;
};

const defaultSplitStep = 1;

function asNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function normalizeMatch(row: DbMatch) {
  return {
    id: row.id,
    teamId: row.team_id,
    opponentName: row.opponent_name,
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

function isValidDateTime(value: string) {
  return !Number.isNaN(Date.parse(value));
}

function computeSplitShares(totalAmount: number, count: number, roundingStep = defaultSplitStep) {
  if (count <= 0) {
    return [];
  }

  const step = Math.max(1, Math.trunc(roundingStep));
  const normalizedTotal = Math.ceil(totalAmount / step) * step;
  const baseShare = Math.floor(normalizedTotal / count / step) * step;
  let remainder = normalizedTotal - baseShare * count;

  return Array.from({ length: count }, () => {
    const share = baseShare + (remainder >= step ? step : 0);
    remainder = Math.max(0, remainder - step);
    return share;
  });
}

async function loadTeamMembers(supabase: Awaited<ReturnType<typeof createClient>>, teamId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, team_id, user_id, role, jersey_number, nickname, status, joined_at, created_at, updated_at")
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

export async function listTeamMatches(teamId: string): Promise<AppResponse<ReturnType<typeof normalizeMatch>[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, team_id, opponent_name, match_date_time, venue_name, address, pitch_cost, opponent_contribution, note, status, cancelled_reason, published_at, completed_at, created_by, updated_by, created_at, updated_at")
    .eq("team_id", teamId)
    .order("match_date_time", { ascending: false });

  if (error) {
    return fail(error.message, "Không thể tải danh sách trận");
  }

  return ok(((data ?? []) as DbMatch[]).map(normalizeMatch));
}

export async function createTeamMatch(teamId: string, input: MatchApiInput): Promise<AppResponse<ReturnType<typeof normalizeMatch>>> {
  if (!input.opponentName?.trim()) return fail("opponentName is required");
  if (!input.matchDateTime || !isValidDateTime(input.matchDateTime)) return fail("matchDateTime is invalid");
  if (!input.venueName?.trim()) return fail("venueName is required");
  if (!Number.isFinite(input.pitchCost) || input.pitchCost < 0) return fail("pitchCost must be a non-negative number");
  if (!Number.isFinite(input.opponentContribution) || input.opponentContribution < 0) return fail("opponentContribution must be a non-negative number");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .insert({
      team_id: teamId,
      opponent_name: input.opponentName.trim(),
      match_date_time: input.matchDateTime,
      venue_name: input.venueName.trim(),
      address: input.address?.trim() || null,
      pitch_cost: input.pitchCost,
      opponent_contribution: input.opponentContribution,
      note: input.note?.trim() || null,
      status: input.status ?? "draft",
    })
    .select("id, team_id, opponent_name, match_date_time, venue_name, address, pitch_cost, opponent_contribution, note, status, cancelled_reason, published_at, completed_at, created_by, updated_by, created_at, updated_at")
    .single();

  if (error) {
    return fail(error.message, "Không thể tạo trận");
  }

  return ok(normalizeMatch(data as DbMatch), "Tạo trận thành công");
}

export async function updateTeamMatch(
  teamId: string,
  matchId: string,
  input: MatchApiUpdateInput,
): Promise<AppResponse<ReturnType<typeof normalizeMatch>>> {
  const patch: Record<string, unknown> = {};

  if (input.opponentName !== undefined) {
    if (!input.opponentName.trim()) return fail("opponentName is required");
    patch.opponent_name = input.opponentName.trim();
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
    if (!Number.isFinite(input.pitchCost) || input.pitchCost < 0) return fail("pitchCost must be a non-negative number");
    patch.pitch_cost = input.pitchCost;
  }
  if (input.opponentContribution !== undefined) {
    if (!Number.isFinite(input.opponentContribution) || input.opponentContribution < 0) return fail("opponentContribution must be a non-negative number");
    patch.opponent_contribution = input.opponentContribution;
  }
  if (input.note !== undefined) {
    patch.note = input.note?.trim() || null;
  }
  if (input.status !== undefined) {
    patch.status = input.status;
  }
  if (input.cancelledReason !== undefined) {
    patch.cancelled_reason = input.cancelledReason?.trim() || null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .update(patch)
    .eq("team_id", teamId)
    .eq("id", matchId)
    .select("id, team_id, opponent_name, match_date_time, venue_name, address, pitch_cost, opponent_contribution, note, status, cancelled_reason, published_at, completed_at, created_by, updated_by, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return fail(error.message, "Không thể cập nhật trận");
  }

  if (!data) {
    return fail("NOT_FOUND", "Trận đấu không tồn tại");
  }

  return ok(normalizeMatch(data as DbMatch), "Cập nhật trận thành công");
}

export async function deleteTeamMatch(teamId: string, matchId: string): Promise<AppResponse<true>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update({
      status: "cancelled",
      cancelled_reason: "Đã xoá từ giao diện",
    })
    .eq("team_id", teamId)
    .eq("id", matchId);

  if (error) {
    return fail(error.message, "Không thể xoá trận");
  }

  return ok(true, "Đã xoá trận");
}

async function getTeamMatchRecord(supabase: Awaited<ReturnType<typeof createClient>>, teamId: string, matchId: string) {
  const { data: match, error } = await supabase
    .from("matches")
    .select("id, team_id, opponent_name, match_date_time, venue_name, address, pitch_cost, opponent_contribution, note, status, cancelled_reason, published_at, completed_at, created_by, updated_by, created_at, updated_at")
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

export async function getTeamMatch(teamId: string, matchId: string): Promise<AppResponse<MatchDetailResponse>> {
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
      .select("id, match_id, membership_id, guest_id, participant_name, response, chargeable, note, created_at, updated_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true }),
    supabase
      .from("lineups")
      .select("id, match_id, formation_code, status, version, created_by, published_at, created_at, updated_at")
      .eq("match_id", matchId)
      .maybeSingle(),
    supabase
      .from("collections")
      .select("id, team_id, match_id, type, title, total_amount, status, rounding_step, note, due_date, closed_at, created_by, created_at, updated_at")
      .eq("match_id", matchId)
      .maybeSingle(),
  ]);

  if (participantsResult.error) return fail(participantsResult.error.message, "Không thể tải người tham gia");
  if (lineupResult.error) return fail(lineupResult.error.message, "Không thể tải đội hình");
  if (collectionResult.error) return fail(collectionResult.error.message, "Không thể tải chia tiền");

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
          .select("id, collection_id, membership_id, guest_id, participant_name, amount_due, amount_paid, status, chargeable, note, created_at, updated_at")
          .eq("collection_id", collection.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (slotsResult.error) return fail(slotsResult.error.message, "Không thể tải slot đội hình");
  if (itemsResult.error) return fail(itemsResult.error.message, "Không thể tải collection items");

  return ok({
    match: normalizeMatch(matchResult.data),
    participants: ((participantsResult.data ?? []) as DbMatchParticipant[]).map(normalizeParticipant),
    lineup: lineup
      ? normalizeLineup(lineup, (slotsResult.data ?? []) as DbLineupSlot[])
      : null,
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
  const teamCost = Math.max(0, asNumber(match.pitch_cost) - asNumber(match.opponent_contribution));

  const [membersResult, participantsResult, collectionResult] = await Promise.all([
    loadTeamMembers(supabase, teamId),
    supabase
      .from("match_participants")
      .select("id, match_id, membership_id, guest_id, participant_name, response, chargeable, note, created_at, updated_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true }),
    supabase
      .from("collections")
      .select("id, team_id, match_id, type, title, total_amount, status, rounding_step, note, due_date, closed_at, created_by, created_at, updated_at")
      .eq("match_id", matchId)
      .maybeSingle(),
  ]);

  if ("error" in membersResult && membersResult.error) return fail(membersResult.error.message, "Không thể tải thành viên");
  if (participantsResult.error) return fail(participantsResult.error.message, "Không thể tải người tham gia");
  if (collectionResult.error) return fail(collectionResult.error.message, "Không thể tải collection");

  const activeMembers = (membersResult.data ?? []) as Array<DbTeamMember & { profile?: ReturnType<typeof normalizeProfile> }>;
  const participants = ((participantsResult.data ?? []) as DbMatchParticipant[]).map(normalizeParticipant);
  const selectedMembershipIds = input.includedMemberIds?.filter(Boolean) ?? [];
  const goingMembershipIds = participants
    .filter((participant) => participant.response === "going" && participant.chargeable && participant.membershipId)
    .map((participant) => participant.membershipId as string);

  const effectiveMode = input.mode ?? "all_members";
  const includedMembershipIds = selectedMembershipIds.length
    ? selectedMembershipIds
    : effectiveMode === "going" && goingMembershipIds.length
      ? goingMembershipIds
      : activeMembers.map((member) => member.id);

  if (!includedMembershipIds.length) {
    return fail("No chargeable members were found", "Không có thành viên tính tiền");
  }

  const memberById = new Map(activeMembers.map((member) => [member.id, member]));
  const participantByMembershipId = new Map(
    participants
      .filter((participant) => participant.membershipId)
      .map((participant) => [participant.membershipId as string, participant]),
  );

  const roundingStep = Math.max(1, Math.trunc(input.roundingStep ?? defaultSplitStep));
  const shares = computeSplitShares(teamCost, includedMembershipIds.length, roundingStep);

  const existingCollection = collectionResult.data as DbCollection | null;
  const collectionData = existingCollection
    ? existingCollection
    : (
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
          .select("id, team_id, match_id, type, title, total_amount, status, rounding_step, note, due_date, closed_at, created_by, created_at, updated_at")
          .single()
      ).data;

  if (!collectionData) {
    return fail("Could not create collection", "Không thể tạo collection chia tiền");
  }

  const existingItemsResult = await supabase
    .from("collection_items")
    .select("id, collection_id, membership_id, guest_id, participant_name, amount_due, amount_paid, status, chargeable, note, created_at, updated_at")
    .eq("collection_id", collectionData.id);

  if (existingItemsResult.error) {
    return fail(existingItemsResult.error.message, "Không thể đọc items cũ");
  }

  const existingItems = (existingItemsResult.data ?? []) as DbCollectionItem[];
  const existingByMembership = new Map(existingItems.filter((item) => item.membership_id).map((item) => [item.membership_id as string, item]));

  const payload = includedMembershipIds.map((membershipId, index) => {
    const member = memberById.get(membershipId);
    const participant = participantByMembershipId.get(membershipId);
    const existing = existingByMembership.get(membershipId);
    const amountDue = shares[index] ?? 0;
    const amountPaid = existing ? asNumber(existing.amount_paid) : 0;
    const status: DbCollectionItem["status"] = existing?.status === "waived"
      ? "waived"
      : amountPaid >= amountDue && amountDue > 0
        ? "paid"
        : amountPaid > 0
          ? "partial"
          : "unpaid";

    return {
      collection_id: collectionData.id,
      membership_id: membershipId,
      guest_id: null,
      participant_name:
        participant?.participantName ??
        member?.profile?.fullName ??
        member?.nickname ??
        `Member ${index + 1}`,
      amount_due: amountDue,
      amount_paid: amountPaid,
      status,
      chargeable: true,
      note: existing?.note ?? null,
    };
  });

  const { error: deleteError } = await supabase.from("collection_items").delete().eq("collection_id", collectionData.id);
  if (deleteError) {
    return fail(deleteError.message, "Không thể xoá items cũ");
  }

  if (payload.length) {
    const { error: insertError } = await supabase.from("collection_items").insert(payload);
    if (insertError) {
      return fail(insertError.message, "Không thể tạo items chia tiền");
    }
  }

  const { data: reloadedItems, error: reloadError } = await supabase
    .from("collection_items")
    .select("id, collection_id, membership_id, guest_id, participant_name, amount_due, amount_paid, status, chargeable, note, created_at, updated_at")
    .eq("collection_id", collectionData.id)
    .order("created_at", { ascending: true });

  if (reloadError) {
    return fail(reloadError.message, "Không thể tải lại collection items");
  }

  const response = {
    ...normalizeCollection(collectionData as DbCollection),
    items: ((reloadedItems ?? []) as DbCollectionItem[]).map(normalizeCollectionItem),
  };

  return ok(response, "Đã cập nhật chia tiền");
}
