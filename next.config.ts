import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

// Read version from version.json (bumped by scripts/bump-version.js on each build)
const versionData = JSON.parse(
  readFileSync(join(__dirname, "version.json"), "utf-8")
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "**" },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: versionData.version,
    NEXT_PUBLIC_BUILD_NUMBER: String(versionData.build ?? 0),
  },
};

export default nextConfig;
