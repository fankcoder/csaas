import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { blogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "CS2 饰品套利教程 | BUFF、Waxpeer、手续费与风险控制",
  description:
    "学习 CS2 饰品套利的数据分析方法，覆盖 BUFF 教程、Waxpeer 教程、Steam 交易限制、手续费计算、销量过滤和套利风险。",
  keywords: [
    "CS2 饰品套利",
    "BUFF 教程",
    "Waxpeer 教程",
    "Steam 交易限制",
    "CS2 手续费计算",
    "饰品套利风险"
  ]
};

const seoTopics = [
  "CS2 饰品套利",
  "BUFF 教程",
  "Waxpeer 教程",
  "Steam 交易限制",
  "手续费计算",
  "套利风险"
];

export default function BlogPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <div>
            <div className="eyebrow">Blog</div>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal text-slate-950">
              CS2 饰品套利教程与市场知识
            </h1>
            <p className="mt-3 max-w-3xl muted-copy">
              这里沉淀新手教程、平台开通流程、价格计算逻辑和风险控制内容。文章用于用户教育和 SEO 获客，帮助新用户先理解规则，再使用数据工具。
            </p>
          </div>
          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-950">SEO Topics</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {seoTopics.map((topic) => (
                <span key={topic} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600">
                  {topic}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article key={post.slug} className="data-card">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-blue-800">{post.tag}</div>
                <time className="text-xs text-slate-500" dateTime={post.updatedAt}>
                  {post.updatedAt}
                </time>
              </div>
              <h2 className="mt-2 text-lg font-semibold leading-7 text-slate-950">{post.title}</h2>
              <p className="mt-3 muted-copy">{post.description}</p>
              <div className="mt-4 space-y-2">
                {post.keywords.slice(0, 3).map((keyword) => (
                  <div key={keyword} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-800" />
                    <span>{keyword}</span>
                  </div>
                ))}
              </div>
              <Link
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950"
                href={`/blog/${post.slug}`}
              >
                阅读教程
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
