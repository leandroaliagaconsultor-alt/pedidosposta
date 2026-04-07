"use client";

import React, { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    CreditCard, Clock, CheckCircle2, AlertTriangle, Zap,
    ShieldCheck, Sparkles, ArrowRight, Rocket, Loader2,
} from "lucide-react";

type SubData = {
    subscription_status: string;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
    mp_subscription_id: string | null;
    name: string;
};

const PLAN_FEATURES = [
    "Menú digital ilimitado",
    "Pedidos online 24/7",
    "Panel de Live Orders",
    "Brand Studio completo",
    "Analytics Dashboard",
    "Zonas de Entrega con Google Maps",
    "Checkout con MercadoPago",
    "Cobras directo en tu MercadoPago",
    "0% comisiones por venta",
    "Soporte prioritario",
];

export default function SubscriptionPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const { tenant } = use(params);
    const supabase = createClient();
    const [data, setData] = useState<SubData | null>(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        supabase
            .from("tenants")
            .select("subscription_status, trial_ends_at, subscription_ends_at, mp_subscription_id, name")
            .eq("slug", tenant)
            .single()
            .then(({ data }) => {
                if (data) setData(data as SubData);
                setLoading(false);
            });
    }, [supabase, tenant]);

    const handleSubscribe = async () => {
        setSubscribing(true);
        try {
            const res = await fetch("/api/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantSlug: tenant }),
            });
            const result = await res.json();
            if (result.init_point) {
                window.location.href = result.init_point;
            } else {
                alert(result.error || "Error al crear la suscripción");
                setSubscribing(false);
            }
        } catch {
            alert("Error de conexión. Intentá nuevamente.");
            setSubscribing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!data) return null;

    const isTrialing = data.subscription_status === "trialing";
    const isActive = data.subscription_status === "active";
    const isExpired = (() => {
        if (isActive) return false;
        if (isTrialing && data.trial_ends_at) return new Date(data.trial_ends_at) < new Date();
        if (data.subscription_status === "past_due" || data.subscription_status === "cancelled") return true;
        return false;
    })();

    const trialDaysLeft = (() => {
        if (!isTrialing || !data.trial_ends_at) return 0;
        const diff = new Date(data.trial_ends_at).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    })();

    const trialProgress = (() => {
        if (!isTrialing || !data.trial_ends_at) return 100;
        const total = 10;
        const elapsed = total - trialDaysLeft;
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    })();

    const trialEndDate = data.trial_ends_at
        ? new Date(data.trial_ends_at).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : null;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-black text-white">Suscripción</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Administrá tu plan y facturación de {data.name}
                </p>
            </div>

            {/* ── Status Card ─────────────────────────────────────────────── */}
            {isExpired ? (
                <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-900/10 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20">
                            <AlertTriangle size={24} className="text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-red-300">Tienda pausada</h2>
                            <p className="text-sm text-red-400/80">
                                {isTrialing
                                    ? "Tu periodo de prueba gratuita finalizó."
                                    : "Tu suscripción se encuentra vencida."}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">
                        <p className="text-xs text-red-300/80 leading-relaxed">
                            Mientras tu suscripción no esté activa, tus clientes verán un cartel indicando que tu tienda
                            no está aceptando pedidos. Suscribite para reactivarla al instante.
                        </p>
                    </div>
                </div>
            ) : isTrialing ? (
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-900/10 p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
                            <Rocket size={24} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Periodo de prueba</h2>
                            <p className="text-sm text-zinc-400">
                                Termina el {trialEndDate}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400 flex items-center gap-1.5">
                                <Clock size={12} />
                                {trialDaysLeft === 1
                                    ? "Te queda 1 día"
                                    : `Te quedan ${trialDaysLeft} días`}
                            </span>
                            <span className="text-zinc-500 font-mono">{trialDaysLeft}/10 días</span>
                        </div>
                        <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    trialDaysLeft <= 3
                                        ? "bg-gradient-to-r from-amber-500 to-red-500"
                                        : "bg-gradient-to-r from-primary to-emerald-400"
                                }`}
                                style={{ width: `${100 - trialProgress}%` }}
                            />
                        </div>
                    </div>

                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Tenés acceso completo a todas las funcionalidades durante tu prueba gratuita.
                            Suscribite antes de que termine para que tu tienda siga activa sin interrupciones.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-900/10 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
                            <CheckCircle2 size={24} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Plan activo</h2>
                            <p className="text-sm text-zinc-400">
                                Full Commerce · Tu tienda está online y recibiendo pedidos
                            </p>
                        </div>
                    </div>
                    {data.subscription_ends_at && (
                        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
                            <CreditCard size={16} className="text-primary shrink-0" />
                            <p className="text-xs text-zinc-400">
                                Tu suscripción está activa. Próximo cobro el{" "}
                                <span className="text-white font-medium">
                                    {new Date(data.subscription_ends_at).toLocaleDateString("es-AR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Plan Card ───────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                {/* Plan header */}
                <div className="border-b border-zinc-800 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Sparkles size={18} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Plan Full Commerce</h3>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Todo incluido</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-white">
                            $60.000
                            <span className="text-xs font-medium text-zinc-500 ml-1">/mes</span>
                        </p>
                    </div>
                </div>

                {/* Features grid */}
                <div className="p-6">
                    <div className="grid sm:grid-cols-2 gap-3">
                        {PLAN_FEATURES.map((feature) => (
                            <div key={feature} className="flex items-center gap-2.5">
                                <CheckCircle2 size={14} className="text-primary shrink-0" />
                                <span className="text-sm text-zinc-300">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="border-t border-zinc-800 px-6 py-5">
                    {isActive ? (
                        <div className="flex items-center gap-2 text-sm text-primary font-medium">
                            <ShieldCheck size={16} />
                            Tu plan está activo
                        </div>
                    ) : (
                        <button
                            onClick={handleSubscribe}
                            disabled={subscribing}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-zinc-950 hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {subscribing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Redirigiendo a MercadoPago...
                                </>
                            ) : (
                                <>
                                    <Zap size={16} />
                                    {isExpired ? "Suscribirme y reactivar tienda" : "Suscribirme ahora"}
                                    <ArrowRight size={14} />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* ── ROI Section ─────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <h3 className="text-sm font-bold text-white">Garantía de ROI</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                    Otras apps te cobran entre 10% y 25% de comisión por cada venta. Con un promedio de $1.000.000/mes
                    en ventas, estás perdiendo entre $100.000 y $250.000 mensuales en comisiones. Con PedidosPosta
                    pagás un fijo de $60.000 y te ahorrás todo eso. <span className="text-primary font-bold">Se paga solo desde el primer mes.</span>
                </p>
            </div>

            {/* Spacer */}
            <div className="h-8" />
        </div>
    );
}
