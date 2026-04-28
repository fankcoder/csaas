"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import { storeAuth, type StoredUser } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function SteamCallbackPage() {
  const { t } = useI18n();
  const tRef = useRef(t);
  const [message, setMessage] = useState(t("steamCallback.loading"));

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    async function completeSteamLogin() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const error = params.get("error");

      window.history.replaceState(null, "", window.location.pathname);

      if (error) {
        setMessage(error);
        return;
      }

      if (!token) {
        setMessage(tRef.current("steamCallback.invalid"));
        return;
      }

      try {
        const user = await apiFetch<StoredUser>("/api/auth/me/", { token });
        storeAuth(token, user);
        setMessage(tRef.current("steamCallback.success"));
        window.location.replace("/profile");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : tRef.current("login.steamFailed"));
      }
    }

    completeSteamLogin().catch((err) => {
      setMessage(err instanceof Error ? err.message : tRef.current("login.steamFailed"));
    });
  }, []);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="section-panel w-full p-8">
        <div className="eyebrow">Steam OpenID</div>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">{t("steamCallback.title")}</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6">
          <Link className="btn-secondary" href="/login">
            {t("steamCallback.back")}
          </Link>
        </div>
      </section>
    </main>
  );
}
