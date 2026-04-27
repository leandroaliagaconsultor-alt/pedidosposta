"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ChefHat, Bike, PartyPopper, XCircle, ChevronLeft, PackageCheck, MessageCircle, BellRing } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useTenantThemeEngine } from "@/hooks/useTenantThemeEngine";
import { toast, Toaster } from "sonner";

function getSteps(deliveryMethod: string) {
    const isTakeaway = deliveryMethod !== "DELIVERY";
    return [
        { key: "pending", label: "PEDIDO", icon: CheckCircle2, color: "text-primary", bg: "bg-primary" },
        { key: "preparing", label: "CONFIRMADO", icon: ChefHat, color: "text-amber-400", bg: "bg-amber-400" },
        { key: "on_the_way", label: isTakeaway ? "PREPARADO" : "DESPACHADO", icon: isTakeaway ? PackageCheck : Bike, color: "text-sky-400", bg: "bg-sky-400" },
        { key: "delivered", label: "ENTREGADO", icon: PartyPopper, color: "text-emerald-400", bg: "bg-emerald-400" },
    ];
}

export default function OrderTrackingPage({ params }: { params: Promise<{ tenant: string; id: string }> }) {
    const { tenant, id: orderId } = use(params);
    const supabase = createClient();
    const { clearCart } = useCartStore();

    const [order, setOrder] = useState<any>(null);
    const [tenantData, setTenantData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [themeState, setThemeState] = useState({ colorHex: "#10b981", themeMode: "", fontFamily: "", template: "" });

    useEffect(() => {
        try {
            if (localStorage.getItem(`clear_cart_${tenant}`) === "1") {
                clearCart();
                localStorage.removeItem(`clear_cart_${tenant}`);
            }
        } catch {}
    }, [tenant, clearCart]);

    useEffect(() => {
        const fetchOrder = async () => {
            const { data: tData } = await supabase
                .from("tenants")
                .select("id, name, logo_url, public_phone, color_hex, theme")
                .eq("slug", tenant)
                .single();

            if (!tData) { toast.error("Local no encontrado."); setLoading(false); return; }

            setTenantData(tData);
            const thObj = tData.theme ? (typeof tData.theme === "string" ? JSON.parse(tData.theme) : tData.theme) : {};
            setThemeState({ colorHex: tData.color_hex || "#10b981", themeMode: thObj?.mode || "", fontFamily: thObj?.font_family || "", template: thObj?.template || "" });

            const { data: orderData } = await supabase
                .from("orders").select("*").eq("id", orderId).eq("tenant_id", tData.id).single();

            if (orderData) setOrder(orderData);
            else toast.error("No se pudo encontrar el pedido.");
            setLoading(false);
        };
        fetchOrder();
    }, [supabase, orderId, tenant]);

    useEffect(() => {
        if (!orderId) return;
        const channel = supabase
            .channel(`order-tracker-${orderId}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
                (payload: any) => {
                    const newStatus = payload.new.status;
                    const method = payload.new.delivery_method || order?.delivery_method;
                    const isTakeaway = method !== "DELIVERY";
                    setOrder((prev: any) => ({ ...prev, ...payload.new }));

                    if (newStatus === "preparing") toast.success("¡Tu pedido fue confirmado! Ya se está preparando.");
                    else if (newStatus === "on_the_way") {
                        if (isTakeaway) {
                            new Audio("/timbrenotificacion.mp3").play().catch(() => {});
                            toast.success("¡Tu pedido está PREPARADO! Ya podés pasar a retirarlo. 🏪", { duration: 10000 });
                        } else toast.success("¡Tu pedido está en camino! 🚴");
                    } else if (newStatus === "delivered") toast.success("¡Pedido entregado! Disfrutalo 🎉");
                    else if (newStatus === "cancelled") toast.error("El pedido fue cancelado.");
                }
            ).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [supabase, orderId, order?.delivery_method]);

    // ── Web Push ──
    const [isSubscribed, setIsSubscribed] = useState(false);
    function urlBase64ToUint8Array(base64String: string) {
        const padding = "=".repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        return outputArray;
    }
    const subscribeToPush = async () => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        try {
            await navigator.serviceWorker.register("/sw.js");
            const permission = await Notification.requestPermission();
            if (permission !== "granted") { toast.error("No se otorgaron permisos."); return; }
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
            await supabase.from("orders").update({ push_subscription: JSON.parse(JSON.stringify(subscription)) }).eq("id", orderId);
            setIsSubscribed(true);
            toast.success("¡Notificaciones activadas!");
        } catch (err) { console.error(err); toast.error("Error al activar notificaciones."); }
    };
    useEffect(() => {
        if (!order || !orderId) return;
        (async () => {
            if (order?.push_subscription) { setIsSubscribed(true); return; }
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
            try {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                if (sub) {
                    await supabase.from("orders").update({ push_subscription: JSON.parse(JSON.stringify(sub)) }).eq("id", orderId);
                    setIsSubscribed(true);
                }
            } catch {}
        })();
    }, [order?.id, orderId]);

    // ── Theme Engine ──
    const themeEngine = useTenantThemeEngine({
        template: themeState.template || undefined,
        theme_mode: (themeState.themeMode === "light" || themeState.themeMode === "dark") ? themeState.themeMode : undefined,
        color_hex: themeState.colorHex,
        font_family: themeState.fontFamily || undefined,
    });
    const t = themeEngine.tokens;
    const accentColor = themeEngine.primaryColor;
    const isLight = t.mode === "light";

    if (loading || !order) {
        return (
            <main className={`flex min-h-screen flex-col items-center justify-center ${t.bg} px-4`} style={themeEngine.cssVars}>
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }} />
            </main>
        );
    }

    const { status: rawStatus, order_number, total_amount, delivery_method } = order;
    const status = (rawStatus || "pending").toLowerCase();
    const isCancelled = status === "cancelled";
    const isTakeaway = delivery_method !== "DELIVERY";
    const STEPS = getSteps(delivery_method);
    const statusToStep: Record<string, number> = { pending: 0, preparing: 1, on_the_way: 2, delivered: 3 };
    const currentStep = statusToStep[status] ?? 0;
    const activeStepData = currentStep >= 0 ? STEPS[currentStep] : null;
    const ActiveIcon = isCancelled ? XCircle : (activeStepData?.icon || CheckCircle2);
    const activeColor = isCancelled ? "text-red-500" : (activeStepData?.color || "text-primary");

    const getMessage = () => {
        if (isCancelled) return "El pedido ha sido cancelado. Comunicate con el local para más información.";
        if (status === "pending") return "Estamos esperando que el local confirme tu pedido. Te avisaremos enseguida.";
        if (status === "preparing") return "Tu pedido ya fue confirmado. Preparando todo con mucho cuidado.";
        if (status === "on_the_way") return isTakeaway ? "¡Tu pedido está listo! Acercate al local a retirarlo." : "Tu pedido ya salió. Está en camino a tu dirección.";
        if (status === "delivered") return "¡Disfrutá tu pedido! Gracias por elegirnos.";
        return "Estamos procesando tu pedido...";
    };

    const cardBg = isLight ? "bg-white border-zinc-200" : "bg-zinc-900/30 border-zinc-800/60";
    const mutedText = isLight ? "text-zinc-500" : "text-zinc-400";
    const subtleText = isLight ? "text-zinc-600" : "text-zinc-500";
    const surfaceBg = isLight ? "bg-zinc-50" : "bg-zinc-900/50";
    const borderColor = isLight ? "border-zinc-200" : "border-zinc-800";

    return (
        <main className={`flex min-h-screen flex-col items-center justify-start ${t.bg} ${t.text} px-4 py-8 relative overflow-hidden transition-colors duration-300 ${themeEngine.fontClass}`} style={themeEngine.cssVars}>
            <Toaster position="top-center" richColors />

            {/* Nav Back */}
            <div className="w-full max-w-sm mb-8 z-10">
                <Link href={`/${tenant}`} className={`inline-flex items-center gap-2 text-sm ${mutedText} hover:opacity-80 transition`}>
                    <ChevronLeft size={16} /> Volver al menú
                </Link>
            </div>

            {/* Glowing orb */}
            <div
                className={`pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 -z-10 h-72 w-full max-w-lg opacity-15 transition-all duration-1000`}
                style={{ background: `radial-gradient(ellipse at top center, ${isCancelled ? "#ef4444" : accentColor}, transparent)` }}
            />

            {/* Icon */}
            <div
                className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full ${surfaceBg} backdrop-blur-md shadow-2xl transition-all duration-700`}
                style={{
                    boxShadow: isCancelled ? "0 0 40px rgba(239,68,68,.2)" : `0 0 40px ${accentColor}30`,
                    border: `3px solid ${isCancelled ? "rgba(239,68,68,.4)" : `${accentColor}40`}`,
                }}
            >
                {tenantData?.logo_url ? (
                    <img src={tenantData.logo_url} alt={tenantData.name} className="h-16 w-16 rounded-full object-cover animate-pulse" />
                ) : (
                    <ActiveIcon className={`h-12 w-12 ${activeColor} drop-shadow-md`} />
                )}
            </div>

            {/* Order badge */}
            <div className="mb-4 flex flex-col items-center gap-2">
                <span className={`rounded-full border ${borderColor} ${surfaceBg} px-4 py-1.5 text-xs font-black uppercase tracking-widest ${mutedText} shadow-sm`}>
                    Pedido #{order_number}
                </span>
                <span className={`text-xl font-mono font-bold tracking-widest ${surfaceBg} px-4 py-1 rounded-xl border ${borderColor} ${t.text}`}>
                    ${Number(total_amount).toLocaleString("es-AR")}
                </span>
            </div>

            <h1 className={`mb-3 mt-2 text-center text-3xl font-extrabold tracking-tight ${t.text} drop-shadow-md`}>
                {isCancelled ? "Pedido Cancelado" : activeStepData?.label}
            </h1>

            <p className={`mb-6 max-w-xs text-center text-sm font-medium ${mutedText} leading-relaxed`}>
                {getMessage()}
            </p>

            {/* Web Push Banner */}
            {!isCancelled && currentStep < 3 && (
                <div className={`mb-12 w-full max-w-sm rounded-2xl border ${isLight ? "border-blue-200 bg-blue-50" : "border-blue-500/20 bg-[#0a0f1a]"} p-4 shadow-lg animate-in fade-in slide-in-from-top-4`}>
                    <div className="flex items-start gap-4">
                        <div className="mt-0.5 rounded-full bg-blue-500/20 p-2 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                            <BellRing size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-base font-semibold ${t.text} tracking-wide`}>Seguimiento en tiempo real</h3>
                            <p className={`text-sm ${mutedText} mt-1 leading-relaxed`}>
                                Tu pantalla se actualizará sola cuando haya cambios en tu pedido.
                            </p>
                        </div>
                    </div>
                    <div className={`rounded-xl ${isLight ? "bg-white border-zinc-200" : "bg-black/50 border-zinc-800/80"} p-3.5 border space-y-3 mt-4`}>
                        {!isSubscribed && (
                            <p className={`text-[13px] ${mutedText} leading-snug`}>
                                <span className="mr-1.5 inline-block">📱</span> <strong className={t.text}>¿Usás Android?</strong> Podés <button onClick={subscribeToPush} className="text-blue-400 font-semibold hover:text-blue-300" type="button">Activar Notificaciones</button> para cerrar el navegador y que te avisemos.
                            </p>
                        )}
                        <p className={`text-[13px] ${mutedText} leading-snug`}>
                            <span className="mr-1.5 inline-block">🍏</span> <strong className={t.text}>¿Usás iPhone?</strong> Dejá esta pestaña abierta, se actualiza en vivo.
                        </p>
                    </div>
                </div>
            )}

            {/* Progress Stepper */}
            {!isCancelled && (
                <div className="mb-12 w-full max-w-[360px]">
                    <div className="relative flex items-start justify-between">
                        <div className={`absolute left-[12%] right-[12%] top-[18px] h-1 ${isLight ? "bg-zinc-200" : "bg-zinc-800/80"} rounded-full`} />
                        <div
                            className="absolute left-[12%] top-[18px] h-1 rounded-full transition-all duration-700"
                            style={{ width: `${(currentStep / (STEPS.length - 1)) * 76}%`, background: accentColor, boxShadow: `0 0 10px ${accentColor}50` }}
                        />
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isDone = idx <= currentStep;
                            const isCurrent = idx === currentStep;
                            return (
                                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2.5" style={{ width: "25%" }}>
                                    <div
                                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ${isDone ? "scale-110" : ""} ${isCurrent ? "ring-4" : ""} ${t.bg}`}
                                        style={{
                                            borderWidth: 3, borderStyle: "solid",
                                            borderColor: isDone ? accentColor : (isLight ? "#e4e4e7" : "#27272a"),
                                            color: isDone ? accentColor : (isLight ? "#a1a1aa" : "#52525b"),
                                            boxShadow: isDone ? `0 0 15px ${accentColor}30` : "none",
                                            ...(isCurrent ? { boxShadow: `0 0 0 4px ${accentColor}20, 0 0 15px ${accentColor}30` } : {}),
                                        }}
                                    >
                                        <Icon size={16} className={isDone ? "" : "opacity-50"} />
                                    </div>
                                    <span className={`text-center font-bold text-[10px] leading-tight uppercase transition-colors duration-300 ${isDone ? t.text : subtleText}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Time card */}
            {currentStep < 3 && !isCancelled && (
                <div className={`mb-8 w-full max-w-sm flex items-center gap-4 rounded-3xl border ${cardBg} px-6 py-5 backdrop-blur-xl shadow-xl`}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full shadow-inner" style={{ background: `${accentColor}15`, color: accentColor }}>
                        <Clock size={24} className="drop-shadow-sm" />
                    </div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${subtleText} mb-0.5`}>Tiempo Estimado</p>
                        <p className={`text-lg font-bold ${t.text} drop-shadow-sm leading-tight capitalize`}>
                            {currentStep === 0 ? "A confirmar" : (order?.estimated_time || "45-60 min")}
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className={`mt-auto w-full pt-6 border-t ${borderColor} flex flex-col items-center pb-12`}>
                <p className={`mb-6 text-center text-[10px] uppercase font-bold tracking-widest ${subtleText}`}>
                    ID Transacción: <span className={`font-mono ${mutedText}`}>{orderId.slice(0, 8)}</span>
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button onClick={() => window.location.reload()} className={`text-xs font-semibold ${mutedText} hover:opacity-80 transition underline underline-offset-4`}>
                        Actualizar estado manualmente
                    </button>
                    {tenantData?.public_phone && (
                        <a
                            href={`https://wa.me/${tenantData.public_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Acabo de hacer el pedido #${order.order_number || String(order.id).slice(0, 8)} y me gustaría consultar o agregar algo:`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 rounded-xl border ${borderColor} ${surfaceBg} px-4 py-2 text-xs font-semibold ${mutedText} transition hover:opacity-80`}
                        >
                            <MessageCircle size={16} className="text-emerald-500" />
                            ¿Te olvidaste de algo? Escribinos
                        </a>
                    )}
                </div>
            </div>
        </main>
    );
}
