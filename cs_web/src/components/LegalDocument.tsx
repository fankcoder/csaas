import type { ReactNode } from "react";

type LegalSection = {
  title: string;
  body: ReactNode;
};

type LegalDocumentProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
};

export function LegalDocument({ eyebrow, title, description, updatedAt, sections }: LegalDocumentProps) {
  return (
    <main className="bg-slate-50">
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="section-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="eyebrow">{eyebrow}</div>
            <time className="text-xs text-slate-500" dateTime={updatedAt}>
              updatedAt {updatedAt}
            </time>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">{title}</h1>
          <p className="mt-3 muted-copy">{description}</p>
          <div className="mt-8 space-y-7">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
                <div className="mt-2 text-sm leading-7 text-slate-600">{section.body}</div>
              </section>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
