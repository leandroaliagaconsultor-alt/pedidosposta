"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ChefHat, Bike, PartyPopper, XCircle, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ─── Status Map ─────────────────────────
const STEPS = [
    { key: "pending", label: "Pedido Recibido", icon: CheckCircle2, color: "text-primary", bg: "bg-primary" },
    { key: "preparing", label: "En preparación", icon: ChefHat, color: "text-amber-400", bg: "bg-amber-400" },
    { key: "on_the_way", label: "En camino", icon: Bike, color: "text-sky-400", bg: "bg-sky-400" },
    { key: "delivered", label: "Entregado!", icon: PartyPopper, color: "text-emerald-400", bg: "bg-emerald-400" },
];

export default function OrderTrackingPage({ params }: { params: Promise<{ tenant: string, id: string }> }) {
    const { tenant, id: orderId } = use(params);
    const supabase = createClient();

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        const fetchOrder = async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .single();

            if (data) {
                setOrder(data);
            } else {
                toast.error("No se pudo encontrar el pedido.");
            }
            setLoading(false);
        };

        fetchOrder();
    }, [supabase, orderId]);

    // Realtime Listener
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
                    setOrder((prev: any) => ({ ...prev, status: newStatus }));

                    if (newStatus === "preparing") toast.success("¡Tu pedido se está preparando!");
                    if (newStatus === "on_the_way") toast.success("¡Tu pedido está en camino!");
                    if (newStatus === "delivered") toast.success("¡Pedido entregado! 🎉");
                    if (newStatus === "cancelled") {
                        toast.error("El pedido fue cancelado.");
                        const audio = new Audio('/notification.mp3');
                        audio.play().catch(() => { });
                    } else {
                        const audio = new Audio('/notification.mp3');
                        audio.play().catch(() => { });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, orderId]);

    if (loading || !order) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-primary" />
            </main>
        );
    }

    const { status: rawStatus, order_number, total_amount, delivery_method } = order;

    // ─── Status Resolution (Robust Mapping) ───
    const status = (rawStatus || "pending").toLowerCase();
    const isCancelled = status === "cancelled";

    const statusToStep: Record<string, number> = {
        pending: 0,
        preparing: 1,
        on_the_way: 2,
        delivered: 3,
    };

    const currentStep = statusToStep[status] ?? 0;

    // ─── Visual Helpers ───
    const activeStepData = currentStep >= 0 ? STEPS[currentStep] : null;
    const ActiveIcon = isCancelled ? XCircle : (activeStepData?.icon || CheckCircle2);
    const activeColor = isCancelled ? "text-red-500" : (activeStepData?.color || "text-primary");
    const activeBg = isCancelled ? "bg-red-500" : (activeStepData?.bg || "bg-primary");

    // Helper to get messaging
    const getMessage = () => {
        if (isCancelled) return "El pedido ha sido cancelado. Comunicate con el local para más información.";
        if (status === "pending") return "Estamos esperando que el local confirme tu pedido. Te avisaremos enseguida.";
        if (status === "preparing") return "Tu pedido ya está en la cocina. Preparando todo con mucho cuidado.";
        if (status === "on_the_way") {
            return delivery_method === "DELIVERY"
                ? "Tu pedido ya salió. Está en camino a tu dirección."
                : "Tu pedido está listo. Date una vuelta por el local a retirarlo.";
        }
        if (status === "delivered") return "¡Disfrutá tu pedido! Gracias por elegirnos.";
        return "Estamos procesando tu pedido...";
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 px-4 py-8 relative overflow-hidden">
            {/* Nav Back */}
            <div className="w-full max-w-sm mb-8 z-10">
                <Link href={`/${tenant}`} className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition">
                    <ChevronLeft size={16} /> Volver al menú
                </Link>
            </div>

            {/* Glowing orb accent */}
            <div
                className={`pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 -z-10 h-72 w-full max-w-lg bg-[radial-gradient(ellipse_at_top_center,var(--tw-gradient-stops))] opacity-15 transition-all duration-1000 ${isCancelled ? 'from-red-500 to-transparent' : 'from-primary to-transparent'}`}
            />

            {/* Icon */}
            <div className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-900/50 backdrop-blur-md ring-2 ring-offset-4 ring-offset-zinc-950 shadow-2xl transition-all duration-700 ${isCancelled ? 'ring-red-500/50 shadow-red-500/20 text-red-500' : 'ring-primary/40 shadow-[0_0_40px_var(--brand-color)] shadow-primary/20 text-primary'}`}>
                <ActiveIcon className={`h-12 w-12 ${activeColor} drop-shadow-md`} />
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

            {/* Progress stepper (Hide if cancelled) */}
            {!isCancelled && (
                <div className="mb-12 w-full max-w-[320px]">
                    <div className="relative flex items-center justify-between">
                        {/* Connecting track background */}
                        <div className="absolute left-[10%] right-[10%] top-4 h-1 bg-zinc-800/80 rounded-full" />

                        {/* Active Progress Line */}
                        <div
                            className="absolute left-[10%] top-4 h-1 bg-primary transition-all duration-700 rounded-full shadow-[0_0_10px_var(--brand-color)] shadow-primary/50"
                            style={{ width: `${(currentStep / (STEPS.length - 1)) * 80}%` }}
                        />

                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            // Pending shows as complete immediately, else only if passed
                            const isDone = idx <= currentStep;
                            const isCurrent = idx === currentStep;

                            return (
                                <div key={step.key} className="relative flex flex-col items-center gap-2 w-16">
                                    <div
                                        className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border-[3px] transition-all duration-500 ${isDone
                                            ? `border-primary bg-zinc-950 text-primary shadow-[0_0_15px_var(--brand-color)] shadow-primary/30 scale-110`
                                            : "border-zinc-800 bg-zinc-950 text-zinc-600"
                                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                                    >
                                        <Icon size={16} className={isDone ? "" : "opacity-50"} />
                                    </div>
                                    <span className={`text-center transition-colors duration-300 font-bold tracking-tight text-[10px] uppercase ${isDone ? "text-zinc-200" : "text-zinc-600"}`}>
                                        {step.label.split(" ")[0]}
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
                        <p className="text-lg font-bold text-white drop-shadow-sm">
                            {currentStep === 0 ? "A confirmar" : "30–45 minutos"}
                        </p>
                    </div>
                </div>
            )}

            <div className="mt-auto w-full pt-6 border-t border-zinc-900 flex flex-col items-center pb-12">
                {/* Order ID for support */}
                <p className="mb-6 text-center text-[10px] uppercase font-bold tracking-widest text-zinc-600">
                    ID Transacción: <span className="font-mono text-zinc-400">{orderId.slice(0, 8)}</span>
                </p>
                <div className="flex gap-4">
                    <button onClick={() => window.location.reload()} className="text-xs font-semibold text-zinc-500 hover:text-white transition underline underline-offset-4 decoration-zinc-700">Actualizar</button>
                </div>
            </div>

        </main>
    );
}
