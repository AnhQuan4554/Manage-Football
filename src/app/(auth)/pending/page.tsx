import Link from "next/link";

export default function PendingPage() {
  return (
    <main className="main">
      <section className="surface" style={{ padding: 28, textAlign: "center" }}>
        <h1>Đang chờ đội trưởng duyệt</h1>
        <p className="muted">Bạn đã gửi yêu cầu tham gia Pinkstorm FC. Khi được duyệt, dashboard sẽ mở tự động.</p>
        <Link className="secondary-action" href="/login">Quay lại đăng nhập</Link>
      </section>
    </main>
  );
}
