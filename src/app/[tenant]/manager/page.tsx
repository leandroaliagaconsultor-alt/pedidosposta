"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Clock, Phone, MapPin, Package, Truck, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Order {
    id: string;
    order_number: number;
    first_name: string;
    last_name: string;
    customer_phone: string;
    customer_address: string;
    delivery_method: string;
    delivery_time: string;
    is_asap: boolean;
    scheduled_time: string | null;
    total_amount: number;
    status: string;
    created_at: string;
    order_items?: {
        quantity: number;
        notes: string | null;
        product?: { name: string } | null;
    }[];
}

export default function LiveOrdersPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = React.use(params);
    const supabase = createClient();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState<string | null>(null);

    // ── Fetch Initial Data ──
    useEffect(() => {
        const fetchOrders = async () => {
            // 1. Get tenant ID from slug
            const { data: tenantData } = await supabase
                .from("tenants")
                .select("id")
                .eq("slug", tenant)
                .single();

            if (!tenantData) return;
            setTenantId(tenantData.id);

            // 2. Fetch pending and active orders
            const { data: initialOrders } = await supabase
                .from("orders")
                .select("*, order_items(*, product:products(name))")
                .eq("tenant_id", tenantData.id)
                .in("status", ["pending", "preparing", "on_the_way"])
                .order("created_at", { ascending: false });

            if (initialOrders) setOrders(initialOrders as unknown as Order[]);
            setLoading(false);
        };

        fetchOrders();
    }, [supabase, tenant]);

    // ── Realtime Subscription ──
    useEffect(() => {
        if (!tenantId) return;

        const channel = supabase
            .channel("live-orders")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "orders",
                    filter: `tenant_id=eq.${tenantId}`,
                },
                async (payload) => {
                    const newOrderRow = payload.new as Order;

                    // Fetch full order to get items
                    const { data: fullOrder } = await supabase
                        .from("orders")
                        .select("*, order_items(*, product:products(name))")
                        .eq("id", newOrderRow.id)
                        .single();

                    const newOrder = (fullOrder || newOrderRow) as unknown as Order;

                    setOrders((prev) => [newOrder, ...prev]);

                    // Toast Notification with Sound fallback
                    toast("¡🔔 Nuevo pedido recibido!", {
                        description: `#${newOrder.order_number} - ${newOrder.first_name} ${newOrder.last_name}`,
                        className: "border-primary bg-primary/10 text-primary shadow-xl",
                        duration: 5000,
                    });
                    const audio = new Audio('/notification.mp3');
                    audio.play().catch(() => { });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "orders",
                    filter: `tenant_id=eq.${tenantId}`,
                },
                (payload) => {
                    const updatedOrder = payload.new as Order;
                    if (["delivered", "cancelled"].includes(updatedOrder.status)) {
                        // Remove from active view if finalized
                        setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
                    } else {
                        // Update inline but keep order_items intact if new update doesn't bring it
                        setOrders((prev) =>
                            prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, tenantId]);

    // ── Actions ──
    const updateOrderStatus = async (orderId: string, currentStatus: string, newStatus: string) => {
        // Optimistic UI Update
        setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: "loading" } : o))
        );

        const { error } = await supabase
            .from("orders")
            .update({ status: newStatus })
            .eq("id", orderId);

        if (error) {
            console.error("Order Update Error:", error);
            toast.error("Error al actualizar la orden", {
                description: error.message.includes("check constraint")
                    ? `Estado '${newStatus}' no permitido por la DB.`
                    : error.message
            });
            // Revert optimism
            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status: currentStatus } : o))
            );
        } else {
            let msg = "";
            if (newStatus === "preparing") msg = "¡Pedido en preparación!";
            if (newStatus === "on_the_way") msg = "¡Pedido en camino!";
            if (newStatus === "delivered") msg = "Pedido finalizado.";
            if (newStatus === "cancelled") msg = "Pedido rechazado/cancelado.";
            toast.success(msg);
        }
    };

    // ── UI Shell ──
    if (loading) {
        return (
            <div className="flex h-full min-h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                        Live Orders
                    </h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Monitor de estado de operaciones en tiempo real.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-5 py-2.5 text-sm shadow-[inset_0_1px_4px_rgba(0,0,0,0.4)] backdrop-blur-md">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_8px_var(--brand-color)]" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-300">Conectado a Reactor</span>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {orders.length === 0 ? (
                    <div className="col-span-full flex h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
                        <Package size={52} className="mb-4 text-zinc-700 opacity-50" />
                        <p className="text-lg font-bold text-zinc-400">Todo limpio.</p>
                        <p className="mt-1 max-w-xs text-center text-sm text-zinc-600">Cuando un cliente finalice un pedido, lo vas a escuchar y ver brillar aquí.</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div
                            key={order.id}
                            className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-zinc-900/30 shadow-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-primary/5 ${order.status === "pending"
                                ? "border-primary/50 ring-1 ring-primary/20"
                                : "border-zinc-800"
                                }`}
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/80 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center rounded-md bg-zinc-800 px-2.5 py-1 font-mono text-sm font-bold text-zinc-300 ring-1 ring-inset ring-zinc-700">
                                        #{order.order_number}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                                        {order.is_asap ? (
                                            <>
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                                <span className="text-red-400 ml-0.5">Lo antes posible</span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock size={14} className="opacity-70" />
                                                <span>🕒 Programado para: {order.scheduled_time ? format(parseISO(order.scheduled_time), "HH:mm") + " hs" : "No especificado"}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${order.delivery_method === "DELIVERY"
                                        ? "bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20"
                                        : "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
                                        }`}
                                >
                                    {order.delivery_method === "DELIVERY" ? <Truck size={14} /> : <Package size={14} />}
                                    {order.delivery_method}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="flex flex-1 flex-col px-5 py-4">
                                <h3 className="text-xl font-extrabold tracking-tight text-white mb-1">
                                    {order.first_name} {order.last_name || ""}
                                </h3>
                                <div className="mt-2 space-y-2.5 text-sm text-zinc-400">
                                    {order.customer_phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} className="text-zinc-500" />
                                            <span className="font-mono text-zinc-300">{order.customer_phone}</span>
                                        </div>
                                    )}
                                    {order.delivery_method === "DELIVERY" && order.customer_address && (
                                        <div className="flex items-start gap-2">
                                            <MapPin size={14} className="mt-0.5 flex-shrink-0 text-zinc-500" />
                                            <span className="font-medium text-zinc-300 line-clamp-2">{order.customer_address}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Order Items List */}
                                {order.order_items && order.order_items.length > 0 && (
                                    <div className="mt-4 rounded-xl bg-zinc-900/50 p-3 ring-1 ring-zinc-800/50">
                                        <ul className="space-y-2">
                                            {order.order_items.map((item, index) => (
                                                <li key={index} className="text-sm font-medium">
                                                    <div className="flex items-start text-zinc-200">
                                                        <span className="mr-2 font-bold text-primary">{item.quantity}x</span>
                                                        <span>{item.product?.name || "Producto sin nombre"}</span>
                                                    </div>
                                                    {item.notes && (
                                                        <p className="ml-6 mt-0.5 text-xs font-normal text-zinc-500">
                                                            Nota: {item.notes}
                                                        </p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="mt-auto pt-6">
                                    <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3 font-bold">
                                        <span className="text-xs uppercase tracking-widest text-zinc-500">Total Pago</span>
                                        <span className="text-lg text-primary drop-shadow-sm font-mono">
                                            ${order.total_amount.toLocaleString("es-AR")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Actions Container */}
                            <div className="border-t border-zinc-800/80 bg-zinc-950 p-4">
                                {order.status === "pending" && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateOrderStatus(order.id, "pending", "preparing")}
                                            className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold tracking-wider text-primary-foreground shadow-[0_4px_14px_0_var(--brand-color)] shadow-primary/40 transition-all hover:brightness-110 active:scale-95"
                                        >
                                            <CheckCircle2 size={18} />
                                            ACEPTAR
                                        </button>
                                        <button
                                            onClick={() => updateOrderStatus(order.id, "pending", "cancelled")}
                                            className="flex-1 items-center justify-center rounded-xl bg-red-500/10 py-3.5 text-xs font-bold tracking-widest text-red-400 ring-1 ring-inset ring-red-500/20 transition-all hover:bg-red-500/20 active:scale-95 text-center"
                                        >
                                            RECHAZAR
                                        </button>
                                    </div>
                                )}

                                {order.status === "preparing" && (
                                    <div className="flex gap-2">
                                        {order.delivery_method === "DELIVERY" ? (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, "preparing", "on_the_way")}
                                                className="flex-1 items-center justify-center rounded-xl bg-sky-500/10 py-3 text-xs font-bold tracking-widest text-sky-400 ring-1 ring-inset ring-sky-500/20 transition-all hover:bg-sky-500/20 active:scale-95 text-center"
                                            >
                                                DESPACHAR
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, "preparing", "delivered")}
                                                className="flex-1 items-center justify-center rounded-xl bg-emerald-500/10 py-3 text-xs font-bold tracking-widest text-emerald-400 ring-1 ring-inset ring-emerald-500/20 transition-all hover:bg-emerald-500/20 active:scale-95 text-center"
                                            >
                                                ENTREGAR LOCAL
                                            </button>
                                        )}
                                        {order.delivery_method === "DELIVERY" && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, "preparing", "delivered")}
                                                className="items-center justify-center rounded-xl bg-emerald-500/10 px-4 text-xs font-bold tracking-widest text-emerald-400 ring-1 ring-inset ring-emerald-500/20 transition-all hover:bg-emerald-500/20 active:scale-95 text-center"
                                            >
                                                <CheckCircle2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {order.status === "on_the_way" && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, "on_the_way", "delivered")}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-3 text-xs font-bold tracking-widest text-emerald-400 ring-1 ring-inset ring-emerald-500/20 transition-all hover:bg-emerald-500/20 active:scale-95"
                                    >
                                        <CheckCircle2 size={16} />
                                        MARCAR ENTREGADO
                                    </button>
                                )}

                                {order.status === "loading" && (
                                    <div className="flex w-full justify-center py-3.5">
                                        <Loader2 size={18} className="animate-spin text-zinc-500" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
