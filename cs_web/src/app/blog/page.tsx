import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { PageBody, PageHero, Panel } from "@/components/FVPage";
import { blogPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "CS2 Skin Arbitrage Guides",
  description:
    "Guides for BUFF, Waxpeer, Steam restrictions, fee calculation, liquidity filters and CS2 skin arbitrage risk.",
  keywords: [
    "CS2 skin arbitrage",
    "BUFF guide",
    "Waxpeer guide",
    "Steam trade restrictions",
    "CS2 skin fees",
    "arbitrage risk"
  ],
  alternates: {
    canonical: absoluteUrl("/blog")
  }
};

const seoTopics = ["BUFF", "Waxpeer", "Steam limits", "Fees", "Liquidity", "Risk"];

export default function BlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "FloatVia CS2 skin market playbooks",
    description: metadata.description,
    url: absoluteUrl("/blog"),
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${post.slug}`),
      dateModified: post.updatedAt,
      keywords: post.keywords.join(", ")
    }))
  };

  return (
    <main className="bg-[#050711] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow="Blog"
        title="CS2 skin market playbooks"
        description="Evergreen guides for traders comparing Chinese liquidity with global exit routes. Built for SEO, onboarding and better execution discipline."
      >
        <Panel className="p-4">
          <div className="text-sm font-semibold text-white">SEO topics</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {seoTopics.map((topic) => (
              <span key={topic} className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-xs font-medium text-slate-300">
                {topic}
              </span>
            ))}
          </div>
        </Panel>
      </PageHero>

      <PageBody>
        <div className="grid gap-4 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Panel as="article" className="p-5 hover:border-lime-300/35" key={post.slug}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-lime-200">{post.tag}</div>
                <time className="text-xs text-slate-500" dateTime={post.updatedAt}>
                  {post.updatedAt}
                </time>
              </div>
              <h2 className="mt-3 text-lg font-semibold leading-7 text-white">{post.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{post.description}</p>
              <div className="mt-4 space-y-2">
                {post.keywords.slice(0, 3).map((keyword) => (
                  <div key={keyword} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-200" />
                    <span>{keyword}</span>
                  </div>
                ))}
              </div>
              <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-lime-200" href={`/blog/${post.slug}`}>
                Read guide
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Panel>
          ))}
        </div>
      </PageBody>
    </main>
  );
}
