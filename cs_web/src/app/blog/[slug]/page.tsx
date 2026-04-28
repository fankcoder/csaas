import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Notice, PageBody, PageHero, Panel } from "@/components/FVPage";
import { blogPosts, getBlogPost } from "@/lib/blog";
import { absoluteUrl, siteName } from "@/lib/seo";

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) {
    return {};
  }
  return {
    title: `${post.title} | FloatVia Guides`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: absoluteUrl(`/blog/${post.slug}`)
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${post.slug}`),
      siteName,
      type: "article",
      publishedTime: post.updatedAt
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description
    }
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPost(params.slug);
  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    dateModified: post.updatedAt,
    keywords: post.keywords.join(", ")
  };

  return (
    <main className="bg-[#050711] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero eyebrow={post.tag} title={post.title} description={post.description} />
      <PageBody className="max-w-4xl">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-lime-200" href="/blog">
          <ArrowLeft className="h-4 w-4" />
          Back to guides
        </Link>
        <Panel className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="eyebrow">{post.tag}</div>
            <time className="text-xs text-slate-500" dateTime={post.updatedAt}>
              Updated {post.updatedAt}
            </time>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {post.keywords.map((keyword) => (
              <span key={keyword} className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-xs font-medium text-slate-300">
                {keyword}
              </span>
            ))}
          </div>
          <div className="mt-8 space-y-8">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold text-white">{section.heading}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{section.body}</p>
              </section>
            ))}
          </div>
          {post.references?.length ? (
            <section className="mt-8 rounded-lg border border-white/10 bg-[#050711] p-4">
              <h2 className="text-sm font-semibold text-white">References</h2>
              <div className="mt-3 space-y-2">
                {post.references.map((reference) => (
                  <a
                    className="block text-sm font-medium text-lime-200 hover:text-lime-100"
                    href={reference.href}
                    key={reference.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {reference.label}
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </Panel>
        <Notice title="Risk boundary" tone="warning">
          FloatVia provides data analysis only. It does not guarantee profit, custody assets, place orders or automate trades.
        </Notice>
      </PageBody>
    </main>
  );
}
