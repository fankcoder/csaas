import type { MetadataRoute } from "next";

import { blogPosts } from "@/lib/blog";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

const staticRoutes = [
  "",
  "/arbitrage",
  "/samples",
  "/tools/cost-simulator",
  "/blog",
  "/faq",
  "/status",
  "/pricing",
  "/terms",
  "/privacy",
  "/disclaimer"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: route === "/blog" || route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : route === "/blog" ? 0.8 : 0.6
    })),
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75
    }))
  ];
}
