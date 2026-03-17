"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ChefHat, Bike, PartyPopper, XCircle, ChevronLeft, PackageCheck, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";



// ── Dynamic steps builder ────────────────────────────────────────────────────
// Step 3 label changes based on delivery method:
//   DELIVERY  → "DESPACHADO"
//   TAKEAWAY  → "PREPARADO"
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

    const [order, setOrder] = useState<any>(null);
    const [tenantData, setTenantData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // ── Initial Fetch ────────────────────────────────────────────────────
    useEffect(() => {
        const fetchOrder = async () => {
            const { data: orderData } = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .single();

            if (orderData) {
                setOrder(orderData);
                // Also fetch tenant logo and public_phone
                const { data: tData } = await supabase
                    .from("tenants")
                    .select("name, logo_url, public_phone")
                    .eq("slug", tenant)
                    .single();
                if (tData) setTenantData(tData);
            } else {
                toast.error("No se pudo encontrar el pedido.");
            }
            setLoading(false);
        };

        fetchOrder();
    }, [supabase, orderId]);

    // ── Realtime Listener ────────────────────────────────────────────────
    useEffect(() => {
        if (!orderId) return;

        const channel = supabase
            .channel(`order-tracker-${orderId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "orders",
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    const newStatus = payload.new.status;
                    const method = payload.new.delivery_method || order?.delivery_method;
                    const isTakeaway = method !== "DELIVERY";

                    setOrder((prev: any) => ({
                        ...prev,
                        status: newStatus,
                        estimated_time: payload.new.estimated_time || prev?.estimated_time
                    }));

                    // ── Status-specific notifications ────────────────
                    if (newStatus === "preparing") {
                        toast.success("¡Tu pedido fue confirmado! Ya se está preparando.");
                    } else if (newStatus === "on_the_way") {
                        if (isTakeaway) {
                            // 🔔 ÚNICO caso con sonido: Take Away → PREPARADO
                            const audio = new Audio("/timbrenotificacion.mp3");
                            audio.play().catch(() => { });
                            toast.success(
                                "¡Tu pedido está PREPARADO! Ya podés pasar a retirarlo. 🏪",
                                { duration: 10000 }
                            );
                            if ("Notification" in window && Notification.permission === "granted") {
                                new Notification("🔔 ¡Pedido listo para retirar!", {
                                    body: "Tu pedido está preparado. Acercate al local a retirarlo.",
                                    icon: "/favicon.ico",
                                });
                            }
                        } else {
                            toast.success("¡Tu pedido está en camino! 🚴");
                        }
                    } else if (newStatus === "delivered") {
                        toast.success("¡Pedido entregado! Disfrutalo 🎉");
                    } else if (newStatus === "cancelled") {
                        toast.error("El pedido fue cancelado.");
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, orderId, order?.delivery_method]);

    // ── Web Push Logic ──────────────────────────────────────────────────
    const [isSubscribed, setIsSubscribed] = useState(false);

    function urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    const subscribeToPush = async () => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            console.warn("Push messaging is not supported");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register("/sw.js");
            const permission = await Notification.requestPermission();
            
            if (permission !== "granted") {
                toast.error("No se otorgaron permisos para notificaciones.");
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
            });

            // Guardar en la tabla de órdenes en Supabase
            const { error: updateErr } = await supabase
                .from("orders")
                .update({ push_subscription: subscription.toJSON() })
                .eq("id", orderId);

            if (updateErr) throw updateErr;

            setIsSubscribed(true);
            toast.success("¡Notificaciones activadas! Te avisaremos cuando cambie el estado.");
        } catch (err) {
            console.error("Subscription error:", err);
            toast.error("Error al activar notificaciones.");
        }
    };

    useEffect(() => {
        if (order?.push_subscription) {
            setIsSubscribed(true);
        }
    }, [order]);

    // ── Loading ──────────────────────────────────────────────────────────
    if (loading || !order) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-primary" />
            </main>
        );
    }

    // ── Derived State ────────────────────────────────────────────────────
    const { status: rawStatus, order_number, total_amount, delivery_method } = order;
    const status = (rawStatus || "pending").toLowerCase();
    const isCancelled = status === "cancelled";
    const isTakeaway = delivery_method !== "DELIVERY";
    const STEPS = getSteps(delivery_method);

    const statusToStep: Record<string, number> = {
        pending: 0,
        preparing: 1,
        on_the_way: 2,
        delivered: 3,
    };
    const currentStep = statusToStep[status] ?? 0;

    const activeStepData = currentStep >= 0 ? STEPS[currentStep] : null;
    const ActiveIcon = isCancelled ? XCircle : (activeStepData?.icon || CheckCircle2);
    const activeColor = isCancelled ? "text-red-500" : (activeStepData?.color || "text-primary");

    const getMessage = () => {
        if (isCancelled) return "El pedido ha sido cancelado. Comunicate con el local para más información.";
        if (status === "pending") return "Estamos esperando que el local confirme tu pedido. Te avisaremos enseguida.";
        if (status === "preparing") return "Tu pedido ya fue confirmado. Preparando todo con mucho cuidado.";
        if (status === "on_the_way") {
            return isTakeaway
                ? "¡Tu pedido está listo! Acercate al local a retirarlo."
                : "Tu pedido ya salió. Está en camino a tu dirección.";
        }
        if (status === "delivered") return "¡Disfrutá tu pedido! Gracias por elegirnos.";
        return "Estamos procesando tu pedido...";
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 px-4 py-8 relative overflow-hidden">
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            {/* Nav Back */}
            <div className="w-full max-w-sm mb-8 z-10">
                <Link href={`/${tenant}`} className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
                    <ChevronLeft size={16} /> Volver al menú
                </Link>
            </div>

            {/* Glowing orb accent */}
            <div
                className={`pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 -z-10 h-72 w-full max-w-lg bg-[radial-gradient(ellipse_at_top_center,var(--tw-gradient-stops))] opacity-15 transition-all duration-1000 ${isCancelled ? "from-red-500 to-transparent" : "from-primary to-transparent"}`}
            />

            {/* Icon */}
            <div
                className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-900/50 backdrop-blur-md ring-2 ring-offset-4 ring-offset-zinc-950 shadow-2xl transition-all duration-700 ${isCancelled
                    ? "ring-red-500/50 shadow-red-500/20 text-red-500"
                    : "ring-primary/40 shadow-[0_0_40px_var(--brand-color)] shadow-primary/20 text-primary"
                    }`}
            >
                {tenantData?.logo_url ? (
                    <img
                        src={tenantData.logo_url}
                        alt={tenantData.name}
                        className="h-16 w-16 rounded-full object-cover animate-pulse"
                    />
                ) : (
                    <ActiveIcon className={`h-12 w-12 ${activeColor} drop-shadow-md`} />
                )}
            </div>

            {/* Order number badge */}
            <div className="mb-4 flex flex-col items-center gap-2">
                <span className="rounded-full border border-zinc-700/50 bg-zinc-900/80 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-zinc-300 shadow-sm">
                    Pedido #{order_number}
                </span>
                <span className="text-xl font-mono font-bold text-white tracking-widest bg-zinc-900/50 px-4 py-1 rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border border-zinc-800">
                    ${Number(total_amount).toLocaleString("es-AR")}
                </span>
            </div>

            <h1 className="mb-3 mt-2 text-center text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                {isCancelled ? "Pedido Cancelado" : activeStepData?.label}
            </h1>

            <p className="mb-12 max-w-xs text-center text-sm font-medium text-zinc-400 leading-relaxed">
                {getMessage()}
            </p>

            {/* ── Progress Stepper (full labels, no truncation) ────────── */}
            {!isCancelled && (
                <div className="mb-12 w-full max-w-[360px]">
                    <div className="relative flex items-start justify-between">
                        {/* Track background */}
                        <div className="absolute left-[12%] right-[12%] top-[18px] h-1 bg-zinc-800/80 rounded-full" />

                        {/* Active progress line */}
                        <div
                            className="absolute left-[12%] top-[18px] h-1 bg-primary transition-all duration-700 rounded-full shadow-[0_0_10px_var(--brand-color)] shadow-primary/50"
                            style={{ width: `${(currentStep / (STEPS.length - 1)) * 76}%` }}
                        />

                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isDone = idx <= currentStep;
                            const isCurrent = idx === currentStep;

                            return (
                                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2.5" style={{ width: "25%" }}>
                                    <div
                                        className={`flex h-9 w-9 items-center justify-center rounded-full border-[3px] transition-all duration-500 ${isDone
                                            ? "border-primary bg-zinc-950 text-primary shadow-[0_0_15px_var(--brand-color)] shadow-primary/30 scale-110"
                                            : "border-zinc-800 bg-zinc-950 text-zinc-600"
                                            } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                                    >
                                        <Icon size={16} className={isDone ? "" : "opacity-50"} />
                                    </div>
                                    <span
                                        className={`text-center font-bold text-[10px] leading-tight uppercase transition-colors duration-300 ${isDone ? "text-zinc-200" : "text-zinc-600"
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Estimated time card */}
            {currentStep < 3 && !isCancelled && (
                <div className="mb-8 w-full max-w-sm flex items-center gap-4 rounded-3xl border border-zinc-800/60 bg-zinc-900/30 px-6 py-5 backdrop-blur-xl shadow-xl">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
                        <Clock size={24} className="drop-shadow-sm" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">
                            Tiempo Estimado
                        </p>
                        <p className="text-lg font-bold text-white drop-shadow-sm leading-tight capitalize">
                            {currentStep === 0 ? "A confirmar" : (order?.estimated_time || "45-60 min")}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Web Push Banner ── */}
            {!isSubscribed && !isCancelled && currentStep < 3 && (
                <div className="mb-8 w-full max-w-sm rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2 text-primary">
                            <CheckCircle2 size={18} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-white">¿Querés que te avisemos?</p>
                            <p className="text-[10px] text-zinc-400">Activá las notificaciones para saber cuándo sale tu pedido.</p>
                        </div>
                        <button
                            onClick={subscribeToPush}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-black text-zinc-950 transition hover:brightness-110 active:scale-95"
                        >
                            ACTIVAR
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-auto w-full pt-6 border-t border-zinc-900 flex flex-col items-center pb-12">
                <p className="mb-6 text-center text-[10px] uppercase font-bold tracking-widest text-zinc-600">
                    ID Transacción: <span className="font-mono text-zinc-400">{orderId.slice(0, 8)}</span>
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs font-semibold text-zinc-500 hover:text-white transition underline underline-offset-4 decoration-zinc-700"
                    >
                        Actualizar estado manualmente
                    </button>
                    {tenantData?.public_phone && (
                        <a
                            href={`https://wa.me/${tenantData.public_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Acabo de hacer el pedido #${order.order_number || String(order.id).slice(0, 8)} y me gustaría consultar o agregar algo:`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
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
