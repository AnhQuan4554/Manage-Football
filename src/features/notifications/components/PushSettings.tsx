"use client";

import { useEffect, useState } from "react";
import { Button } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { LogoLoading } from "@/components/common/LogoLoading";
import type { AppResponse } from "@/lib/response";
import type { PushDeviceStatus } from "../types";

const storageKey = "pinkstorm.push.device.v1";

function newToken() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function keyBytes(key: string) {
  const raw = atob(
    key.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (key.length % 4)) % 4),
  );
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function api<T>(path: string, token?: string, body?: unknown): Promise<T> {
  const response = await fetch("/api/notifications/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const result = (await response.json()) as AppResponse<T>;
  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.error || "Không kết nối được máy chủ thông báo.");
  }
  return result.data;
}

export function PushSettings() {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const [installNeeded, setInstallNeeded] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [token, setToken] = useState("");
  const [invite, setInvite] = useState("");
  const [device, setDevice] = useState<PushDeviceStatus | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstallNeeded(ios && !standalone);
    setSupported(
      window.isSecureContext &&
        "Notification" in window &&
        "PushManager" in window &&
        "serviceWorker" in navigator,
    );
    if ("Notification" in window) setPermission(Notification.permission);
    void (async () => {
      try {
        let saved = localStorage.getItem(storageKey);
        if (!saved) {
          saved = newToken();
          localStorage.setItem(storageKey, saved);
        }
        if (active) setToken(saved);
        const config = await api<{ enabled: boolean; publicKey: string | null }>("config");
        if (!active) return;
        if (config.enabled && config.publicKey) {
          setPublicKey(config.publicKey);
          // Unpaired devices are expected; do not display an initial authentication error.
          const response = await fetch("/api/notifications/device", {
            headers: { Authorization: "Bearer " + saved },
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          });
          const result = (await response.json()) as AppResponse<PushDeviceStatus>;
          if (active && result.success && result.data) setDevice(result.data);
          else if (active && response.status !== 401)
            setError(result.error || "Chưa kiểm tra được thiết bị.");
        }
      } catch {
        if (active)
          setError(
            "Chưa khởi tạo được thông báo. Kiểm tra kết nối và cho phép lưu dữ liệu trình duyệt.",
          );
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function perform(action: "subscribe" | "disable" | "test") {
    if (busy) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (action === "subscribe") {
        // Permission must be requested directly in the user's tap handler (especially iOS).
        const granted = await Notification.requestPermission();
        setPermission(granted);
        if (granted !== "granted")
          throw new Error(
            "Chưa được cấp quyền. Hãy cho phép thông báo trong Cài đặt của điện thoại.",
          );
        const registration = await navigator.serviceWorker.getRegistration("/");
        if (!registration?.active)
          throw new Error("PWA chưa sẵn sàng. Mở lại app sau khi bản mới được triển khai.");
        await registration.update();
        const existing = await registration.pushManager.getSubscription();
        const subscription =
          existing ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyBytes(publicKey),
          }));
        const updated = await api<PushDeviceStatus>("device", token, {
          action,
          subscription: subscription.toJSON(),
          invite: device ? undefined : invite.trim(),
        });
        setDevice(updated);
        setInvite("");
        setNotice("Đã bật thông báo trên thiết bị này. Bạn có thể gửi thử bên dưới.");
      } else if (action === "disable") {
        // Revoke server delivery first; keep capability so re-enabling needs no new invitation.
        await api("device", token, { action });
        setDevice((current) => (current ? { ...current, enabled: false } : null));
        const registration = await navigator.serviceWorker.getRegistration("/");
        await (await registration?.pushManager.getSubscription())?.unsubscribe();
        setNotice("Đã tắt thông báo trên thiết bị này.");
      } else {
        await api("device", token, { action });
        setNotice("Dịch vụ Push đã nhận thông báo thử. Kiểm tra thông báo trên điện thoại.");
      }
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : "Chưa thực hiện được. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }

  const canEnable =
    ready &&
    supported &&
    !installNeeded &&
    Boolean(publicKey) &&
    Boolean(token) &&
    Boolean(device || invite.trim()) &&
    permission !== "denied";

  return (
    <section className="surface push-settings" aria-labelledby="push-settings-title">
      <h2 id="push-settings-title">
        <BellOutlined aria-hidden /> Thông báo trên điện thoại
      </h2>
      <p>
        Nhận lịch trận mới và nhắc lịch đá lúc 17h thứ Ba. Đội trưởng nhận thêm nhắc tạo trận lúc
        17h thứ Bảy nếu tuần tới chưa có trận.
      </p>
      {(!ready || busy) && (
        <LogoLoading
          size="sm"
          label={busy ? "Đang xử lý thông báo..." : "Đang kiểm tra thiết bị..."}
        />
      )}
      {ready && !publicKey && (
        <p className="push-settings-hint">
          Máy chủ chưa bật thông báo. Cần hoàn tất cấu hình và triển khai bản PWA mới.
        </p>
      )}
      {installNeeded && (
        <div className="push-settings-hint">
          Trên iPhone: mở web bằng Safari → Chia sẻ → Thêm vào Màn hình chính. Sau đó mở app từ biểu
          tượng và nhập mã kích hoạt tại đây.
        </div>
      )}
      {ready && !supported && !installNeeded && (
        <p>
          Trình duyệt này chưa hỗ trợ Web Push. Hãy dùng Safari trên iPhone đã cài app hoặc Chrome
          trên Android.
        </p>
      )}
      {permission === "denied" && (
        <p role="alert">
          Thông báo đang bị chặn. Vào Cài đặt → Thông báo → Pinkstorm FC và bật Cho phép thông báo.
        </p>
      )}
      {device ? (
        <p>
          Thiết bị của <strong>{device.memberName}</strong>
          {device.captain ? " · Đội trưởng" : ""}
          {" · "}
          {device.enabled && permission === "granted" ? "Đã bật" : "Chưa bật"}
        </p>
      ) : (
        <label className="push-settings-label">
          Mã kích hoạt riêng
          <input
            className="field"
            value={invite}
            onChange={(event) => setInvite(event.target.value)}
            placeholder="Dán mã quản trị gửi riêng cho bạn"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={busy}
            maxLength={100}
          />
          <span>Mỗi mã dùng một lần cho một thiết bị. Không gửi mã của bạn vào nhóm chung.</span>
        </label>
      )}
      <div className="push-settings-actions">
        <Button
          type="primary"
          disabled={busy || !canEnable}
          onClick={() => void perform("subscribe")}
        >
          {device?.enabled ? "Kiểm tra / bật lại" : "Bật thông báo"}
        </Button>
        <Button
          disabled={busy || !device?.enabled || permission !== "granted"}
          onClick={() => void perform("test")}
        >
          Gửi thử
        </Button>
        {device?.enabled && (
          <Button disabled={busy} onClick={() => void perform("disable")}>
            Tắt trên máy này
          </Button>
        )}
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p className="push-settings-error" role="alert">
          {error}
        </p>
      )}
      <p className="push-settings-footnote">
        Chỉ thiết bị đã cho phép mới nhận được thông báo. Chế độ Tập trung hoặc mất mạng có thể làm
        thông báo đến muộn.
      </p>
    </section>
  );
}
