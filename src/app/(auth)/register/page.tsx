import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="main" style={{ maxWidth: 460 }}>
      <section className="surface" style={{ padding: 22 }}>
        <h1>Đăng ký thành viên</h1>
        <p className="muted">Thành viên tự đăng ký, đội trưởng duyệt trước khi vào đội.</p>
        <label>Họ tên</label>
        <input className="field" />
        <label>Biệt danh</label>
        <input className="field" />
        <label>Số điện thoại</label>
        <input className="field" />
        <label>Email</label>
        <input className="field" />
        <Link className="primary-action" href="/pending">Gửi yêu cầu vào đội</Link>
      </section>
    </main>
  );
}
