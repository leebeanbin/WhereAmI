import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
        handler: "CacheFirst",
        options: { cacheName: "cdn-fonts", expiration: { maxEntries: 10, maxAgeSeconds: 30 * 24 * 60 * 60 } },
      },
      {
        urlPattern: /^https:\/\/unpkg\.com\/.*/i,
        handler: "CacheFirst",
        options: { cacheName: "unpkg-cache", expiration: { maxEntries: 10, maxAgeSeconds: 7 * 24 * 60 * 60 } },
      },
      {
        urlPattern: /\/icons\//,
        handler: "CacheFirst",
        options: { cacheName: "app-icons", expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 } },
      },
      {
        urlPattern: /\/api\/place/,
        handler: "NetworkFirst",
        options: { cacheName: "place-api", expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 }, networkTimeoutSeconds: 5 },
      },
      {
        urlPattern: /\/api\/(geocode|stations)/,
        handler: "NetworkFirst",
        options: { cacheName: "map-api", expiration: { maxEntries: 30, maxAgeSeconds: 60 }, networkTimeoutSeconds: 5 },
      },
    ],
    navigateFallback: "/offline.html",
  },
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
