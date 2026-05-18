import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Explicitly set the Turbopack workspace root to this sub-project directory,
    // preventing the false-positive "multiple lockfiles" warning caused by the
    // monorepo root package-lock.json being detected.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
