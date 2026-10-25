import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Likely guesses at website URLs land on the real pages.
  async redirects() {
    return [
      { source: '/features', destination: '/product', permanent: true },
      { source: '/book-a-demo', destination: '/demo', permanent: true },
      { source: '/for', destination: '/product', permanent: false },
      { source: '/islamic-schools', destination: '/for/islamic-schools', permanent: true },
    ];
  },
};

export default nextConfig;
