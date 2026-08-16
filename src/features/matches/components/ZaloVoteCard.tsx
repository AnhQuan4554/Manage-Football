import { Button, Card, Space, Tag } from "antd";
import { MessageOutlined, ReloadOutlined } from "@ant-design/icons";
import type { Match } from "@/features/matches/types";

export function ZaloVoteCard({ match }: { match: Match }) {
  const created = match.zaloVoteStatus === "created";

  return (
    <Card className="surface">
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Space style={{ justifyContent: "space-between", width: "100%" }}>
          <strong>Bình chọn Zalo</strong>
          <Tag color={created ? "success" : match.zaloVoteStatus === "error" ? "error" : "default"}>
            {created ? "Đã tạo" : match.zaloVoteStatus === "error" ? "Lỗi" : "Chưa tạo"}
          </Tag>
        </Space>
        <p className="muted" style={{ margin: 0 }}>
          {match.opponentName} - chọn Tham gia, Không tham gia hoặc Chưa chắc.
        </p>
        <Space wrap>
          <Tag color="green">Tham gia</Tag>
          <Tag color="red">Không tham gia</Tag>
          <Tag color="gold">Chưa chắc</Tag>
        </Space>
        <Button type={created ? "default" : "primary"} icon={created ? <MessageOutlined /> : <ReloadOutlined />}>
          {created ? "Mở trong Zalo" : "Tạo bình chọn Zalo"}
        </Button>
      </Space>
    </Card>
  );
}
