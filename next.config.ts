import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // keep the dev badge away from the sidebar's Appearance menu
  devIndicators: { position: "bottom-right" },
  // Before courses, Python lived at the root.
  redirects: async () =>
    [
      "/lesson/:slug",
      "/guide",
      "/guide/:chapter",
      "/playground",
      "/run/:id",
    ].map((source) => ({
      source,
      destination: `/python${source}`,
      permanent: true,
    })),
}

export default nextConfig
