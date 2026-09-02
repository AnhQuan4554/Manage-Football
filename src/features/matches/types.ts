export type MatchStatus = "scheduled" | "completed" | "cancelled";
export type AttendanceStatus = "going" | "absent" | "maybe" | "unknown";
export type ZaloVoteStatus = "none" | "created" | "error";
export type FormationId = "2-3-1" | "3-2-1" | "2-2-2";

export type Match = {
  id: string;
  teamId: string;
  opponentName: string;
  opponentPhone: string;
  date: string;
  time: string;
  pitch: string;
  address: string;
  pitchCost: number;
  opponentFee: number;
  note: string;
  status: MatchStatus;
  zaloVoteStatus: ZaloVoteStatus;
  formation: FormationId;
  attendance: Record<string, AttendanceStatus>;
  lineup: Record<string, string | null>;
  paymentSummary?: {
    totalAmount: number;
    dueAmount: number;
    paidAmount: number;
    chargeableCount: number;
    paidCount: number;
    isFullyPaid: boolean;
  };
};

export type FormationSlot = {
  id: string;
  label: string;
  x: number;
  y: number;
};
