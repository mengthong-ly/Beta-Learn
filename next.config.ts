import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // keep the dev badge away from the sidebar's Appearance menu
  devIndicators: { position: "bottom-right" },
}

export default nextConfig
