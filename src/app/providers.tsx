"use client";

import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import type { ReactNode } from "react";
import { uiColors } from "@/lib/constants/colors";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: uiColors.brand.primary,
          colorInfo: uiColors.brand.primary,
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
