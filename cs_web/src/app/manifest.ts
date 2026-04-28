import type { MetadataRoute } from "next";

import { defaultDescription, siteName } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} - CS2 Skin Arbitrage Analytics`,
    short_name: siteName,
    description: defaultDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050711",
    theme_color: "#bef264",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "32x17",
        type: "image/x-icon",
        purpose: "any"
      },
      {
        src: "/big-logo.png",
        sizes: "449x287",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
