import type { FormationId, FormationSlot } from "@/features/matches/types";

export const formations: Record<FormationId, { label: string; description: string; slots: FormationSlot[] }> = {
  "2-3-1": {
    label: "2-3-1",
    description: "Cân bằng, kiểm soát tuyến giữa",
    slots: [
      { id: "gk", label: "TM", x: 50, y: 91 },
      { id: "d1", label: "HV", x: 31, y: 72 },
      { id: "d2", label: "HV", x: 69, y: 72 },
      { id: "m1", label: "TV", x: 20, y: 48 },
      { id: "m2", label: "TV", x: 50, y: 50 },
      { id: "m3", label: "TV", x: 80, y: 48 },
      { id: "f1", label: "TĐ", x: 50, y: 23 },
    ],
  },
  "3-2-1": {
    label: "3-2-1",
    description: "Chắc chắn, phòng ngự số đông",
    slots: [
      { id: "gk", label: "TM", x: 50, y: 91 },
      { id: "d1", label: "HV", x: 22, y: 71 },
      { id: "d2", label: "HV", x: 50, y: 75 },
      { id: "d3", label: "HV", x: 78, y: 71 },
      { id: "m1", label: "TV", x: 34, y: 48 },
      { id: "m2", label: "TV", x: 66, y: 48 },
      { id: "f1", label: "TĐ", x: 50, y: 22 },
    ],
  },
  "2-2-2": {
    label: "2-2-2",
    description: "Tấn công, đánh biên nhanh",
    slots: [
      { id: "gk", label: "TM", x: 50, y: 91 },
      { id: "d1", label: "HV", x: 31, y: 72 },
      { id: "d2", label: "HV", x: 69, y: 72 },
      { id: "m1", label: "TV", x: 31, y: 50 },
      { id: "m2", label: "TV", x: 69, y: 50 },
      { id: "f1", label: "TĐ", x: 32, y: 23 },
      { id: "f2", label: "TĐ", x: 68, y: 23 },
    ],
  },
};
