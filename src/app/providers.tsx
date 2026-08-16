"use client";

import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#d41478",
          colorInfo: "#d41478",
          borderRadius: 12,
          fontFamily: "inherit",
        },
        components: {
          Button: { controlHeight: 42, borderRadius: 12 },
          Card: { borderRadiusLG: 18 },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
