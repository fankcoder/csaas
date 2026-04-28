import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
};

type PanelProps = {
  children: ReactNode;
  className?: string;
  as?: "section" | "article" | "div";
};

type MetricTileProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "lime" | "cyan" | "rose" | "slate";
};

type NoticeProps = {
  title?: string;
  children: ReactNode;
  tone?: "info" | "warning" | "danger";
  actions?: ReactNode;
};

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageHero({ eyebrow, title, description, actions, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#050711]">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="market-grid absolute inset-0 opacity-55" />
        <div className="absolute left-[10%] top-12 h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_22px_rgba(190,242,100,0.9)]" />
        <div className="absolute right-[16%] top-20 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(103,232,249,0.9)]" />
        <div className="route-line route-line-a opacity-45" />
      </div>
      <div
        className={cx(
          "relative mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8",
          children ? "lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end" : ""
        )}
      >
        <div className="max-w-4xl">
          <div className="inline-flex items-center rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1.5 text-sm font-semibold text-lime-100">
            {eyebrow}
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">{description}</p>
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("app-page space-y-6", className)}>{children}</section>;
}

export function Panel({ children, className, as = "section" }: PanelProps) {
  const Component = as;
  return (
    <Component
      className={cx(
        "rounded-lg border border-white/10 bg-white/[0.045] shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur transition-colors duration-150",
        className
      )}
    >
      {children}
    </Component>
  );
}

export function MetricTile({ label, value, detail, tone = "lime" }: MetricTileProps) {
  const toneClass = {
    lime: "text-lime-200",
    cyan: "text-cyan-200",
    rose: "text-rose-200",
    slate: "text-white"
  }[tone];

  return (
    <Panel className="p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className={cx("mt-1 font-mono-display text-2xl font-semibold", toneClass)}>{value}</div>
      {detail ? <div className="mt-2 text-xs leading-5 text-slate-500">{detail}</div> : null}
    </Panel>
  );
}

export function Notice({ title, children, tone = "info", actions }: NoticeProps) {
  const toneClass = {
    info: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    warning: "border-lime-300/20 bg-lime-300/10 text-lime-100",
    danger: "border-rose-300/25 bg-rose-300/10 text-rose-100"
  }[tone];

  return (
    <div className={cx("rounded-lg border p-4", toneClass)}>
      {title ? <div className="font-semibold">{title}</div> : null}
      <div className={cx("text-sm leading-6", title ? "mt-1" : "")}>{children}</div>
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="px-4 py-12 text-center">
      <div className="font-semibold text-slate-200">{title}</div>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
