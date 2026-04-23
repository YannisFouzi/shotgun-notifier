import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.36"],
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default withSentryConfig(nextConfig, {
  org: "fouzi-dev",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
});
