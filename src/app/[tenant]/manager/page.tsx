"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    CheckCircle2, Clock, Phone, MapPin, Package, Truck,
    Loader2, Undo2, ChefHat, Bike, PartyPopper, Receipt, X, MessageCircle, Edit3, AlertCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { PrintableReceipt } from "@/components/PrintableReceipt";

// ── Types ────────────────────────────────────────────────────────────────────
interface Order {
    id: string;
    order_number: number;
    first_name: string;
    last_name: string;
    customer_phone: string;
    customer_address: string;
    delivery_method: string;
    delivery_time: string;
    payment_method: string;
    is_asap: boolean;
    scheduled_time: string | null;
    estimated_time: string | null;
    total_amount: number;
    status: string;
    created_at: string;
    receipt_url: string | null;
    order_items?: {
        quantity: number;
        notes: string | null;
        product?: { name: string } | null;
    }[];
    extra_charge?: number;
    internal_notes?: string | null;
}

// ── Tab config ───────────────────────────────────────────────────────────────
type TabKey = "pending" | "preparing" | "on_the_way" | "delivered";

const TABS: { key: TabKey; label: string; statuses: string[]; icon: React.ElementType; color: string; ringColor: string }[] = [
    { key: "pending", label: "RECIBIDOS", statuses: ["pending"], icon: Package, color: "text-primary", ringColor: "ring-primary/30" },
    { key: "preparing", label: "CONFIRMADOS", statuses: ["preparing"], icon: ChefHat, color: "text-amber-400", ringColor: "ring-amber-400/30" },
    { key: "on_the_way", label: "DESPACHADOS", statuses: ["on_the_way"], icon: Bike, color: "text-sky-400", ringColor: "ring-sky-400/30" },
    { key: "delivered", label: "FINALIZADOS", statuses: ["delivered"], icon: PartyPopper, color: "text-emerald-400", ringColor: "ring-emerald-400/30" },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function LiveOrdersPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = React.use(params);
    const supabase = createClient();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [tenantName, setTenantName] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("pending");
    const [receiptModal, setReceiptModal] = useState<string | null>(null);
    const [printingOrder, setPrintingOrder] = useState<{ order: Order, type: 'kitchen' | 'delivery' } | null>(null);
    const [tenantSettings, setTenantSettings] = useState<{ enable_kitchen_tickets: boolean; enable_delivery_tickets: boolean } | null>(null);
    const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
    const [customTime, setCustomTime] = useState<string>("");

    // ── Adjustment State ──
    const [adjustingOrder, setAdjustingOrder] = useState<Order | null>(null);
    const [extraChargeAmount, setExtraChargeAmount] = useState<string>("");
    const [adjustmentNotes, setAdjustmentNotes] = useState<string>("");
    const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);

    // ── Fetch all orders (including delivered for the Finalizados tab) ────
    useEffect(() => {
        const fetchOrders = async () => {
            const { data: tenantData } = await supabase
                .from("tenants")
                .select("id, name, enable_kitchen_tickets, enable_delivery_tickets")
                .eq("slug", tenant)
                .single();

            if (!tenantData) return;
            setTenantId(tenantData.id);
            setTenantName(tenantData.name);
            setTenantSettings({
                enable_kitchen_tickets: !!tenantData.enable_kitchen_tickets,
                enable_delivery_tickets: !!tenantData.enable_delivery_tickets
            });

            const { data: initialOrders } = await supabase
                .from("orders")
                .select("*, order_items(*, product:products(name))")
                .eq("tenant_id", tenantData.id)
                .in("status", ["pending", "preparing", "on_the_way", "delivered"])
                .order("created_at", { ascending: false })
                .limit(200);

            if (initialOrders) setOrders(initialOrders as unknown as Order[]);
            setLoading(false);
        };

        fetchOrders();
    }, [supabase, tenant]);

    // ── Realtime ─────────────────────────────────────────────────────────
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
                    const { data: fullOrder } = await supabase
                        .from("orders")
                        .select("*, order_items(*, product:products(name))")
                        .eq("id", newOrderRow.id)
                        .single();

                    const newOrder = (fullOrder || newOrderRow) as unknown as Order;
                    setOrders((prev) => [newOrder, ...prev]);

                    toast("¡🔔 Nuevo pedido recibido!", {
                        description: `#${newOrder.order_number} - ${newOrder.first_name} ${newOrder.last_name}`,
                        className: "border-primary bg-primary/10 text-primary shadow-xl",
                        duration: 5000,
                    });
                    const audio = new Audio("/timbrenotificacion.mp3");
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
                    const updated = payload.new as Order;
                    if (updated.status === "cancelled") {
                        setOrders((prev) => prev.filter((o) => o.id !== updated.id));
                    } else {
                        setOrders((prev) =>
                            prev.map((o) =>
                                o.id === updated.id ? { ...o, ...updated } : o
                            )
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, tenantId]);

    // ── Update order status ──────────────────────────────────────────────
    const updateOrderStatus = async (orderId: string, currentStatus: string, newStatus: string, estimatedTime?: string) => {
        const orderRef = orders.find((o) => o.id === orderId);

        setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: "loading" } : o))
        );

        const updateData: any = { status: newStatus };
        if (estimatedTime) {
            updateData.estimated_time = estimatedTime;
        }

        const { error } = await supabase
            .from("orders")
            .update(updateData)
            .eq("id", orderId);

        if (error) {
            toast.error("Error al actualizar", {
                description: error.message.includes("check constraint")
                    ? `Estado '${newStatus}' no permitido.`
                    : error.message,
            });
            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status: currentStatus } : o))
            );
        } else {
            const isTakeaway = orderRef?.delivery_method !== "DELIVERY";
            const msgs: Record<string, string> = {
                pending: "Pedido devuelto a Recibidos.",
                preparing: "¡Pedido confirmado!",
                on_the_way: isTakeaway ? "¡Pedido listo para retirar!" : "¡Pedido despachado!",
                delivered: "Pedido finalizado.",
                cancelled: "Pedido rechazado.",
            };

            const message = msgs[newStatus] || "Estado actualizado.";

            if ((newStatus === "on_the_way" || newStatus === "preparing") && orderRef?.customer_phone) {
                toast.success(message, {
                    description: "¿Querés avisarle al cliente por WhatsApp?",
                    action: {
                        label: "Avisar 👋",
                        onClick: () => handleWhatsAppNotify(orderRef),
                    },
                    duration: 8000,
                });
            } else {
                toast.success(message);
            }

            setConfirmingOrderId(null);
            setCustomTime("");
        }
    };

    // ── Handle Adjustment ────────────────────────────────────────────────
    const handleAdjustOrder = async () => {
        if (!adjustingOrder) return;
        setIsSavingAdjustment(true);

        const charge = parseFloat(extraChargeAmount) || 0;
        const newTotal = (adjustingOrder.total_amount - (adjustingOrder.extra_charge || 0)) + charge;

        const { error } = await supabase
            .from("orders")
            .update({
                extra_charge: charge,
                internal_notes: adjustmentNotes,
                total_amount: newTotal
            })
            .eq("id", adjustingOrder.id);

        if (error) {
            toast.error("Error al ajustar el pedido");
            console.error(error);
        } else {
            toast.success("Pedido ajustado correctamente");
            setOrders(prev => prev.map(o => o.id === adjustingOrder.id ? { ...o, extra_charge: charge, internal_notes: adjustmentNotes, total_amount: newTotal } : o));
            setAdjustingOrder(null);
            setExtraChargeAmount("");
            setAdjustmentNotes("");
        }
        setIsSavingAdjustment(false);
    };

    // ── Handle WhatsApp ──────────────────────────────────────────────────
    const handleWhatsAppNotify = (order: Order) => {
        if (!order.customer_phone) return;
        let phone = order.customer_phone.replace(/\D/g, "");
        if (phone.startsWith("0")) phone = phone.substring(1);
        if (phone.length === 10) phone = "549" + phone;

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pedidosposta.com';
        const trackingUrl = `${baseUrl}/${tenant}/order/${order.id}`;

        const isTakeaway = order.delivery_method !== "DELIVERY";
        let statusMsg = "confirmado";
        if (order.status === "on_the_way" && isTakeaway) statusMsg = "listo para retirar";
        else if (order.status === "on_the_way") statusMsg = "en camino a tu domicilio";
        else if (order.status === "preparing") statusMsg = "confirmado y en preparacion";
        else if (order.status === "delivered") statusMsg = "entregado. Que lo disfrutes";

        const fullText = "Hola " + order.first_name + ". Tu pedido #" + order.order_number + " de " + (tenantName || tenant) + " ya esta " + statusMsg + ". Seguilo aca: " + trackingUrl;

        const whatsappUrl = new URL('https://wa.me/' + phone);
        whatsappUrl.searchParams.set('text', fullText);
        window.open(whatsappUrl.toString(), "_blank");
    };

    // ── Handle Printing ──────────────────────────────────────────────────
    const handlePrint = (order: Order, type: 'kitchen' | 'delivery') => {
        setPrintingOrder({ order, type });
        setTimeout(() => {
            window.print();
        }, 100);
    };

    // ── Filtered orders for Active Tab ───────────────────────────────────
    const currentTabConfig = TABS.find((t) => t.key === activeTab)!;
    const rawFiltered = orders.filter((o) =>
        currentTabConfig.statuses.includes(o.status)
    );
    // Limit "Finalizados" to last 15 for performance
    const filteredOrders = activeTab === "delivered" ? rawFiltered.slice(0, 15) : rawFiltered;

    // Count badges
    const countByTab = (statuses: string[]) =>
        orders.filter((o) => statuses.includes(o.status)).length;

    // ── Loading State ────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex h-full min-h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-500">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                        Live Orders
                    </h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Monitor de estado de operaciones en tiempo real.
                    </p>
                </div>
            </div>

            {/* ── Tabs ───────────────────────────────────────────── */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const count = countByTab(tab.statuses);
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`group relative flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition-all active:scale-95
                                ${isActive
                                    ? `bg-zinc-800/80 ${tab.color} ring-1 ${tab.ringColor} shadow-lg`
                                    : "bg-zinc-900/40 text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                                }`}
                        >
                            <Icon size={15} className={isActive ? tab.color : "text-zinc-600"} />
                            {tab.label}
                            {count > 0 && (
                                <span className={`ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${isActive
                                    ? "bg-white/10 text-white"
                                    : "bg-zinc-800 text-zinc-500"
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Cards Grid ─────────────────────────────────────── */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full flex h-[35vh] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
                        <currentTabConfig.icon size={48} className="mb-4 text-zinc-700 opacity-40" />
                        <p className="text-base font-bold text-zinc-500">Sin pedidos {currentTabConfig.label.toLowerCase()}</p>
                        <p className="mt-1 max-w-xs text-center text-sm text-zinc-600">
                            Los pedidos aparecerán aquí cuando cambien a este estado.
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
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
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                                </span>
                                                <span className="text-red-400 ml-0.5">Lo antes posible</span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock size={14} className="opacity-70" />
                                                <span>
                                                    🕒 {order.scheduled_time
                                                        ? format(parseISO(order.scheduled_time), "HH:mm") + " hs"
                                                        : "No especificado"}
                                                </span>
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
                                    <div className="flex gap-1 ml-auto">
                                        {tenantSettings?.enable_kitchen_tickets && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePrint(order, 'kitchen'); }}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                                                title="Imprimir Comanda Cocina"
                                            >
                                                <ChefHat size={14} />
                                            </button>
                                        )}
                                        {tenantSettings?.enable_delivery_tickets && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePrint(order, 'delivery'); }}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                                                title="Imprimir Ticket Repartidor"
                                            >
                                                <Bike size={14} />
                                            </button>
                                        )}
                                        {(order.status === "pending" || order.status === "preparing") && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAdjustingOrder(order);
                                                    setExtraChargeAmount(order.extra_charge?.toString() || "");
                                                    setAdjustmentNotes(order.internal_notes || "");
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                                                title="Ajustar Pedido"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                        )}
                                    </div>
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

                                {/* Items */}
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
                                        <div className="flex flex-col">
                                            <span className="text-xs uppercase tracking-widest text-zinc-500">Total Pago</span>
                                            {order.extra_charge && order.extra_charge > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] text-amber-500/80 group/note relative cursor-help">
                                                    <AlertCircle size={10} />
                                                    <span>Incluye ajuste: +${order.extra_charge}</span>
                                                    {order.internal_notes && (
                                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/note:block w-48 rounded-lg bg-zinc-950 p-2 text-[10px] font-normal text-zinc-300 ring-1 ring-zinc-800 shadow-xl z-50">
                                                            {order.internal_notes}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-lg text-primary drop-shadow-sm font-mono">
                                            ${order.total_amount.toLocaleString("es-AR")}
                                        </span>
                                    </div>
                                </div>

                                {/* Receipt button */}
                                {order.receipt_url && (
                                    <button
                                        onClick={() => setReceiptModal(order.receipt_url)}
                                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 py-2.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/10 active:scale-95"
                                    >
                                        <Receipt size={14} />
                                        🧾 Ver Comprobante
                                    </button>
                                )}
                            </div>

                            {/* ── Card Actions (Bi-directional) ──── */}
                            <div className="border-t border-zinc-800/80 bg-zinc-950 p-4">
                                {order.status === "loading" && (
                                    <div className="flex w-full justify-center py-3.5">
                                        <Loader2 size={18} className="animate-spin text-zinc-500" />
                                    </div>
                                )}

                                {/* RECIBIDOS → CONFIRMAR / RECHAZAR */}
                                {order.status === "pending" && (
                                    <>
                                        {confirmingOrderId === order.id ? (
                                            <div className="flex flex-col gap-2 rounded-xl bg-zinc-900/60 p-3 ring-1 ring-zinc-700/50">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                    Tiempo estimado de entrega:
                                                </span>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={() => updateOrderStatus(order.id, "pending", "preparing", "20-30 min")} className="rounded-lg bg-zinc-800 p-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition">Rápido (20-30m)</button>
                                                    <button onClick={() => updateOrderStatus(order.id, "pending", "preparing", "40-45 min")} className="rounded-lg bg-zinc-800 p-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition">Normal (40-45m)</button>
                                                    <button onClick={() => updateOrderStatus(order.id, "pending", "preparing", "60-80 min")} className="rounded-lg bg-zinc-800 p-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition col-span-2">Demorado (60-80m)</button>
                                                </div>
                                                <div className="flex gap-2 mt-1">
                                                    <input
                                                        placeholder="Personalizado (ej: 90 min)"
                                                        value={customTime}
                                                        onChange={(e) => setCustomTime(e.target.value)}
                                                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-primary"
                                                    />
                                                    <button
                                                        onClick={() => customTime && updateOrderStatus(order.id, "pending", "preparing", customTime)}
                                                        disabled={!customTime}
                                                        className="rounded-lg bg-primary px-3 text-xs font-bold text-[#09090b] disabled:opacity-50"
                                                    >
                                                        OK
                                                    </button>
                                                </div>
                                                <button onClick={() => { setConfirmingOrderId(null); setCustomTime(""); }} className="mt-1 text-center text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-white">
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setConfirmingOrderId(order.id)}
                                                    className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold tracking-wider text-primary-foreground shadow-[0_4px_14px_0_var(--brand-color)] shadow-primary/40 transition-all hover:brightness-110 active:scale-95"
                                                >
                                                    <CheckCircle2 size={18} />
                                                    CONFIRMAR
                                                </button>
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, "pending", "cancelled")}
                                                    className="flex-1 items-center justify-center rounded-xl bg-red-500/10 py-3.5 text-xs font-bold tracking-widest text-red-400 ring-1 ring-inset ring-red-500/20 transition-all hover:bg-red-500/20 active:scale-95 text-center"
                                                >
                                                    RECHAZAR
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* CONFIRMADOS → DESPACHAR / ← Volver a Recibido */}
                                {order.status === "preparing" && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateOrderStatus(order.id, "preparing", "on_the_way")}
                                            className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-sky-500/10 py-3.5 text-sm font-extrabold tracking-wider text-sky-400 ring-1 ring-inset ring-sky-500/20 transition-all hover:bg-sky-500/20 active:scale-95"
                                        >
                                            <Truck size={18} />
                                            DESPACHAR
                                        </button>
                                        <button
                                            onClick={() => updateOrderStatus(order.id, "preparing", "pending")}
                                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800/50 py-3.5 text-xs font-bold tracking-wider text-zinc-400 ring-1 ring-inset ring-zinc-700/50 transition-all hover:bg-zinc-700/30 hover:text-zinc-300 active:scale-95"
                                        >
                                            <Undo2 size={14} />
                                            RECIBIDO
                                        </button>
                                        {order.customer_phone && (
                                            <button onClick={() => handleWhatsAppNotify(order)} className="flex-none w-[52px] flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20 transition active:scale-95">
                                                <MessageCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* DESPACHADOS → FINALIZAR / ← Volver a Confirmado */}
                                {order.status === "on_the_way" && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateOrderStatus(order.id, "on_the_way", "delivered")}
                                            className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-3.5 text-sm font-extrabold tracking-wider text-emerald-400 ring-1 ring-inset ring-emerald-500/20 transition-all hover:bg-emerald-500/20 active:scale-95"
                                        >
                                            <CheckCircle2 size={18} />
                                            FINALIZAR
                                        </button>
                                        <button
                                            onClick={() => updateOrderStatus(order.id, "on_the_way", "preparing")}
                                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800/50 py-3.5 text-xs font-bold tracking-wider text-zinc-400 ring-1 ring-inset ring-zinc-700/50 transition-all hover:bg-zinc-700/30 hover:text-zinc-300 active:scale-95"
                                        >
                                            <Undo2 size={14} />
                                            CONFIRMAR
                                        </button>
                                        {order.customer_phone && (
                                            <button onClick={() => handleWhatsAppNotify(order)} className="flex-none w-[52px] flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20 transition active:scale-95">
                                                <MessageCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* FINALIZADOS → ← Volver a Despachado */}
                                {order.status === "delivered" && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateOrderStatus(order.id, "delivered", "on_the_way")}
                                            className="flex-[3] flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800/50 py-3.5 text-xs font-bold tracking-wider text-zinc-400 ring-1 ring-inset ring-zinc-700/50 transition-all hover:bg-zinc-700/30 hover:text-zinc-300 active:scale-95"
                                        >
                                            <Undo2 size={14} />
                                            VOLVER A DESPACHADO
                                        </button>
                                        {order.customer_phone && (
                                            <button onClick={() => handleWhatsAppNotify(order)} className="flex-1 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20 transition active:scale-95">
                                                <MessageCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Receipt viewer modal ── */}
            {
                receiptModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setReceiptModal(null)}>
                        <div className="relative max-h-[90vh] max-w-lg w-full mx-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Receipt size={16} className="text-amber-400" />
                                    Comprobante de Transferencia
                                </h3>
                                <button onClick={() => setReceiptModal(null)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-4 overflow-auto max-h-[calc(90vh-60px)]">
                                {receiptModal.endsWith(".pdf") ? (
                                    <iframe src={receiptModal} className="w-full h-[70vh] rounded-lg" />
                                ) : (
                                    <img src={receiptModal} alt="Comprobante" className="w-full rounded-lg object-contain" />
                                )}
                            </div>
                            <div className="border-t border-zinc-800 px-5 py-3">
                                <a
                                    href={receiptModal}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/10 py-2.5 text-xs font-bold text-amber-400 ring-1 ring-inset ring-amber-500/20 transition hover:bg-amber-500/20"
                                >
                                    Abrir en nueva pestaña
                                </a>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ── Adjustment Modal ── */}
            {
                adjustingOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setAdjustingOrder(null)}>
                        <div className="relative w-full max-w-md mx-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Edit3 size={18} className="text-primary" />
                                    Ajustar Pedido #{adjustingOrder.order_number}
                                </h3>
                                <button onClick={() => setAdjustingOrder(null)} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-center rounded-xl bg-zinc-900/50 p-4 border border-zinc-800">
                                    <span className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Total de la Orden</span>
                                    <span className="text-xl font-black text-white font-mono">
                                        ${(adjustingOrder.total_amount - (adjustingOrder.extra_charge || 0)).toLocaleString("es-AR")}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Monto extra a sumar ($)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={extraChargeAmount}
                                            onChange={(e) => setExtraChargeAmount(e.target.value)}
                                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Detalle o Motivos (Interno)</label>
                                        <textarea
                                            placeholder="Ej: +1 Papas grandes pedidas por WhatsApp"
                                            value={adjustmentNotes}
                                            onChange={(e) => setAdjustmentNotes(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none text-sm"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-sm font-bold text-zinc-300">NUEVO TOTAL:</span>
                                            <span className="text-2xl font-black text-primary font-mono scale-110">
                                                ${((adjustingOrder.total_amount - (adjustingOrder.extra_charge || 0)) + (parseFloat(extraChargeAmount) || 0)).toLocaleString("es-AR")}
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleAdjustOrder}
                                            disabled={isSavingAdjustment}
                                            className="w-full py-4 rounded-xl bg-primary text-[#09090b] font-black uppercase tracking-widest shadow-[0_4px_14px_0_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isSavingAdjustment ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 size={18} className="animate-spin" /> Guardando...
                                                </span>
                                            ) : "Confirmar Ajuste"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ── Hidden Printable Area ── */}
            {
                printingOrder && (
                    <div className="hidden print:block">
                        <PrintableReceipt
                            order={printingOrder.order}
                            tenant={{ name: tenantName }}
                            type={printingOrder.type}
                        />
                    </div>
                )
            }
        </div >
    );
}
