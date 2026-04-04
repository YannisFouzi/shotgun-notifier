import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.36"],
};

export default withSentryConfig(nextConfig, {
  org: "fouzi-dev",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
});
