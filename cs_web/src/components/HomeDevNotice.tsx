"use client";

import { X } from "lucide-react";
import { useState } from "react";

export function HomeDevNotice() {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div
      aria-labelledby="home-dev-notice-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 px-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-lime-300/25 bg-[#0b1020] p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
        <button
          aria-label="Close development notice"
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          onClick={() => setOpen(false)}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-4 inline-flex rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-sm font-semibold text-lime-100">
          Development Notice
        </div>
        <h2 id="home-dev-notice-title" className="pr-10 text-2xl font-semibold">
          FloatVia is in active testing.
        </h2>
        <p className="mt-4 leading-7 text-slate-200">
          This website is currently under development and testing. To receive first-hand updates, please contact{" "}
          <a className="font-semibold text-lime-200 hover:text-lime-100" href="mailto:fankcoder@gmail.com">
            fankcoder@gmail.com
          </a>
          .
        </p>
        <button
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-lime-300 px-5 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-lime-200"
          onClick={() => setOpen(false)}
          type="button"
        >
          I understand
        </button>
      </div>
    </div>
  );
}
