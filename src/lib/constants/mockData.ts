import type { Match } from "@/features/matches/types";
import type { FundTransaction } from "@/features/funds/types";
import type { TeamMember } from "@/features/members/types";
import type { Team } from "@/features/team-profile/types";

export const mockTeam: Team = {
  id: "team-pinkstorm",
  name: "Pinkstorm FC",
  slug: "pinkstorm-fc",
  logoUrl: "/logo-transparent.png",
  area: "Phạm Tu, Hà Đông, Hà Nội",
  homePitch: "Sân Phạm Tu",
  intro:
    "Pinkstorm FC là đội bóng sân 7 phong trào tại Hà Đông, đá đều mỗi tuần với tinh thần Play hard. Sweat victory.",
  memberCount: 13,
  myRole: "captain",
};

export const otherTeams: Team[] = [
  {
    id: "team-office",
    name: "FC Phòng Kinh Doanh",
    slug: "fc-phong-kinh-doanh",
    logoUrl: "/logo-transparent.png",
    area: "Cầu Giấy, Hà Nội",
    homePitch: "Sân Yên Hòa",
    intro: "Đội bóng công ty đang chờ duyệt thành viên.",
    memberCount: 9,
    myRole: "member",
  },
];

export const mockMembers: TeamMember[] = [
  { id: "m1", teamId: mockTeam.id, fullName: "Nguyễn Minh Quân", nickname: "Quân Béo", phone: "0912 345 678", shirtNumber: 10, role: "captain", status: "active", joinedAt: "2021-03-01" },
  { id: "m2", teamId: mockTeam.id, fullName: "Trần Hoàng Long", nickname: "Long Ken", phone: "0987 112 233", shirtNumber: 7, role: "treasurer", status: "active", joinedAt: "2021-03-01" },
  { id: "m3", teamId: mockTeam.id, fullName: "Lê Đức Anh", nickname: "Anh Cò", phone: "0903 556 778", shirtNumber: 4, role: "member", status: "active", joinedAt: "2021-05-14" },
  { id: "m4", teamId: mockTeam.id, fullName: "Phạm Tuấn Kiệt", nickname: "Kiệt Sơ Vin", phone: "0356 889 221", shirtNumber: 8, role: "member", status: "active", joinedAt: "2022-01-08" },
  { id: "m5", teamId: mockTeam.id, fullName: "Đỗ Văn Hùng", nickname: "Hùng Xoăn", phone: "0977 654 321", shirtNumber: 3, role: "member", status: "active", joinedAt: "2021-08-20" },
  { id: "m6", teamId: mockTeam.id, fullName: "Vũ Quang Huy", nickname: "Huy Sún", phone: "0866 223 114", shirtNumber: 11, role: "member", status: "active", joinedAt: "2022-06-02" },
  { id: "m7", teamId: mockTeam.id, fullName: "Bùi Thanh Sơn", nickname: "Sơn Lỳ", phone: "0918 447 556", shirtNumber: 5, role: "member", status: "active", joinedAt: "2021-03-01" },
  { id: "m8", teamId: mockTeam.id, fullName: "Hoàng Nam Trung", nickname: "Trung Bo", phone: "0932 118 909", shirtNumber: 9, role: "member", status: "active", joinedAt: "2023-02-11" },
  { id: "m9", teamId: mockTeam.id, fullName: "Ngô Bảo Khánh", nickname: "Khánh Gà", phone: "0946 335 221", shirtNumber: 1, role: "member", status: "active", joinedAt: "2021-10-30" },
  { id: "m10", teamId: mockTeam.id, fullName: "Dương Chí Thành", nickname: "Thành Tồ", phone: "0983 776 554", shirtNumber: 6, role: "member", status: "active", joinedAt: "2022-09-15" },
  { id: "m11", teamId: mockTeam.id, fullName: "Trịnh Gia Bảo", nickname: "Bảo Mèo", phone: "0362 889 447", shirtNumber: 14, role: "member", status: "active", joinedAt: "2023-07-04" },
  { id: "m12", teamId: mockTeam.id, fullName: "Lý Hải Đăng", nickname: "Đăng Sờ", phone: "0971 224 668", shirtNumber: 17, role: "member", status: "active", joinedAt: "2024-01-19" },
  { id: "m13", teamId: mockTeam.id, fullName: "Cao Việt Dũng", nickname: "Dũng Tây", phone: "0919 003 442", shirtNumber: 21, role: "member", status: "active", joinedAt: "2024-05-06" },
  { id: "m14", teamId: mockTeam.id, fullName: "Phan Anh Tú", nickname: "Tú Híp", phone: "0388 556 991", shirtNumber: 20, role: "member", status: "pending", joinedAt: "2026-08-10" },
];

export const mockTransactions: FundTransaction[] = [
  { id: "t1", teamId: mockTeam.id, type: "income", category: "football", amount: 570000, title: "Thu quỹ trận Thanh Xuân FC", occurredAt: "2026-08-12", createdBy: "m1" },
  { id: "t2", teamId: mockTeam.id, type: "expense", category: "football", amount: 850000, title: "Thanh toán sân Phạm Tu", occurredAt: "2026-08-11", createdBy: "m1" },
  { id: "t3", teamId: mockTeam.id, type: "expense", category: "kit", amount: 2400000, title: "Đặt 16 áo đấu sân khách", occurredAt: "2026-07-20", createdBy: "m1" },
  { id: "t4", teamId: mockTeam.id, type: "income", category: "kit", amount: 1800000, title: "Thu tiền áo", occurredAt: "2026-07-18", createdBy: "m1" },
  { id: "t5", teamId: mockTeam.id, type: "expense", category: "party", amount: 1650000, title: "Liên hoan cuối tháng 7", occurredAt: "2026-07-30", createdBy: "m2" },
];
