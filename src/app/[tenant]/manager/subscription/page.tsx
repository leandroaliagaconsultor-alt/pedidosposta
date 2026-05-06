"use client";

import React, { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    CreditCard, Clock, CheckCircle2, AlertTriangle, Zap,
    ShieldCheck, Sparkles, Rocket, Loader2,
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

export default function SubscriptionPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = use(params);
    const supabase = createClient();
    const [data, setData] = useState<SubData | null>(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isAnnual, setIsAnnual] = useState(false);

    useEffect(() => {
        supabase.from("tenants").select("subscription_status, trial_ends_at, subscription_ends_at, mp_subscription_id, name").eq("slug", tenant).single()
            .then(({ data }: { data: any }) => { if (data) setData(data as SubData); setLoading(false); });
    }, [supabase, tenant]);

    const handleSubscribe = async (mode: "manual" | "auto") => {
        setSubscribing(true);
        try {
            const res = await fetch("/api/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantSlug: tenant, mode, billing: isAnnual ? "annual" : "monthly" }) });
            const result = await res.json();
            if (result.init_point) { window.location.href = result.init_point; }
            else { alert(result.error || "Error al crear la suscripción"); setSubscribing(false); }
        } catch { alert("Error de conexión. Intentá nuevamente."); setSubscribing(false); }
    };

    const handleCancel = async () => {
        if (cancelling) return;
        setCancelling(true);
        try {
            const res = await fetch("/api/subscription/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantSlug: tenant, action: "cancel" }) });
            const result = await res.json();
            if (result.success) { setData((prev) => prev ? { ...prev, subscription_status: "cancelled" } : prev); setShowCancelConfirm(false); }
            else { alert(result.error || "Error al cancelar"); }
        } catch { alert("Error de conexión."); }
        setCancelling(false);
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#43926A] border-t-transparent" /></div>;
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
        return Math.max(0, Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    })();

    const trialProgress = (() => {
        if (!isTrialing || !data.trial_ends_at) return 100;
        return Math.min(100, Math.max(0, ((10 - trialDaysLeft) / 10) * 100));
    })();

    const trialEndDate = data.trial_ends_at ? new Date(data.trial_ends_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : null;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#575757]">Plan</p>
                <h1 className="font-['Archivo_Black',sans-serif] text-4xl tracking-tight mt-1">Suscripción</h1>
                <p className="text-sm text-[#575757] mt-1.5">Administrá tu plan y facturación de {data.name}</p>
            </div>

            {/* Status Card */}
            {isExpired ? (
                <div className="rounded-[18px] border border-[#E25A2B]/25 bg-white p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E25A2B]/10">
                            <AlertTriangle size={22} className="text-[#E25A2B]" />
                        </div>
                        <div>
                            <h2 className="font-['Archivo_Black',sans-serif] text-lg uppercase tracking-tight text-[#B9431C]">Tienda pausada</h2>
                            <p className="text-sm text-[#B9431C]/70">{isTrialing ? "Tu periodo de prueba gratuita finalizó." : "Tu suscripción se encuentra vencida."}</p>
                        </div>
                    </div>
                    <div className="rounded-xl bg-red-50 border border-[#E25A2B]/15 p-4">
                        <p className="text-xs text-[#B9431C]/80 leading-relaxed">Mientras tu suscripción no esté activa, tus clientes verán que tu tienda no acepta pedidos. Suscribite para reactivarla al instante.</p>
                    </div>
                </div>
            ) : isTrialing ? (
                <div className="rounded-[18px] bg-gradient-to-br from-[#2F6E4F] to-[#43926A] text-white p-6 space-y-5 relative overflow-hidden">
                    <div className="absolute -right-12 -bottom-12 w-[220px] h-[220px] rounded-full bg-white/10 blur-sm" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                            <Rocket size={22} />
                        </div>
                        <div>
                            <h2 className="font-['Archivo_Black',sans-serif] text-lg uppercase tracking-tight">Periodo de prueba</h2>
                            <p className="text-sm opacity-85">Termina el {trialEndDate}</p>
                        </div>
                    </div>
                    <div className="space-y-2 relative z-10">
                        <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 opacity-90"><Clock size={12} />{trialDaysLeft === 1 ? "Te queda 1 día" : `Te quedan ${trialDaysLeft} días`}</span>
                            <span className="font-mono opacity-70">{trialDaysLeft}/10 días</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${100 - trialProgress}%` }} />
                        </div>
                    </div>
                    <p className="text-[13px] opacity-90 leading-relaxed relative z-10 max-w-[540px]">Tenés acceso completo a todas las funcionalidades. Suscribite antes de que termine para que tu tienda siga activa.</p>
                </div>
            ) : (
                <div className="rounded-[18px] border border-[#43926A]/25 bg-white p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D7E9DE]">
                            <CheckCircle2 size={22} className="text-[#2F6E4F]" />
                        </div>
                        <div>
                            <h2 className="font-['Archivo_Black',sans-serif] text-lg uppercase tracking-tight">Plan activo</h2>
                            <p className="text-sm text-[#575757]">Full Commerce · Tu tienda está online</p>
                        </div>
                    </div>
                    {data.subscription_ends_at && (
                        <div className="rounded-xl bg-[#D7E9DE]/40 border border-[#43926A]/15 p-4 flex items-center gap-3">
                            <CreditCard size={16} className="text-[#2F6E4F] shrink-0" />
                            <p className="text-xs text-[#575757]">Próximo cobro el <span className="text-[#0F1210] font-bold">{new Date(data.subscription_ends_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</span></p>
                        </div>
                    )}
                    {!showCancelConfirm ? (
                        <button onClick={() => setShowCancelConfirm(true)} className="text-xs text-[#575757] hover:text-[#E25A2B] transition-colors">Cancelar suscripción</button>
                    ) : (
                        <div className="rounded-xl border border-[#E25A2B]/20 bg-red-50 p-4 space-y-3">
                            <p className="text-xs text-[#B9431C]">¿Seguro? Tu tienda seguirá activa hasta el {data.subscription_ends_at ? new Date(data.subscription_ends_at).toLocaleDateString("es-AR", { day: "numeric", month: "long" }) : "fin del periodo"}. Después dejará de recibir pedidos.</p>
                            <div className="flex gap-2">
                                <button onClick={handleCancel} disabled={cancelling} className="px-4 py-2 text-xs font-bold rounded-lg bg-[#E25A2B] text-white hover:bg-[#B9431C] disabled:opacity-50 transition">{cancelling ? "Cancelando..." : "Sí, cancelar"}</button>
                                <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2 text-xs font-bold rounded-lg border border-[rgba(15,18,16,.18)] text-[#575757] hover:bg-[#E9E7E2] transition">No, mantener</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Plan Card */}
            <div className="rounded-[18px] border border-[rgba(15,18,16,.1)] bg-white overflow-hidden">
                <div className="border-b border-[rgba(15,18,16,.1)] px-6 py-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[#D7E9DE]">
                                <Sparkles size={20} className="text-[#2F6E4F]" />
                            </div>
                            <div>
                                <h3 className="font-['Archivo_Black',sans-serif] text-xl uppercase tracking-tight">Full Commerce</h3>
                                <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#575757] mt-0.5">Todo incluido</p>
                            </div>
                        </div>
                        <div className="text-right">
                            {isAnnual ? (
                                <>
                                    <p className="font-['Archivo_Black',sans-serif] text-[30px] leading-none tracking-tight">$600.000<span className="font-mono text-[11px] font-bold text-[#575757] ml-1 uppercase tracking-[.1em]">/año</span></p>
                                    <p className="text-[10px] font-bold text-[#43926A] mt-1">$50.000/mes · Ahorrás $120.000</p>
                                </>
                            ) : (
                                <p className="font-['Archivo_Black',sans-serif] text-[30px] leading-none tracking-tight">$60.000<span className="font-mono text-[11px] font-bold text-[#575757] ml-1 uppercase tracking-[.1em]">/mes</span></p>
                            )}
                        </div>
                    </div>

                    {!isActive && (
                        <div className="flex items-center justify-center gap-3 rounded-[10px] bg-[#FBF8F1] p-3">
                            <span className={`text-[13px] font-semibold ${!isAnnual ? "text-[#0F1210]" : "text-[#575757]"}`}>Mensual</span>
                            <button onClick={() => setIsAnnual(!isAnnual)} role="switch" aria-checked={isAnnual} aria-label="Alternar plan"
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnnual ? "bg-[#43926A]" : "bg-[#E9E7E2]"}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isAnnual ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                            <span className={`text-[13px] font-semibold ${isAnnual ? "text-[#0F1210]" : "text-[#575757]"}`}>Anual</span>
                            <span className="font-['Archivo_Black',sans-serif] text-[9px] uppercase tracking-[.06em] bg-[#43926A] text-white px-2 py-1 rounded-full ml-1">2 meses gratis</span>
                        </div>
                    )}
                </div>

                <div className="p-6">
                    <div className="grid sm:grid-cols-2 gap-2">
                        {PLAN_FEATURES.map((f) => (
                            <div key={f} className="flex items-center gap-2.5 py-1.5">
                                <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#D7E9DE] text-[#2F6E4F] text-[11px] font-black shrink-0">✓</span>
                                <span className="text-[13px] text-[#0F1210]">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-[rgba(15,18,16,.1)] px-6 py-5 space-y-4">
                    {isActive ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-[#2F6E4F]"><ShieldCheck size={16} /> Tu plan está activo</div>
                    ) : subscribing ? (
                        <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#E9E7E2] py-3.5 text-sm font-bold text-[#575757]"><Loader2 size={16} className="animate-spin" /> Redirigiendo a MercadoPago...</div>
                    ) : (
                        <>
                            <p className="text-xs text-[#575757] text-center">Elegí cómo preferís pagar</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button onClick={() => handleSubscribe("manual")} disabled={subscribing}
                                    className="flex flex-col items-center gap-1.5 rounded-[14px] bg-[#43926A] py-4 px-4 text-white hover:bg-[#2F6E4F] transition active:scale-[0.98] shadow-[0_6px_16px_-8px_rgba(67,146,106,.6)]">
                                    <Zap size={18} />
                                    <span className="font-['Archivo_Black',sans-serif] text-sm uppercase tracking-[.04em]">{isAnnual ? "Pagar el año" : "Pagar este mes"}</span>
                                    <span className="text-[10px] opacity-80">Débito, crédito, MP o transferencia</span>
                                </button>
                                <button onClick={() => handleSubscribe("auto")} disabled={subscribing}
                                    className="flex flex-col items-center gap-1.5 rounded-[14px] border-2 border-[#43926A]/40 bg-[rgba(67,146,106,.06)] py-4 px-4 text-[#2F6E4F] hover:bg-[rgba(67,146,106,.12)] transition active:scale-[0.98]">
                                    <CreditCard size={18} />
                                    <span className="font-['Archivo_Black',sans-serif] text-sm uppercase tracking-[.04em]">Suscripción automática</span>
                                    <span className="text-[10px] text-[#575757]">Tarjeta de crédito · Se debita solo</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ROI */}
            <div className="rounded-[18px] border border-[rgba(15,18,16,.1)] bg-white p-6 space-y-3">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#43926A]" />
                    <h3 className="font-['Archivo_Black',sans-serif] text-sm uppercase tracking-tight">Garantía de ROI</h3>
                </div>
                <p className="text-xs text-[#575757] leading-relaxed">
                    Otras apps te cobran entre 10% y 25% de comisión por cada venta. Con un promedio de $1.000.000/mes
                    en ventas, estás perdiendo entre $100.000 y $250.000 mensuales en comisiones. Con PedidosPosta
                    pagás un fijo de $60.000 y te ahorrás todo eso. <span className="text-[#43926A] font-bold">Se paga solo desde el primer mes.</span>
                </p>
            </div>

            <div className="h-8" />
        </div>
    );
}
