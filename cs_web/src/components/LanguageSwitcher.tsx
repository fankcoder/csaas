"use client";

import { Globe2 } from "lucide-react";

import { locales, useI18n, type Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2 py-2 text-sm text-slate-200">
      <Globe2 className="h-4 w-4 text-lime-200" />
      <span className="sr-only">{t("nav.language")}</span>
      <select
        aria-label={t("nav.language")}
        className="bg-transparent text-sm font-medium text-white outline-none"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {locales.map((option) => (
          <option className="bg-slate-950 text-white" key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
