"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    CheckCircle2, Clock, Phone, MapPin, Package, Truck, CreditCard,
    Loader2, Undo2, ChefHat, Bike, PartyPopper, Receipt, MessageCircle, Edit3, AlertCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { PrintableReceipt } from "@/components/PrintableReceipt";
import { ReceiptModal } from "@/components/manager/ReceiptModal";
import { AdjustmentModal } from "@/components/manager/AdjustmentModal";

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
    push_subscription?: any;
    table_number?: string | null;
    delivery_notes?: string | null;
}

// ── Tab config ───────────────────────────────────────────────────────────────
type TabKey = "pending" | "preparing" | "on_the_way" | "delivered";

const TABS: { key: TabKey; label: string; statuses: string[]; icon: React.ElementType; color: string; ringColor: string; borderColor: string }[] = [
    { key: "pending", label: "RECIBIDOS", statuses: ["pending"], icon: Package, color: "text-primary", ringColor: "ring-primary/30", borderColor: "border-t-primary" },
    { key: "preparing", label: "CONFIRMADOS", statuses: ["preparing"], icon: ChefHat, color: "text-amber-400", ringColor: "ring-amber-400/30", borderColor: "border-t-amber-400" },
    { key: "on_the_way", label: "DESPACHADOS", statuses: ["on_the_way"], icon: Bike, color: "text-sky-400", ringColor: "ring-sky-400/30", borderColor: "border-t-sky-400" },
    { key: "delivered", label: "FINALIZADOS", statuses: ["delivered"], icon: PartyPopper, color: "text-emerald-400", ringColor: "ring-emerald-400/30", borderColor: "border-t-emerald-400" },
];

