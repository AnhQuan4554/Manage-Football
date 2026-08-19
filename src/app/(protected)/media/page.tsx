import { Button, Card, Col, Row, Tag } from "antd";
import { PictureOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { uiColors } from "@/lib/constants/colors";

const media = [
  ["Đội hình xuất phát vs Thanh Xuân FC", "photo", "wide"],
  ["Bàn thắng của Trung Bo", "video", "tall"],
  ["Áo đấu mùa 2026", "photo", "normal"],
  ["Liên hoan cuối tháng 7", "photo", "normal"],
  ["Highlight thắng Văn Quán 6-2", "video", "wide"],
  ["Khởi động trước trận", "photo", "normal"],
] as const;

export default function MediaPage() {
  return (
    <div className="page-stack">
      <PageHeader title="Media" subtitle="Một nơi cho ảnh và video của đội." />
      <Button type="primary" block>Tải ảnh/video lên</Button>
      <Row gutter={[12, 12]}>
        {media.map(([title, kind], index) => (
          <Col xs={kind === "video" ? 24 : 12} md={8} key={title}>
            <Card className="surface" style={{ minHeight: kind === "video" ? 180 : 140 }}>
              <div style={{ color: uiColors.brand.primary, fontSize: 28 }}>{kind === "video" ? <VideoCameraOutlined /> : <PictureOutlined />}</div>
              <strong>{title}</strong>
              <div><Tag color="magenta">{kind === "video" ? "Video" : "Ảnh"}</Tag><Tag>2026-08-{10 + index}</Tag></div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
