"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type OrderPayload = {
  id: number;
  plan: {
    name: string;
    code: string;
  };
  status: string;
};

export default function PayPalReturnPage() {
  return (
    <Suspense fallback={<ReturnShell status="loading" message="Preparing PayPal confirmation..." />}>
      <PayPalReturnContent />
    </Suspense>
  );
}

function PayPalReturnContent() {
  const searchParams = useSearchParams();
  const hasCaptured = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirming your PayPal payment...");

  useEffect(() => {
    if (hasCaptured.current) return;
    hasCaptured.current = true;

    async function capture() {
      const token = getToken();
      const orderId = searchParams.get("order");
      const paypalOrderId = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Please log in again before confirming this payment.");
        return;
      }
      if (!orderId || !paypalOrderId) {
        setStatus("error");
        setMessage("PayPal did not return enough information to confirm this order.");
        return;
      }

      try {
        const order = await apiFetch<OrderPayload>(`/api/pay/orders/${orderId}/paypal-capture/`, {
          method: "POST",
          token,
          body: JSON.stringify({ paypal_order_id: paypalOrderId })
        });
        setStatus("success");
        setMessage(`${order.plan.name} is active. Your subscription has been unlocked.`);
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "PayPal payment confirmation failed.");
      }
    }

    capture();
  }, [searchParams]);

  return <ReturnShell status={status} message={message} />;
}

function ReturnShell({ status, message }: { status: "loading" | "success" | "error"; message: string }) {
  const Icon = status === "success" ? CheckCircle2 : status === "error" ? XCircle : Loader2;

  return (
    <main className="app-page flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.055] p-8 text-center shadow-[0_28px_110px_rgba(0,0,0,0.28)]">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
            status === "success"
              ? "bg-lime-300 text-slate-950"
              : status === "error"
                ? "bg-rose-300 text-slate-950"
                : "bg-cyan-300 text-slate-950"
          }`}
        >
          <Icon className={`h-8 w-8 ${status === "loading" ? "animate-spin" : ""}`} />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-white">
          {status === "success" ? "Payment confirmed" : status === "error" ? "Payment needs attention" : "Confirming payment"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className="btn-primary h-11 px-5" href="/arbitrage">
            Open deals
          </Link>
          <Link className="btn-secondary h-11 px-5" href="/pricing">
            Back to pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
