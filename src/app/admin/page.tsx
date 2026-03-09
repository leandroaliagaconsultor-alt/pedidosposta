"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Shield, ExternalLink, Loader2, Store, Calendar,
    Link2, Activity, Search, Globe, Database,
    Zap, ShoppingBag, Wifi, WifiOff, Clock, Bell,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast, Toaster } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────
interface Tenant {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    logo_url: string | null;
    color_hex: string | null;
    address: string | null;
}

interface HealthMetrics {
    dbStatus: "online" | "offline" | "checking";
    latencyMs: number;
    ordersLast24h: number;
    totalTenants: number;
}

export default function GodModePage() {
    const supabase = createClient();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [notifCount, setNotifCount] = useState(0);
    const tenantsRef = useRef<Tenant[]>([]);
    const [metrics, setMetrics] = useState<HealthMetrics>({
        dbStatus: "checking",
        latencyMs: 0,
        ordersLast24h: 0,
        totalTenants: 0,
    });

    // Keep ref in sync
    useEffect(() => { tenantsRef.current = tenants; }, [tenants]);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/admin/login";
                return;
            }

            const t0 = performance.now();

            const [tenantsRes, ordersCountRes] = await Promise.all([
                supabase
                    .from("tenants")
                    .select("*")
                    .order("created_at", { ascending: false }),
                supabase
                    .from("orders")
                    .select("id", { count: "exact", head: true })
                    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
            ]);

            const t1 = performance.now();
            const latency = Math.round(t1 - t0);
            const dbOnline = !tenantsRes.error;
            const tenantsList = (tenantsRes.data as Tenant[]) || [];

            setTenants(tenantsList);
            setMetrics({
                dbStatus: dbOnline ? "online" : "offline",
                latencyMs: latency,
                ordersLast24h: ordersCountRes.count || 0,
                totalTenants: tenantsList.length,
            });

            if (tenantsRes.error) console.error("Error fetching tenants:", tenantsRes.error);
            setLoading(false);
        };
        init();
    }, [supabase]);

    // ── Realtime: Listen to ALL new orders globally ──────────────────────
    useEffect(() => {
        const channel = supabase
            .channel("god-mode-orders")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "orders",
                },
                (payload) => {
                    const newOrder = payload.new as any;
                    const tenantId = newOrder.tenant_id;

                    // Find tenant name from our cached list
                    const matchedTenant = tenantsRef.current.find((t) => t.id === tenantId);
                    const tenantName = matchedTenant?.name || "Local desconocido";

                    // Increment notification badge
                    setNotifCount((c) => c + 1);

                    // Update orders count
                    setMetrics((prev) => ({
                        ...prev,
                        ordersLast24h: prev.ordersLast24h + 1,
                    }));

                    // Toast
                    toast.success(`¡Nuevo Pedido en ${tenantName}!`, {
                        description: `Pedido #${newOrder.order_number || "—"} • $${Number(newOrder.total_amount || 0).toLocaleString("es-AR")}`,
                        duration: 6000,
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const filteredTenants = tenants.filter(
        (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-red-500 opacity-50" />
                    <p className="text-xs font-mono uppercase tracking-widest text-zinc-600 animate-pulse">
                        Escaneando sistemas...
                    </p>
                </div>
            </div>
        );
    }

    // ── Health card config ──
    const healthCards = [
        {
            label: "Supabase Database",
            value: metrics.dbStatus === "online" ? "Online" : metrics.dbStatus === "checking" ? "Checking..." : "Offline",
            icon: metrics.dbStatus === "online" ? Wifi : WifiOff,
            color: metrics.dbStatus === "online" ? "emerald" : "red",
            dot: metrics.dbStatus === "online",
        },
        {
            label: "Latencia API",
            value: `${metrics.latencyMs} ms`,
            icon: Zap,
            color: metrics.latencyMs < 500 ? "emerald" : metrics.latencyMs < 2000 ? "yellow" : "red",
            subtitle: metrics.latencyMs < 300 ? "Excelente" : metrics.latencyMs < 1000 ? "Buena" : "Lenta",
        },
        {
            label: "Pedidos Globales (24h)",
            value: metrics.ordersLast24h.toLocaleString("es-AR"),
            icon: ShoppingBag,
            color: "sky",
            subtitle: "Todos los tenants",
        },
        {
            label: "Locales Activos",
            value: metrics.totalTenants.toString(),
            icon: Store,
            color: "violet",
            subtitle: "Registrados en plataforma",
        },
    ];

    const colorMap: Record<string, { text: string; bg: string; ring: string; dot: string; glow: string }> = {
        emerald: {
            text: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20",
            dot: "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]", glow: "shadow-[0_0_25px_rgba(52,211,153,0.1)]",
        },
        red: {
            text: "text-red-400", bg: "bg-red-500/10", ring: "ring-red-500/20",
            dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]", glow: "shadow-[0_0_25px_rgba(239,68,68,0.1)]",
        },
        yellow: {
            text: "text-yellow-400", bg: "bg-yellow-500/10", ring: "ring-yellow-500/20",
            dot: "bg-yellow-500", glow: "shadow-[0_0_25px_rgba(234,179,8,0.1)]",
        },
        sky: {
            text: "text-sky-400", bg: "bg-sky-500/10", ring: "ring-sky-500/20",
            dot: "bg-sky-500", glow: "shadow-[0_0_25px_rgba(56,189,248,0.1)]",
        },
        violet: {
            text: "text-violet-400", bg: "bg-violet-500/10", ring: "ring-violet-500/20",
            dot: "bg-violet-500", glow: "shadow-[0_0_25px_rgba(139,92,246,0.1)]",
        },
    };

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100">
            <Toaster position="top-right" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            {/* ── Hero Header ────────────────────────────────────────── */}
            <div className="relative overflow-hidden border-b border-zinc-800/50">
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[600px] bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.12),transparent_70%)]" />
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                        <div>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                                    <Shield className="h-6 w-6 text-red-500" />
                                </div>
                                <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-400 ring-1 ring-inset ring-red-500/20">
                                    God Mode
                                </span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                                Torre de <span className="text-red-500">Control</span>
                            </h1>
                            <p className="mt-2 text-sm text-zinc-400 max-w-lg">
                                Panel maestro de administración SaaS. Vista completa de todos los tenants registrados en la plataforma.
                            </p>
                        </div>

                        {/* Notification Bell + Timestamp */}
                        <div className="flex items-center gap-4">
                            {/* Bell with badge */}
                            <button
                                onClick={() => setNotifCount(0)}
                                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white active:scale-95"
                                title="Notificaciones de pedidos nuevos"
                            >
                                <Bell size={20} />
                                {notifCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse">
                                        {notifCount > 99 ? "99+" : notifCount}
                                    </span>
                                )}
                            </button>

                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                                <Clock size={14} />
                                <span>{format(new Date(), "HH:mm:ss 'hs'")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────── */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">

                {/* ═══ HEALTH & BUSINESS PULSE GRID ═══ */}
                <div className="mb-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {healthCards.map((card) => {
                        const c = colorMap[card.color];
                        const Icon = card.icon;
                        return (
                            <div
                                key={card.label}
                                className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 backdrop-blur-md transition-all hover:border-zinc-700 ${c.glow}`}
                            >
                                <div className={`pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full ${c.bg} blur-2xl opacity-60`} />
                                <div className="relative z-10">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg} ring-1 ${c.ring}`}>
                                            <Icon size={18} className={c.text} />
                                        </div>
                                        {card.dot && (
                                            <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${c.dot}`} />
                                        )}
                                    </div>
                                    <p className={`text-2xl sm:text-3xl font-black ${c.text} leading-none`}>
                                        {card.value}
                                    </p>
                                    <p className="mt-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500">
                                        {card.label}
                                    </p>
                                    {card.subtitle && (
                                        <p className="mt-0.5 text-[10px] text-zinc-600 font-mono">
                                            {card.subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ═══ TENANTS TABLE ═══ */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h2 className="text-lg font-black uppercase tracking-widest text-zinc-300">
                        <Database size={16} className="inline-block mr-2 text-red-500/70 -mt-0.5" />
                        Locales Registrados
                    </h2>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-72">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o slug..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 placeholder:text-zinc-600"
                            />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 whitespace-nowrap">
                            {filteredTenants.length} resultado{filteredTenants.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-2xl backdrop-blur-md">
                    <div className="hidden sm:grid sm:grid-cols-12 gap-4 border-b border-zinc-800/50 bg-zinc-900/80 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <div className="col-span-4">Local</div>
                        <div className="col-span-3">Slug / URL</div>
                        <div className="col-span-3">Fecha de Alta</div>
                        <div className="col-span-2 text-right">Acciones</div>
                    </div>

                    {filteredTenants.length === 0 ? (
                        <div className="flex h-40 items-center justify-center text-sm text-zinc-600 font-bold">
                            {searchQuery ? "No se encontraron resultados." : "No hay tenants registrados."}
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800/40">
                            {filteredTenants.map((tenant) => (
                                <div
                                    key={tenant.id}
                                    className="group grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center px-4 sm:px-6 py-4 sm:py-3.5 transition-colors hover:bg-zinc-800/30"
                                >
                                    <div className="sm:col-span-4 flex items-center gap-3">
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-black text-zinc-400 overflow-hidden"
                                            style={tenant.color_hex ? { borderColor: `${tenant.color_hex}30` } : {}}
                                        >
                                            {tenant.logo_url ? (
                                                <img src={tenant.logo_url} alt={tenant.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span style={tenant.color_hex ? { color: tenant.color_hex } : {}}>
                                                    {tenant.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm leading-tight group-hover:text-red-400 transition-colors">
                                                {tenant.name}
                                            </p>
                                            {tenant.address && (
                                                <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{tenant.address}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="sm:col-span-3 flex items-center gap-2">
                                        <Globe size={14} className="text-zinc-600 hidden sm:block" />
                                        <div>
                                            <p className="text-sm font-mono font-bold text-zinc-300">/{tenant.slug}</p>
                                            <p className="text-[10px] text-zinc-600 font-mono hidden sm:block">
                                                pedidoposta.com/{tenant.slug}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-3 flex items-center gap-2">
                                        <Calendar size={14} className="text-zinc-600 hidden sm:block" />
                                        <div>
                                            <p className="text-sm text-zinc-300">
                                                {format(parseISO(tenant.created_at), "d MMM yyyy", { locale: es })}
                                            </p>
                                            <p className="text-[10px] text-zinc-600 hidden sm:block">
                                                {format(parseISO(tenant.created_at), "HH:mm 'hs'")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2 flex justify-start sm:justify-end gap-2">
                                        <a
                                            href={`/${tenant.slug}/manager`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-400 ring-1 ring-inset ring-red-500/20 transition-all hover:bg-red-500/20 hover:text-red-300 active:scale-95"
                                        >
                                            <ExternalLink size={14} />
                                            <span className="hidden sm:inline">Entrar al Panel</span>
                                            <span className="sm:hidden">Panel</span>
                                        </a>
                                        <a
                                            href={`/${tenant.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3.5 py-2 text-xs font-bold text-zinc-400 ring-1 ring-inset ring-zinc-700/50 transition-all hover:bg-zinc-700/50 hover:text-zinc-300 active:scale-95"
                                        >
                                            <Link2 size={14} />
                                            <span className="hidden sm:inline">Ver Menú</span>
                                            <span className="sm:hidden">Menú</span>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-600">
                    <Shield size={12} className="text-red-900" />
                    <span className="font-mono">PedidoPosta SaaS — God Mode v2.0</span>
                </div>
            </div>
        </main>
    );
}
