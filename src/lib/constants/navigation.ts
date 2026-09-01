import {
  BarChartOutlined,
  CalendarOutlined,
  HomeOutlined,
  PictureOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
  WalletOutlined,
  TeamOutlined as OpponentOutlined,
} from "@ant-design/icons";

export const bottomTabs = [
  { href: "/dashboard", label: "Trang chủ", icon: HomeOutlined },
  { href: "/matches", label: "Lịch đá", icon: CalendarOutlined },
  { href: "/opponents", label: "Đối thủ", icon: OpponentOutlined },
  { href: "/statistics", label: "Thống kê", icon: BarChartOutlined },
  { href: "/team", label: "Đội", icon: TeamOutlined },
];

export const moreLinks = [
  { href: "/funds", label: "Quỹ", icon: WalletOutlined },
  { href: "/members", label: "Thành viên", icon: UsergroupAddOutlined },
  { href: "/lineup", label: "Đội hình", icon: TrophyOutlined },
  { href: "/media", label: "Media", icon: PictureOutlined },
  { href: "/settings", label: "Cài đặt", icon: SettingOutlined },
];
