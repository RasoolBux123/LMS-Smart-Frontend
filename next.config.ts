import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  /*
   * A stray package.json + lockfile sits one level up in the merged repo,
   * so Next inferred the wrong workspace root and warned on every build.
   * Pinning it to this directory silences that and keeps module resolution
   * anchored to the frontend.
   */
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
