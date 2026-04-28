"use client";

import { LogIn, Mail, Send, UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";

import { apiFetch } from "@/lib/api";
import { storeAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

type AuthResponse = {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    is_staff?: boolean;
    is_superuser?: boolean;
    steam_id?: string;
    has_premium?: boolean;
  };
};

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [steamLoading, setSteamLoading] = useState(false);
  const showMockLogin = process.env.NODE_ENV !== "production";
  const { t } = useI18n();

  async function sendCode() {
    setMessage("");
    try {
      const data = await apiFetch<{ detail: string; debug_code?: string }>("/api/auth/email-code/", {
        method: "POST",
        body: JSON.stringify({ email, purpose: "register" })
      });
      setMessage(data.debug_code ? `${data.detail}: ${data.debug_code}` : data.detail);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("login.codeFailed"));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const path = mode === "login" ? "/api/auth/login/" : "/api/auth/register/";
      const body = mode === "login" ? { username, password } : { username, email, password, code };
      const data = await apiFetch<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body)
      });
      storeAuth(data.token, data.user);
      window.location.href = "/arbitrage";
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("login.authFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function steamMock() {
    setMessage("");
    try {
      const data = await apiFetch<AuthResponse>("/api/auth/steam/mock-login/", {
        method: "POST",
        body: JSON.stringify({ steam_id: "76561198153187116", steam_persona_name: "Steam Dev" })
      });
      storeAuth(data.token, data.user);
      window.location.href = "/profile";
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("login.steamFailed"));
    }
  }

  async function steamLogin() {
    setSteamLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ url: string; redirect_uri: string }>("/api/auth/steam/login-url/");
      window.location.href = data.url;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("login.steamFailed"));
      setSteamLoading(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
      <section className="flex flex-col justify-center">
        <div className="max-w-2xl">
          <div className="eyebrow">{t("login.eyebrow")}</div>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">{t("login.title")}</h1>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="metric-card">
              <div className="text-xs text-slate-500">Auth</div>
              <div className="mt-1 font-mono-display font-semibold">Token</div>
            </div>
            <div className="metric-card">
              <div className="text-xs text-slate-500">Steam</div>
              <div className="mt-1 font-mono-display font-semibold">OpenID</div>
            </div>
            <div className="metric-card">
              <div className="text-xs text-slate-500">Premium</div>
              <div className="mt-1 font-mono-display font-semibold">Gate</div>
            </div>
          </div>
        </div>
      </section>
      <section className="section-panel p-6">
        <div className="mb-5 flex rounded-md bg-slate-100 p-1">
          <button
            className={`h-10 flex-1 rounded text-sm font-semibold ${mode === "login" ? "bg-white shadow-sm" : "text-slate-500"}`}
            onClick={() => setMode("login")}
            type="button"
          >
            {t("login.loginTab")}
          </button>
          <button
            className={`h-10 flex-1 rounded text-sm font-semibold ${mode === "register" ? "bg-white shadow-sm" : "text-slate-500"}`}
            onClick={() => setMode("register")}
            type="button"
          >
            {t("login.registerTab")}
          </button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <Field label={t("login.username")} value={username} onChange={setUsername} />
          {mode === "register" ? (
            <>
              <Field label={t("login.email")} value={email} onChange={setEmail} type="email" />
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Field label={t("login.code")} value={code} onChange={setCode} />
                <button type="button" className="btn-secondary mt-6" onClick={sendCode}>
                  <Send className="h-4 w-4" />
                  {t("login.send")}
                </button>
              </div>
            </>
          ) : null}
          <Field label={t("login.password")} value={password} onChange={setPassword} type="password" />
          <button className="btn-primary h-11 w-full" disabled={loading}>
            {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {loading ? t("common.processing") : mode === "login" ? t("login.loginTab") : t("login.registerTab")}
          </button>
        </form>
        <button className="btn-secondary mt-3 h-11 w-full" onClick={steamLogin} disabled={steamLoading}>
          <Mail className="h-4 w-4" />
          {steamLoading ? t("login.steamLoading") : t("login.steam")}
        </button>
        {showMockLogin ? (
          <button className="btn-secondary mt-2 h-11 w-full" onClick={steamMock}>
            <Mail className="h-4 w-4" />
            {t("login.steamDev")}
          </button>
        ) : null}
        {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        className="input-control mt-1 bg-slate-50 focus:bg-white"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
