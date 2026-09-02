import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Roboto } from "next/font/google";
import "antd/dist/reset.css";
import "@/styles/globals.css";
import { Providers } from "@/app/providers";
import { uiColors } from "@/lib/constants/colors";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pinkstorm FC Manager",
  description: "PWA quản lý đội bóng sân 7 Pinkstorm FC.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: uiColors.brand.primary,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={roboto.variable} suppressHydrationWarning>
        <Script
          id="hydration-extension-cleanup"
          strategy="beforeInteractive"
          data-hydration-extension-cleanup
          dangerouslySetInnerHTML={{
            __html:
              "(function(){function clean(){document.querySelectorAll('[fdprocessedid]').forEach(function(el){el.removeAttribute('fdprocessedid')})}clean();new MutationObserver(clean).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['fdprocessedid']})})();",
          }}
        />
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
