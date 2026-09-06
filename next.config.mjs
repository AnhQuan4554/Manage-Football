import withPWAInit from "next-pwa";
import defaultCache from "next-pwa/cache.js";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheStartUrl: false,
  dynamicStartUrl: false,
  importScripts: ["/push-worker.js"],
  runtimeCaching: [
    {
      // Fetch current HTML, RSC and API data after edits, deletions and team switches.
      urlPattern: ({ request, url, sameOrigin }) =>
        sameOrigin &&
        (request.mode === "navigate" ||
          request.headers.get("RSC") === "1" ||
          url.searchParams.has("_rsc") ||
          url.pathname.startsWith("/api/") ||
          url.pathname.startsWith("/_next/data/")),
      handler: "NetworkOnly",
    },
    ...defaultCache,
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return ["/push-worker.js", "/sw.js"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
    }));
  },
};

export default withPWA(nextConfig);
