"use client";

import { Cookie, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n";

const CONSENT_KEY = "cs2_cookie_consent_v1";

type ConsentValue = {
  accepted: "all" | "essential";
  acceptedAt: string;
};

function saveConsent(accepted: ConsentValue["accepted"]) {
  const payload: ConsentValue = {
    accepted,
    acceptedAt: new Date().toISOString()
  };
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    setVisible(!window.localStorage.getItem(CONSENT_KEY));
  }, []);

  if (!visible) {
    return null;
  }

  function accept(accepted: ConsentValue["accepted"]) {
    saveConsent(accepted);
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-800">
            <Cookie className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              {t("cookie.title")}
              <ShieldCheck className="h-4 w-4 text-blue-800" />
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              {t("cookie.bodyStart")}{" "}
              <span className="font-semibold text-slate-900">{t("cookie.acceptAll")}</span>{" "}
              {t("cookie.bodyMiddle")}
              <Link className="ml-1 font-semibold text-blue-800 hover:text-blue-700" href="/privacy">
                {t("cookie.privacy")}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button className="btn-primary justify-center" onClick={() => accept("all")}>
            {t("cookie.acceptAll")}
          </button>
          <button className="btn-secondary justify-center" onClick={() => accept("essential")}>
            {t("cookie.essential")}
          </button>
          <button
            aria-label={t("cookie.close")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => accept("essential")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
