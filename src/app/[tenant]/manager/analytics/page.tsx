"use client";

import React, { useEffect, useState, useCallback, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Loader2, DollarSign, TrendingUp, ShoppingBag,
    Receipt, Search, Download, ChevronLeft, ChevronRight,
    CalendarDays, Filter, X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast, Toaster } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────
interface Order {
    id: string;
    order_number: number;
    customer_name: string;
    first_name: string | null;
    last_name: string | null;
    delivery_method: string;
    total_amount: number;
    status: string;
    created_at: string;
}

interface KpiData {
    totalRevenue: number;
    totalOrders: number;
    avgTicket: number;
    deliveryCount: number;
    takeawayCount: number;
}

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "text-yellow-400 bg-yellow-400/10" },
    preparing: { label: "Preparando", color: "text-amber-400 bg-amber-400/10" },
    on_the_way: { label: "Despachado", color: "text-sky-400 bg-sky-400/10" },
    delivered: { label: "Entregado", color: "text-emerald-400 bg-emerald-400/10" },
    cancelled: { label: "Cancelado", color: "text-red-400 bg-red-400/10" },
};

// ── Component ────────────────────────────────────────────────────────────────
export default function AnalyticsPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = use(params);
    const supabase = createClient();

    const [tenantId, setTenantId] = useState<string | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [kpi, setKpi] = useState<KpiData>({ totalRevenue: 0, totalOrders: 0, avgTicket: 0, deliveryCount: 0, takeawayCount: 0 });

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // CSV export
    const [exportOpen, setExportOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // Reset to page 1 when filters change
    useEffect(() => { setPage(1); }, [debouncedSearch, dateFrom, dateTo]);

    // ── Fetch tenant ID ──
    useEffect(() => {
        supabase.from("tenants").select("id").eq("slug", tenant).single()
            .then(({ data }) => { if (data) setTenantId(data.id); });
    }, [supabase, tenant]);

    // ── Fetch orders (paginated + filtered) ──
    const fetchOrders = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);

        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
            .from("orders")
            .select("id, order_number, customer_name, first_name, last_name, delivery_method, total_amount, status, created_at", { count: "exact" })
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false });

        // Filters
        if (debouncedSearch) {
            query = query.or(`customer_name.ilike.%${debouncedSearch}%,first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%,order_number.eq.${isNaN(Number(debouncedSearch)) ? -1 : Number(debouncedSearch)}`);
        }
        if (dateFrom) {
            query = query.gte("created_at", `${dateFrom}T00:00:00`);
        }
        if (dateTo) {
            query = query.lte("created_at", `${dateTo}T23:59:59`);
        }

        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) console.error(error);

        setOrders((data ?? []) as Order[]);
        setTotalCount(count ?? 0);
        setLoading(false);
    }, [supabase, tenantId, page, debouncedSearch, dateFrom, dateTo]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // ── KPIs (all-time for this tenant, respecting date filters) ──
    useEffect(() => {
        if (!tenantId) return;
        const fetchKpi = async () => {
            let q = supabase
                .from("orders")
                .select("total_amount, delivery_method, status")
                .eq("tenant_id", tenantId)
                .neq("status", "cancelled");

            if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00`);
            if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59`);

            const { data } = await q;
            if (!data) return;

            const delivered = data.filter(o => o.status === "delivered");
            const revenue = delivered.reduce((s, o) => s + Number(o.total_amount || 0), 0);
            const deliveryCount = delivered.filter(o => o.delivery_method === "DELIVERY").length;

            setKpi({
                totalRevenue: revenue,
                totalOrders: delivered.length,
                avgTicket: delivered.length ? Math.round(revenue / delivered.length) : 0,
                deliveryCount,
                takeawayCount: delivered.length - deliveryCount,
            });
        };
        fetchKpi();
    }, [supabase, tenantId, dateFrom, dateTo]);

    // ── CSV Export ──
    const exportCSV = async (limit: number | null) => {
        if (!tenantId) return;
        setExporting(true);
        setExportOpen(false);
        toast.loading("Generando reporte...", { id: "csv-export" });

        let query = supabase
            .from("orders")
            .select("id, order_number, customer_name, first_name, last_name, delivery_method, total_amount, status, created_at")
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false });

        if (debouncedSearch) {
            query = query.or(`customer_name.ilike.%${debouncedSearch}%,first_name.ilike.%${debouncedSearch}%`);
        }
        if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
        if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
        if (limit) query = query.limit(limit);

        const { data, error } = await query;
        if (error || !data) {
            toast.error("Error al exportar.", { id: "csv-export" });
            setExporting(false);
            return;
        }

        const headers = ["Pedido #", "Fecha", "Cliente", "Tipo", "Total", "Estado"];
        const rows = data.map((o: any) => [
            o.order_number,
            format(parseISO(o.created_at), "dd/MM/yyyy HH:mm"),
            o.customer_name || `${o.first_name || ""} ${o.last_name || ""}`.trim() || "—",
            o.delivery_method === "DELIVERY" ? "Delivery" : "Take Away",
            Number(o.total_amount).toFixed(2),
            STATUS_LABELS[o.status]?.label || o.status,
        ]);

        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `pedidos_${tenant}_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success(`${data.length} pedidos exportados.`, { id: "csv-export" });
        setExporting(false);
    };

    // Close export popover on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
                setExportOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const customerName = (o: Order) => o.customer_name || `${o.first_name || ""} ${o.last_name || ""}`.trim() || "—";
    const hasFilters = debouncedSearch || dateFrom || dateTo;

    return (
        <div>
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            {/* ── Header ────────────────────────────────────────── */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Analytics <span className="text-primary">Dashboard</span>
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                    Historial de pedidos, métricas y exportación de datos.
                </p>
            </div>

            {/* ── KPI Cards ────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                <KpiCard title="Ingresos" value={`$${kpi.totalRevenue.toLocaleString("es-AR")}`} icon={<DollarSign size={20} />} color="emerald" />
                <KpiCard title="Pedidos Totales" value={kpi.totalOrders.toString()} icon={<ShoppingBag size={20} />} color="sky" />
                <KpiCard title="Ticket Promedio" value={`$${kpi.avgTicket.toLocaleString("es-AR")}`} icon={<TrendingUp size={20} />} color="violet" />
                <KpiCard title="Delivery / Take Away" value={`${kpi.deliveryCount} / ${kpi.takeawayCount}`} icon={<Receipt size={20} />} color="amber" />
            </div>

            {/* ── Filters Toolbar ──────────────────────────────── */}
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 w-full sm:max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar cliente o # pedido..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-2.5 pl-9 pr-4 text-sm text-zinc-100 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 placeholder:text-zinc-600"
                    />
                </div>

                {/* Date From */}
                <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-zinc-500 shrink-0" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 [color-scheme:dark]"
                    />
                    <span className="text-zinc-600 text-xs">—</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 [color-scheme:dark]"
                    />
                </div>

                {/* Clear filters */}
                {hasFilters && (
                    <button
                        onClick={() => { setSearchQuery(""); setDateFrom(""); setDateTo(""); }}
                        className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-red-400 transition"
                    >
                        <X size={14} /> Limpiar
                    </button>
                )}

                {/* Export CSV */}
                <div className="relative ml-auto" ref={exportRef}>
                    <button
                        onClick={() => setExportOpen(!exportOpen)}
                        disabled={exporting}
                        className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                    >
                        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        Exportar CSV
                    </button>

                    {exportOpen && (
                        <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl">
                            <p className="px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">¿Cuántos exportar?</p>
                            {[
                                { label: "Últimos 50", limit: 50 },
                                { label: "Últimos 100", limit: 100 },
                                { label: "Últimos 500", limit: 500 },
                                { label: "Todos los filtrados", limit: null },
                            ].map((opt) => (
                                <button
                                    key={opt.label}
                                    onClick={() => exportCSV(opt.limit)}
                                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-300 transition hover:bg-primary/10 hover:text-primary"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Results count ────────────────────────────────── */}
            <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-500">
                    {totalCount} pedido{totalCount !== 1 ? "s" : ""} encontrado{totalCount !== 1 ? "s" : ""}
                    {hasFilters && " (filtrado)"}
                </p>
                <p className="text-xs text-zinc-600">
                    Página {page} de {totalPages || 1}
                </p>
            </div>

            {/* ── Table ────────────────────────────────────────── */}
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-xl backdrop-blur-md mb-4">
                {/* Desktop header */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 border-b border-zinc-800/50 bg-zinc-900/80 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <div className="col-span-1">#</div>
                    <div className="col-span-2">Fecha</div>
                    <div className="col-span-3">Cliente</div>
                    <div className="col-span-2">Tipo</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-2 text-right">Estado</div>
                </div>

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center text-sm text-zinc-600">
                        <Filter size={24} className="mb-2 text-zinc-700" />
                        <p className="font-bold">Sin resultados</p>
                        <p className="text-xs">Ajusta los filtros de búsqueda.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/40">
                        {orders.map((o) => {
                            const st = STATUS_LABELS[o.status] || { label: o.status, color: "text-zinc-400 bg-zinc-800" };
                            return (
                                <div key={o.id} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center px-4 py-3 transition-colors hover:bg-zinc-800/20">
                                    {/* Order # */}
                                    <div className="sm:col-span-1 text-sm font-mono font-bold text-zinc-300">
                                        #{o.order_number}
                                    </div>
                                    {/* Date */}
                                    <div className="sm:col-span-2 text-xs text-zinc-400">
                                        <span className="hidden sm:inline">{format(parseISO(o.created_at), "dd MMM yyyy", { locale: es })}</span>
                                        <span className="sm:hidden">{format(parseISO(o.created_at), "dd/MM")}</span>
                                        <br />
                                        <span className="text-[10px] text-zinc-600">{format(parseISO(o.created_at), "HH:mm 'hs'")}</span>
                                    </div>
                                    {/* Customer */}
                                    <div className="sm:col-span-3 text-sm text-zinc-200 font-medium truncate">
                                        {customerName(o)}
                                    </div>
                                    {/* Type */}
                                    <div className="sm:col-span-2">
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${o.delivery_method === "DELIVERY" ? "bg-sky-500/10 text-sky-400" : "bg-amber-500/10 text-amber-400"}`}>
                                            {o.delivery_method === "DELIVERY" ? "Delivery" : "Take Away"}
                                        </span>
                                    </div>
                                    {/* Total */}
                                    <div className="sm:col-span-2 text-right text-sm font-bold font-mono text-emerald-400">
                                        ${Number(o.total_amount).toLocaleString("es-AR")}
                                    </div>
                                    {/* Status */}
                                    <div className="sm:col-span-2 text-right">
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${st.color}`}>
                                            {st.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Pagination ────────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-30"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) {
                            pageNum = i + 1;
                        } else if (page <= 4) {
                            pageNum = i + 1;
                        } else if (page >= totalPages - 3) {
                            pageNum = totalPages - 6 + i;
                        } else {
                            pageNum = page - 3 + i;
                        }
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`h-9 min-w-[36px] rounded-lg px-2 text-sm font-bold transition ${pageNum === page
                                    ? "bg-primary text-primary-foreground shadow-[0_0_10px_var(--brand-color)] shadow-primary/30"
                                    : "border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-30"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── KPI Card ──────────────────────────────────────────────────────────
function KpiCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
    const styles: Record<string, { text: string; bg: string; ring: string; glow: string }> = {
        emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20", glow: "shadow-[0_0_20px_rgba(52,211,153,0.08)]" },
        sky: { text: "text-sky-400", bg: "bg-sky-500/10", ring: "ring-sky-500/20", glow: "shadow-[0_0_20px_rgba(56,189,248,0.08)]" },
        violet: { text: "text-violet-400", bg: "bg-violet-500/10", ring: "ring-violet-500/20", glow: "shadow-[0_0_20px_rgba(139,92,246,0.08)]" },
        amber: { text: "text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/20", glow: "shadow-[0_0_20px_rgba(245,158,11,0.08)]" },
    };
    const s = styles[color] || styles.emerald;

    return (
        <div className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 backdrop-blur-md ${s.glow}`}>
            <div className={`pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full ${s.bg} blur-2xl opacity-60`} />
            <div className="relative z-10">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg} ring-1 ${s.ring}`}>
                    <span className={s.text}>{icon}</span>
                </div>
                <p className={`text-2xl font-black ${s.text} leading-none`}>{value}</p>
                <p className="mt-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</p>
            </div>
        </div>
    );
}
