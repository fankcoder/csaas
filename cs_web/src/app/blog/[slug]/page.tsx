import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { blogPosts, getBlogPost } from "@/lib/blog";

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
    title: `${post.title} | CS2 饰品套利教程`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.updatedAt
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
    dateModified: post.updatedAt,
    keywords: post.keywords.join(", ")
  };

  return (
    <main className="bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link className="text-sm font-semibold text-blue-800" href="/blog">
          返回教程列表
        </Link>
        <div className="section-panel mt-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="eyebrow">{post.tag}</div>
            <time className="text-xs text-slate-500" dateTime={post.updatedAt}>
              更新于 {post.updatedAt}
            </time>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">{post.title}</h1>
          <p className="mt-3 muted-copy">{post.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {post.keywords.map((keyword) => (
              <span key={keyword} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {keyword}
              </span>
            ))}
          </div>
          <div className="mt-8 space-y-7">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold text-slate-950">{section.heading}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{section.body}</p>
              </section>
            ))}
          </div>
          {post.references?.length ? (
            <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-sm font-semibold text-slate-950">参考资料</h2>
              <div className="mt-3 space-y-2">
                {post.references.map((reference) => (
                  <a
                    className="block text-sm font-medium text-blue-800 hover:text-blue-700"
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
          <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            风险提示：本平台只提供数据分析，不保证收益，不托管资产，不自动交易。任何交易执行和资金操作均由用户自行判断并承担风险。
          </p>
        </div>
      </article>
    </main>
  );
}
