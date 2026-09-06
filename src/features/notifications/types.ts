export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushDeviceStatus = {
  memberName: string;
  captain: boolean;
  enabled: boolean;
};

export type PushKind = "new_match" | "match_today" | "create_match";

export type PushMatch = {
  id: string;
  team_id: string;
  opponent_name: string;
  match_date_time: string;
  venue_name: string;
  status: string;
};
