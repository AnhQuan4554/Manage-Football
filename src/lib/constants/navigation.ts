import {
  CalendarOutlined,
  HomeOutlined,
  PictureOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
  WalletOutlined,
} from "@ant-design/icons";

export const bottomTabs = [
  { href: "/dashboard", label: "Trang chủ", icon: HomeOutlined },
  { href: "/matches", label: "Lịch đá", icon: CalendarOutlined },
  { href: "/lineup", label: "Đội hình", icon: TrophyOutlined },
  { href: "/funds", label: "Quỹ", icon: WalletOutlined },
  { href: "/team", label: "Đội", icon: TeamOutlined },
];

export const moreLinks = [
  { href: "/members", label: "Thành viên", icon: UsergroupAddOutlined },
  { href: "/media", label: "Media", icon: PictureOutlined },
  { href: "/settings", label: "Cài đặt", icon: SettingOutlined },
];
