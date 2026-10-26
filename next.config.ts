import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app-link files phones fetch to let email links open the SchoolMule app
  // (schoolmule-mobile docs/LINKS.md). Apple's file has no extension, so it
  // needs its JSON type set here.
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default nextConfig;
