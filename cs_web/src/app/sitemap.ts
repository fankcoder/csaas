import type { MetadataRoute } from "next";

import { blogPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";

const staticRoutes = [
  "",
  "/samples",
  "/guide",
  "/blog",
  "/faq",
  "/pricing",
  "/terms",
  "/privacy",
  "/disclaimer"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route || "/"),
      lastModified: now,
      changeFrequency: route === "/blog" || route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : route === "/blog" ? 0.8 : 0.6
    })),
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75
    }))
  ];
}
