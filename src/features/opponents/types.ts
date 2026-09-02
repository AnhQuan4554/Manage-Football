export type Opponent = {
  id: string;
  teamId: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  note: string | null;
  lastPlayedAt: string | null;
  createdAt: string;
  updatedAt: string;
  matchCount: number;
};

export type CreateOpponentInput = {
  name: string;
  contactName?: string;
  phone?: string;
  note?: string;
};
