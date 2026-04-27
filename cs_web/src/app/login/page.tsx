"use client";

import { LogIn, Mail, Send, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";

import { apiFetch } from "@/lib/api";
import { storeAuth } from "@/lib/auth";

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
  const [username, setUsername] = useState("devadmin");
  const [email, setEmail] = useState("devadmin@example.com");
  const [password, setPassword] = useState("DevAdmin12345");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setMessage("");
    try {
      const data = await apiFetch<{ detail: string; debug_code?: string }>("/api/auth/email-code/", {
        method: "POST",
        body: JSON.stringify({ email, purpose: "register" })
      });
      setMessage(data.debug_code ? `${data.detail}：${data.debug_code}` : data.detail);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "验证码发送失败");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const path = mode === "login" ? "/api/auth/login/" : "/api/auth/register/";
      const body =
        mode === "login"
          ? { username, password }
          : { username, email, password, code };
      const data = await apiFetch<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body)
      });
      storeAuth(data.token, data.user);
      window.location.href = "/arbitrage";
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "认证失败");
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
      setMessage(err instanceof Error ? err.message : "Steam 登录失败");
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
      <section className="flex flex-col justify-center">
        <div className="max-w-2xl">
          <div className="eyebrow">Account Access</div>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">登录后使用利润榜、订阅和 Steam 库存</h1>
          <p className="mt-4 muted-copy">
            开发测试账号已创建：`devadmin / DevAdmin12345`，拥有最高级权限。
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="metric-card"><div className="text-xs text-slate-500">Auth</div><div className="mt-1 font-mono-display font-semibold">Token</div></div>
            <div className="metric-card"><div className="text-xs text-slate-500">Steam</div><div className="mt-1 font-mono-display font-semibold">Bind</div></div>
            <div className="metric-card"><div className="text-xs text-slate-500">Premium</div><div className="mt-1 font-mono-display font-semibold">Gate</div></div>
          </div>
        </div>
      </section>
      <section className="section-panel p-6">
        <div className="mb-5 flex rounded-md bg-slate-100 p-1">
          <button
            className={`h-10 flex-1 rounded text-sm font-semibold ${mode === "login" ? "bg-white shadow-sm" : "text-slate-500"}`}
            onClick={() => setMode("login")}
          >
            登录
          </button>
          <button
            className={`h-10 flex-1 rounded text-sm font-semibold ${mode === "register" ? "bg-white shadow-sm" : "text-slate-500"}`}
            onClick={() => setMode("register")}
          >
            注册
          </button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <Field label="用户名" value={username} onChange={setUsername} />
          {mode === "register" ? (
            <>
              <Field label="邮箱" value={email} onChange={setEmail} type="email" />
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Field label="验证码" value={code} onChange={setCode} />
                <button
                  type="button"
                  className="btn-secondary mt-6"
                  onClick={sendCode}
                >
                  <Send className="h-4 w-4" />
                  发送
                </button>
              </div>
            </>
          ) : null}
          <Field label="密码" value={password} onChange={setPassword} type="password" />
          <button className="btn-primary h-11 w-full">
            {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {loading ? "处理中" : mode === "login" ? "登录" : "注册"}
          </button>
        </form>
        <button
          className="btn-secondary mt-3 h-11 w-full"
          onClick={steamMock}
        >
          <Mail className="h-4 w-4" />
          Steam 开发登录
        </button>
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
