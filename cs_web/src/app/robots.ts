import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/profile",
        "/favorites",
        "/reports",
        "/login",
        "/billing/",
        "/steam/callback",
        "/onboarding"
      ]
    },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