// ── Tiempo transcurrido ─────────────────────────────────────────────────────
function TimeAgo({ createdAt }: { createdAt: string }) {
    const [ago, setAgo] = React.useState("");
    React.useEffect(() => {
        const calc = () => {
            const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
            if (diff < 1) setAgo("ahora");
            else if (diff < 60) setAgo(`hace ${diff} min`);
            else setAgo(`hace ${Math.floor(diff / 60)}h ${diff % 60}m`);
        };
        calc();
        const interval = setInterval(calc, 30000);
        return () => clearInterval(interval);
    }, [createdAt]);
    return <span className="text-[10px] font-medium text-[#575757]/70">{ago}</span>;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function LiveOrdersPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = React.use(params);
    const router = useRouter();
    const supabase = createClient();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [tenantName, setTenantName] = useState<string | null>(null);
    const [tenantLogo, setTenantLogo] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("pending");
    const [receiptModal, setReceiptModal] = useState<string | null>(null);
    const [printingOrder, setPrintingOrder] = useState<{ order: Order, type: 'kitchen' | 'delivery' } | null>(null);
    const [tenantSettings, setTenantSettings] = useState<{ enable_kitchen_tickets: boolean; enable_delivery_tickets: boolean } | null>(null);
    const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
    const [customTime, setCustomTime] = useState<string>("");

    // ── Adjustment State ──
    const [adjustingOrder, setAdjustingOrder] = useState<Order | null>(null);

    // ── Fetch all orders (including delivered for the Finalizados tab) ────
    useEffect(() => {
        const fetchOrders = async () => {
            const { data: tenantData, error: tenantError } = await supabase
                .from("tenants")
                .select("id, name, logo_url, enable_kitchen_tickets, enable_delivery_tickets")
                .eq("slug", tenant)
                .single();

            if (tenantError || !tenantData) {
                setLoading(false);
                return;
            }
            setTenantId(tenantData.id);
            setTenantName(tenantData.name);
            setTenantLogo(tenantData.logo_url);
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
                async (payload: any) => {
                    const newOrderRow = payload.new as Order;
                    if (newOrderRow.status === "awaiting_payment") return;

                    // Fetch con items — retry si 406 (sesión refrescándose)
                    let fullOrder: any = null;
                    for (let attempt = 0; attempt < 2; attempt++) {
                        const { data, error: fetchErr } = await supabase
                            .from("orders")
                            .select("*, order_items(*, product:products(name))")
                            .eq("id", newOrderRow.id)
                            .eq("tenant_id", tenantId)
                            .maybeSingle();

                        if (!fetchErr && data) { fullOrder = data; break; }
                        if (attempt === 0) await new Promise(r => setTimeout(r, 500));
                    }
                    if (!fullOrder) return;
                    const newOrder = fullOrder as unknown as Order;

                    // Evitar duplicados si el realtime dispara dos veces
                    setOrders((prev) => {
                        if (prev.some((o) => o.id === newOrder.id)) return prev;
                        return [newOrder, ...prev];
                    });

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
                async (payload: any) => {
                    const updated = payload.new as Order;

                    if (updated.status === "cancelled" || updated.status === "awaiting_payment") {
                        setOrders((prev) => prev.filter((o) => o.id !== updated.id));
                        return;
                    }

                    // Verificar si la orden ya existe en el estado local
                    setOrders((prev) => {
                        const exists = prev.some((o) => o.id === updated.id);
                        if (exists) {
                            // Actualizar in-place conservando order_items existentes
                            return prev.map((o) =>
                                o.id === updated.id ? { ...o, ...updated } : o
                            );
                        }
                        return prev;
                    });

                    // Si no existía (ej: transición desde awaiting_payment), fetch completo UNA sola vez
                    // Usamos setOrders callback para obtener el estado actual y evitar stale closure
                    let needsFetch = false;
                    setOrders((prev) => {
                        if (!prev.some((o) => o.id === updated.id) && updated.status === "pending") {
                            needsFetch = true;
                        }
                        return prev;
                    });
                    if (needsFetch) {
                        let fullOrder: any = null;
                        for (let attempt = 0; attempt < 2; attempt++) {
                            const { data, error: fetchErr2 } = await supabase
                                .from("orders")
                                .select("*, order_items(*, product:products(name))")
                                .eq("id", updated.id)
                                .eq("tenant_id", tenantId)
                                .maybeSingle();
                            if (!fetchErr2 && data) { fullOrder = data; break; }
                            if (attempt === 0) await new Promise(r => setTimeout(r, 500));
                        }
                        if (fullOrder) {
                            setOrders((p) => {
                                if (p.some((o) => o.id === updated.id)) return p;
                                return [fullOrder as unknown as Order, ...p];
                            });
                            toast("¡💳 Pago confirmado! Nuevo pedido.", { duration: 5000 });
                            const audio = new Audio("/timbrenotificacion.mp3");
                            audio.play().catch(() => { });
                        }
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
            .eq("id", orderId)
            .eq("tenant_id", tenantId);

        if (error) {
            // Intercepción de fallos de sesión expirada
            if (error.code === 'PGRST301' || error.message?.toLowerCase().includes('jwt') || error.message?.toLowerCase().includes('expired')) {
                toast.error("Tu sesión ha expirado por seguridad. Redirigiendo...", { duration: 5000 });
                await supabase.auth.signOut();
                router.push('/login');
                return;
            }

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

            // ── 🔔 Send Push Notification ──
            if (orderRef?.push_subscription) {
                const title = "Actualización de tu pedido";
                let body = `El estado de tu pedido #${orderRef.order_number} es: ${newStatus}`;

                if (newStatus === "preparing") body = "¡Tu pedido fue confirmado! Ya está en preparación. 👨‍🍳";
                if (newStatus === "on_the_way") body = isTakeaway ? "¡Tu pedido está listo para retirar! 🏪" : "¡Tu pedido está en camino a tu domicilio! 🛵";
                if (newStatus === "delivered") body = "¡Pedido entregado! Que lo disfrutes. 🎉";
                if (newStatus === "cancelled") body = "Lo sentimos, tu pedido ha sido cancelado. ❌";

                fetch("/api/send-push", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        subscription: orderRef.push_subscription,
                        title,
                        body,
                        url: `${window.location.origin}/${tenant}/order/${orderId}`
                    })
                }).catch(err => console.error("Error sending push notify:", err));
            }
        }
    };

    // ── Handle Adjustment ────────────────────────────────────────────────
    const handleAdjustOrder = async (orderId: string, extraCharge: number, notes: string, newTotal: number): Promise<boolean> => {
        const { error } = await supabase
            .from("orders")
            .update({ extra_charge: extraCharge, internal_notes: notes, total_amount: newTotal })
            .eq("id", orderId)
            .eq("tenant_id", tenantId);

        if (error) {
            toast.error("Error al ajustar el pedido");
            console.error(error);
            return false;
        }
        toast.success("Pedido ajustado correctamente");
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, extra_charge: extraCharge, internal_notes: notes, total_amount: newTotal } : o));
        setAdjustingOrder(null);
        return true;
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

    // ── Filtered orders for Active Tab (memoized) ──────────────────────
    const currentTabConfig = TABS.find((t) => t.key === activeTab)!;
    const filteredOrders = React.useMemo(() => {
        const filtered = orders.filter((o) => currentTabConfig.statuses.includes(o.status));
        return activeTab === "delivered" ? filtered.slice(0, 15) : filtered;
    }, [orders, activeTab, currentTabConfig.statuses]);

    // Count badges (memoized)
    const tabCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        for (const tab of TABS) {
            counts[tab.key] = orders.filter((o) => tab.statuses.includes(o.status)).length;
        }
        return counts;
    }, [orders]);

    // ── Loading State ────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex h-full min-h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#575757]">En vivo</p>
                    <h1 className="font-['Archivo_Black',sans-serif] text-4xl tracking-tight mt-1">
                        Live <span className="text-[#43926A]">Orders</span>
                    </h1>
                    <p className="mt-1.5 text-sm text-[#575757]">
                        Monitor de estado de operaciones en tiempo real.
                    </p>
                </div>
            </div>

            {/* ── Tabs ───────────────────────────────────────────── */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const count = tabCounts[tab.key] || 0;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`group relative flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition-all active:scale-95
                                ${isActive
                                    ? `bg-[#E9E7E2]/80 ${tab.color} ring-1 ${tab.ringColor} shadow-lg`
                                    : "bg-[#FBF8F1]/40 text-[#575757] hover:bg-[#E9E7E2]/50 hover:text-[#0F1210]"
                                }`}
                        >
                            <Icon size={15} className={isActive ? tab.color : "text-[#575757]/70"} />
                            {tab.label}
                            {count > 0 && (
                                <span className={`ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${isActive
                                    ? "bg-white/10 text-[#0F1210]"
                                    : "bg-[#E9E7E2] text-[#575757]"
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Cards Grid ─────────────────────────────────────── */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full flex h-[35vh] flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(15,18,16,.12)] bg-[#FBF8F1]/20 backdrop-blur-sm">
                        <currentTabConfig.icon size={48} className="mb-4 text-[#575757]/50 opacity-40" />
                        <p className="text-base font-bold text-[#575757]">Sin pedidos {currentTabConfig.label.toLowerCase()}</p>
                        <p className="mt-1 max-w-xs text-center text-sm text-[#575757]/70">
                            Los pedidos aparecerán aquí cuando cambien a este estado.
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const statusTab = TABS.find(t => t.statuses.includes(order.status));
                        const borderClass = statusTab?.borderColor || "border-t-[rgba(15,18,16,.15)]";
                        return (
                        <div
                            key={order.id}
                            className={`flex h-full flex-col overflow-hidden rounded-2xl border-t-[3px] border border-[rgba(15,18,16,.12)]/60 bg-gradient-to-b from-white to-[#FBF8F1] shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-primary/5 ${borderClass} ${
                                order.is_asap && order.status === "pending"
                                    ? "shadow-[0_0_25px_-5px] shadow-red-500/15"
                                    : ""
                            }`}
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-[rgba(15,18,16,.12)]/50 bg-white px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <span className={`flex items-center justify-center rounded-lg px-3 py-1.5 font-mono text-lg font-black tracking-tight ring-1 ring-inset ${
                                        order.status === "pending"
                                            ? "bg-primary/10 text-primary ring-primary/20"
                                            : "bg-[#E9E7E2]/80 text-[#0F1210] ring-[rgba(15,18,16,.12)]"
                                    }`}>
                                        #{order.order_number}
                                    </span>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#575757]">
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
                                        <TimeAgo createdAt={order.created_at} />
                                    </div>
                                </div>
                                <div
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                                        order.delivery_method === "DELIVERY"
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
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9E7E2] text-[#575757] hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                                                title="Imprimir Comanda Cocina"
                                            >
                                                <ChefHat size={14} />
                                            </button>
                                        )}
                                        {tenantSettings?.enable_delivery_tickets && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePrint(order, 'delivery'); }}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9E7E2] text-[#575757] hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
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
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9E7E2] text-[#575757] hover:bg-[#E9E7E2] hover:text-[#0F1210] transition-colors"
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
                                <h3 className="text-xl font-extrabold tracking-tight text-[#0F1210] mb-1">
                                    {order.first_name} {order.last_name || ""}
                                </h3>
                                <div className="mt-2 space-y-2.5 text-sm text-[#575757]">
                                    {order.customer_phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} className="text-[#575757]" />
                                            <span className="font-mono text-[#0F1210]">{order.customer_phone}</span>
                                        </div>
                                    )}
                                    {order.delivery_method === "DELIVERY" && order.customer_address && (
                                        <div className="flex items-start gap-2">
                                            <MapPin size={14} className="mt-0.5 flex-shrink-0 text-[#575757]" />
                                            <span className="font-medium text-[#0F1210] line-clamp-2">{order.customer_address}</span>
                                        </div>
                                    )}
                                    {/* Payment method */}
                                    {order.payment_method && (
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={14} className="text-[#575757]" />
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                order.payment_method === "MERCADOPAGO" ? "bg-sky-500/10 text-sky-400" :
                                                order.payment_method === "TRANSFER" ? "bg-amber-500/10 text-amber-400" :
                                                "bg-emerald-500/10 text-emerald-400"
                                            }`}>
                                                {order.payment_method === "MERCADOPAGO" ? "MercadoPago" :
                                                 order.payment_method === "TRANSFER" ? "Transferencia" :
                                                 order.payment_method === "CASH" ? "Efectivo" : order.payment_method}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Items */}
                                {order.order_items && order.order_items.length > 0 && (
                                    <div className="mt-4 rounded-xl bg-[#FBF8F1]/50 p-3 ring-1 ring-[rgba(15,18,16,.12)]/50">
                                        <ul className="space-y-2">
                                            {order.order_items.map((item, index) => (
                                                <li key={index} className="text-sm font-medium">
                                                    <div className="flex items-start text-[#0F1210]">
                                                        <span className="mr-2 font-bold text-primary">{item.quantity}x</span>
                                                        <span>{item.product?.name || "Producto"}</span>
                                                    </div>
                                                    {item.notes && (
                                                        <p className="ml-6 mt-0.5 text-xs font-normal text-[#575757]">
                                                            Nota: {item.notes}
                                                        </p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="mt-auto pt-4">
                                    <div className="flex items-center justify-between rounded-xl bg-[#E9E7E2]/50 px-4 py-3 font-bold">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest text-[#575757]">Total</span>
                                            {order.extra_charge != null && order.extra_charge > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] text-amber-500/80 group/note relative cursor-help">
                                                    <AlertCircle size={10} />
                                                    <span>+${order.extra_charge} ajuste</span>
                                                    {order.internal_notes && (
                                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/note:block w-48 rounded-lg bg-white p-2 text-[10px] font-normal text-[#0F1210] ring-1 ring-[rgba(15,18,16,.12)] shadow-xl z-50">
                                                            {order.internal_notes}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xl text-primary drop-shadow-sm font-mono font-black">
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
                            <div className="border-t border-[rgba(15,18,16,.12)]/80 bg-white p-4">
                                {order.status === "loading" && (
                                    <div className="flex w-full justify-center py-3.5">
                                        <Loader2 size={18} className="animate-spin text-[#575757]" />
                                    </div>
                                )}

                                {/* RECIBIDOS → CONFIRMAR / RECHAZAR */}
                                {order.status === "pending" && (
                                    <>
                                        {confirmingOrderId === order.id ? (
                                            <div className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-[rgba(15,18,16,.12)]">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#575757]">
                                                    Tiempo estimado de entrega:
                                                </span>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={() => updateOrderStatus(order.id, "pending", "preparing", "20-30 min")} className="rounded-lg bg-[#E9E7E2] p-2 text-xs font-bold text-[#0F1210] hover:bg-[#E9E7E2] hover:text-[#0F1210] transition">Rápido (20-30m)</button>
                                                    <button onClick={() => updateOrderStatus(order.id, "pending", "preparing", "40-45 min")} className="rounded-lg bg-[#E9E7E2] p-2 text-xs font-bold text-[#0F1210] hover:bg-[#E9E7E2] hover:text-[#0F1210] transition">Normal (40-45m)</button>
                                                    <button onClick={() => updateOrderStatus(order.id, "pending", "preparing", "60-80 min")} className="rounded-lg bg-[#E9E7E2] p-2 text-xs font-bold text-[#0F1210] hover:bg-[#E9E7E2] hover:text-[#0F1210] transition col-span-2">Demorado (60-80m)</button>
                                                </div>
                                                <div className="flex gap-2 mt-1">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="240"
                                                        placeholder="Minutos (ej: 45)"
                                                        value={customTime}
                                                        onChange={(e) => setCustomTime(e.target.value)}
                                                        className="flex-1 rounded-lg border border-[rgba(15,18,16,.15)] bg-white px-2 py-1 text-xs text-[#0F1210] outline-none focus:border-primary"
                                                    />
                                                    <button
                                                        onClick={() => customTime && updateOrderStatus(order.id, "pending", "preparing", `${customTime} min`)}
                                                        disabled={!customTime}
                                                        className="rounded-lg bg-primary px-3 text-xs font-bold text-[#09090b] disabled:opacity-50"
                                                    >
                                                        OK
                                                    </button>
                                                </div>
                                                <button onClick={() => { setConfirmingOrderId(null); setCustomTime(""); }} className="mt-1 text-center text-[10px] uppercase font-bold tracking-widest text-[#575757] hover:text-[#0F1210]">
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
                                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#E9E7E2]/50 py-3.5 text-xs font-bold tracking-wider text-[#575757] ring-1 ring-inset ring-[rgba(15,18,16,.12)] transition-all hover:bg-[#E9E7E2]/30 hover:text-[#0F1210] active:scale-95"
                                        >
                                            <Undo2 size={14} />
                                            RECIBIDO
                                        </button>
                                        {order.customer_phone && (
                                            <button title="Notificar por WhatsApp" onClick={() => handleWhatsAppNotify(order)} className="flex-none w-[52px] flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20 transition active:scale-95">
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
                                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#E9E7E2]/50 py-3.5 text-xs font-bold tracking-wider text-[#575757] ring-1 ring-inset ring-[rgba(15,18,16,.12)] transition-all hover:bg-[#E9E7E2]/30 hover:text-[#0F1210] active:scale-95"
                                        >
                                            <Undo2 size={14} />
                                            CONFIRMAR
                                        </button>
                                        {order.customer_phone && (
                                            <button title="Notificar por WhatsApp" onClick={() => handleWhatsAppNotify(order)} className="flex-none w-[52px] flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20 transition active:scale-95">
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
                                            className="flex-[3] flex items-center justify-center gap-1.5 rounded-xl bg-[#E9E7E2]/50 py-3.5 text-xs font-bold tracking-wider text-[#575757] ring-1 ring-inset ring-[rgba(15,18,16,.12)] transition-all hover:bg-[#E9E7E2]/30 hover:text-[#0F1210] active:scale-95"
                                        >
                                            <Undo2 size={14} />
                                            VOLVER A DESPACHADO
                                        </button>
                                        {order.customer_phone && (
                                            <button title="Notificar por WhatsApp" onClick={() => handleWhatsAppNotify(order)} className="flex-1 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/20 transition active:scale-95">
                                                <MessageCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })
                )}
            </div>

            {/* ── Receipt viewer modal ── */}
            {receiptModal && (
                <ReceiptModal receiptUrl={receiptModal} onClose={() => setReceiptModal(null)} />
            )}

            {/* ── Adjustment Modal ── */}
            {adjustingOrder && (
                <AdjustmentModal
                    order={adjustingOrder}
                    onClose={() => setAdjustingOrder(null)}
                    onSave={handleAdjustOrder}
                />
            )}

            {/* ── Hidden Printable Area ── */}
            {
                printingOrder && (
                    <div className="hidden print:block">
                        <PrintableReceipt
                            order={printingOrder.order}
                            tenant={{ name: tenantName, logo_url: tenantLogo }}
                            type={printingOrder.type}
                        />
                    </div>
                )
            }
        </div >
    );
}
