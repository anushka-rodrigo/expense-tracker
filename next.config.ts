import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Never cache calls to Supabase: always fresh data, and auth stays correct
        urlPattern: ({ url }: { url: URL }) => url.hostname.endsWith("supabase.co"),
        handler: "NetworkOnly",
      },
      {
        // Pages: try the network first, fall back to the last cached copy if offline
        urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 6,
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        // JS and CSS: fine to use a cached copy while checking for a newer one
        urlPattern: ({ request }: { request: Request }) =>
          ["style", "script", "worker"].includes(request.destination),
        handler: "StaleWhileRevalidate",
        options: { cacheName: "assets" },
      },
      {
        // Images and icons: safe to cache for a while, they rarely change
        urlPattern: ({ request }: { request: Request }) => request.destination === "image",
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);