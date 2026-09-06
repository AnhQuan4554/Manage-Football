import type { Metadata } from "next";
import Link from "next/link";
import { PushSettings } from "@/features/notifications/components/PushSettings";

export const metadata: Metadata = {
  title: "Bật thông báo · Pinkstorm FC",
  robots: { index: false, follow: false },
};

// Intentionally outside prototype protected routes: pairing does not require login.
export default function NotificationsPage() {
  return (
    <main className="push-page">
      <Link href="/dashboard">← Về trang chủ</Link>
      <PushSettings />
    </main>
  );
}
