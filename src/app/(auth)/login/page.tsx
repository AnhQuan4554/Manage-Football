import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="main" style={{ maxWidth: 440 }}>
      <section className="surface" style={{ padding: 22 }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <Image src="/logo-transparent.png" alt="Pinkstorm FC" width={96} height={96} className="brand-logo" style={{ width: 96, height: 96 }} />
          <h1>Pinkstorm FC</h1>
          <p className="muted">Đăng nhập để quản lý đội bóng sân 7.</p>
        </div>
        <label>Email</label>
        <input className="field" placeholder="captain@pinkstorm.vn" />
        <label>Mật khẩu</label>
        <input className="field" type="password" placeholder="••••••••" />
        <Link className="primary-action" href="/dashboard">Đăng nhập</Link>
        <Link className="secondary-action" href="/register">Tạo tài khoản</Link>
      </section>
    </main>
  );
}
