"use client";

import React, { useEffect, useState, useCallback, useRef, use, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Loader2, DollarSign, TrendingUp, ShoppingBag,
    Receipt, Search, Download, ChevronLeft, ChevronRight,
    CalendarDays, Filter, X, Clock, Star, Bike, Package,
} from "lucide-react";
import { format, parseISO, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { toast, Toaster } from "sonner";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

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

interface OrderItem {
    product_name: string;
    quantity: number;
    total_price: number;
}

interface KpiData {
    totalRevenue: number;
    totalOrders: number;
    avgTicket: number;
    deliveryCount: number;
    takeawayCount: number;
}

const PAGE_SIZE = 20;
const CHART_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#ec4899"];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "text-yellow-400 bg-yellow-400/10" },
    preparing: { label: "Preparando", color: "text-amber-400 bg-amber-400/10" },
    on_the_way: { label: "Despachado", color: "text-sky-400 bg-sky-400/10" },
    delivered: { label: "Entregado", color: "text-emerald-400 bg-emerald-400/10" },
    cancelled: { label: "Cancelado", color: "text-red-400 bg-red-400/10" },
};

// ── Custom Tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 shadow-xl text-xs">
            <p className="text-zinc-400 font-medium mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="font-bold" style={{ color: p.color }}>
                    {p.name}: {typeof p.value === "number" && p.name.includes("$") ? `$${p.value.toLocaleString("es-AR")}` : p.value.toLocaleString("es-AR")}
                </p>
            ))}
        </div>
    );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AnalyticsPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = use(params);
    const supabase = createClient();

    const [tenantId, setTenantId] = useState<string | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [allOrders, setAllOrders] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<OrderItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [kpi, setKpi] = useState<KpiData>({ totalRevenue: 0, totalOrders: 0, avgTicket: 0, deliveryCount: 0, takeawayCount: 0 });
    const [chartRange, setChartRange] = useState<"7d" | "30d" | "90d">("7d");

    const [searchQuery, setSearchQuery] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [exportOpen, setExportOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    useEffect(() => { const t = setTimeout(() => setDebouncedSearch(searchQuery), 400); return () => clearTimeout(t); }, [searchQuery]);
    useEffect(() => { setPage(1); }, [debouncedSearch, dateFrom, dateTo]);

    // ── Fetch tenant ID ──
    useEffect(() => {
        supabase.from("tenants").select("id").eq("slug", tenant).single()
            .then(({ data, error }: { data: any; error: any }) => {
                if (data) setTenantId(data.id);
                if (error || !data) setLoading(false);
            });
    }, [supabase, tenant]);

    // ── Fetch chart data (all orders for range) ──
    useEffect(() => {
        if (!tenantId) return;
        const days = chartRange === "7d" ? 7 : chartRange === "30d" ? 30 : 90;
        const since = subDays(new Date(), days).toISOString();

        supabase
            .from("orders")
            .select("total_amount, delivery_method, status, created_at")
            .eq("tenant_id", tenantId)
            .gte("created_at", since)
            .neq("status", "cancelled")
            .order("created_at", { ascending: true })
            .then(({ data }: { data: any }) => { if (data) setAllOrders(data); });

        // Top products
        supabase
            .from("order_items")
            .select("quantity, total_price, product:products(name)")
            .eq("order.tenant_id", tenantId)
            .then(({ data }: { data: any }) => {
                // Fallback: fetch via orders
            });

        // Simple approach: fetch order_items joined
        supabase.rpc("get_top_products", { p_tenant_id: tenantId, p_limit: 5 }).then(({ data }: { data: any }) => {
            if (data) setTopProducts(data);
        });
    }, [supabase, tenantId, chartRange]);

    // ── Fetch paginated orders ──
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

        if (debouncedSearch) {
            query = query.or(`customer_name.ilike.%${debouncedSearch}%,first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%,order_number.eq.${isNaN(Number(debouncedSearch)) ? -1 : Number(debouncedSearch)}`);
        }
        if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
        if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
        query = query.range(from, to);

        const { data, count } = await query;
        setOrders((data ?? []) as Order[]);
        setTotalCount(count ?? 0);
        setLoading(false);
    }, [supabase, tenantId, page, debouncedSearch, dateFrom, dateTo]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // ── KPIs ──
    useEffect(() => {
        if (!tenantId) return;
        const fetchKpi = async () => {
            let q = supabase.from("orders").select("total_amount, delivery_method, status").eq("tenant_id", tenantId).neq("status", "cancelled");
            if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00`);
            if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59`);
            const { data } = await q;
            if (!data) return;
            const delivered = data.filter((o: any) => o.status === "delivered");
            const revenue = delivered.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
            const deliveryCount = delivered.filter((o: any) => o.delivery_method === "DELIVERY").length;
            setKpi({ totalRevenue: revenue, totalOrders: delivered.length, avgTicket: delivered.length ? Math.round(revenue / delivered.length) : 0, deliveryCount, takeawayCount: delivered.length - deliveryCount });
        };
        fetchKpi();
    }, [supabase, tenantId, dateFrom, dateTo]);

    // ── Chart data: revenue by day ──
    const revenueByDay = useMemo(() => {
        const days = chartRange === "7d" ? 7 : chartRange === "30d" ? 30 : 90;
        const interval = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });
        const map: Record<string, number> = {};
        interval.forEach(d => { map[format(d, "yyyy-MM-dd")] = 0; });

        allOrders.filter((o: any) => o.status === "delivered").forEach((o: any) => {
            const day = format(parseISO(o.created_at), "yyyy-MM-dd");
            if (map[day] !== undefined) map[day] += Number(o.total_amount || 0);
        });

        return Object.entries(map).map(([date, revenue]) => ({
            date: format(parseISO(date), chartRange === "90d" ? "dd/MM" : "EEE dd", { locale: es }),
            "$Ventas": revenue,
        }));
    }, [allOrders, chartRange]);

    // ── Chart data: orders by hour ──
    const ordersByHour = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, "0")}:00`, Pedidos: 0 }));
        allOrders.filter((o: any) => o.status === "delivered").forEach((o: any) => {
            const h = new Date(o.created_at).getHours();
            hours[h].Pedidos++;
        });
        return hours.filter(h => h.Pedidos > 0 || parseInt(h.hour) >= 10 && parseInt(h.hour) <= 23);
    }, [allOrders]);

    // ── Chart data: delivery vs takeaway ──
    const deliveryPie = useMemo(() => {
        const delivered = allOrders.filter((o: any) => o.status === "delivered");
        const del = delivered.filter((o: any) => o.delivery_method === "DELIVERY").length;
        const tak = delivered.length - del;
        if (!delivered.length) return [];
        return [
            { name: "Delivery", value: del },
            { name: "Take Away", value: tak },
        ];
    }, [allOrders]);

    // ── CSV Export ──
    const exportCSV = async (limit: number | null) => {
        if (!tenantId) return;
        setExporting(true); setExportOpen(false);
        toast.loading("Generando reporte...", { id: "csv" });
        let query = supabase.from("orders").select("id, order_number, customer_name, first_name, last_name, delivery_method, total_amount, status, created_at").eq("tenant_id", tenantId).order("created_at", { ascending: false });
        if (debouncedSearch) query = query.or(`customer_name.ilike.%${debouncedSearch}%,first_name.ilike.%${debouncedSearch}%`);
        if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
        if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
        if (limit) query = query.limit(limit);
        const { data } = await query;
        if (!data) { toast.error("Error al exportar.", { id: "csv" }); setExporting(false); return; }
        const headers = ["Pedido #", "Fecha", "Cliente", "Tipo", "Total", "Estado"];
        const rows = data.map((o: any) => [o.order_number, format(parseISO(o.created_at), "dd/MM/yyyy HH:mm"), o.customer_name || `${o.first_name || ""} ${o.last_name || ""}`.trim() || "—", o.delivery_method === "DELIVERY" ? "Delivery" : "Take Away", Number(o.total_amount).toFixed(2), STATUS_LABELS[o.status]?.label || o.status]);
        const csv = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = url; link.download = `pedidos_${tenant}_${format(new Date(), "yyyyMMdd_HHmm")}.csv`; link.click(); URL.revokeObjectURL(url);
        toast.success(`${data.length} pedidos exportados.`, { id: "csv" }); setExporting(false);
    };

    useEffect(() => { const handler = (e: MouseEvent) => { if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false); }; document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, []);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const customerName = (o: Order) => o.customer_name || `${o.first_name || ""} ${o.last_name || ""}`.trim() || "—";
    const hasFilters = debouncedSearch || dateFrom || dateTo;

    return (
        <div>
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Analytics <span className="text-primary">Dashboard</span></h1>
                <p className="mt-1 text-sm text-zinc-400">Métricas, gráficos y exportación de datos.</p>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                <KpiCard title="Ingresos" value={`$${kpi.totalRevenue.toLocaleString("es-AR")}`} icon={<DollarSign size={20} />} color="emerald" />
                <KpiCard title="Pedidos" value={kpi.totalOrders.toString()} icon={<ShoppingBag size={20} />} color="sky" />
                <KpiCard title="Ticket Promedio" value={`$${kpi.avgTicket.toLocaleString("es-AR")}`} icon={<TrendingUp size={20} />} color="violet" />
                <KpiCard title="Delivery / Retiro" value={`${kpi.deliveryCount} / ${kpi.takeawayCount}`} icon={<Bike size={20} />} color="amber" />
            </div>

            {/* ── CHARTS SECTION ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                {/* Revenue chart */}
                <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white">Ventas por día</h3>
                        <div className="flex rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden">
                            {(["7d", "30d", "90d"] as const).map(r => (
                                <button key={r} onClick={() => setChartRange(r)}
                                    className={`px-3 py-1 text-[10px] font-bold transition ${chartRange === r ? "bg-primary/20 text-primary" : "text-zinc-500 hover:text-zinc-300"}`}>
                                    {r === "7d" ? "7 días" : r === "30d" ? "30 días" : "90 días"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-56 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueByDay}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="$Ventas" stroke="#22c55e" strokeWidth={2} fill="url(#revGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Delivery vs Takeaway pie */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
                    <h3 className="text-sm font-bold text-white mb-4">Delivery vs Retiro</h3>
                    {deliveryPie.length > 0 ? (
                        <div className="h-48 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={deliveryPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4} strokeWidth={0}>
                                        {deliveryPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-zinc-600 text-xs">Sin datos</div>
                    )}
                    <div className="flex justify-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Delivery</span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Retiro</span>
                    </div>
                </div>
            </div>

            {/* Hourly distribution */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Clock size={16} className="text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Horarios pico</h3>
                </div>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ordersByHour}>
                            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#71717a" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="Pedidos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Filters Toolbar ── */}
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 w-full sm:max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input type="text" placeholder="Buscar cliente o # pedido..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-2.5 pl-9 pr-4 text-sm text-zinc-100 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 placeholder:text-zinc-600" />
                </div>
                <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-zinc-500 shrink-0" />
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary/50 [color-scheme:dark]" />
                    <span className="text-zinc-600 text-xs">—</span>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-primary/50 [color-scheme:dark]" />
                </div>
                {hasFilters && (
                    <button onClick={() => { setSearchQuery(""); setDateFrom(""); setDateTo(""); }} className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-red-400 transition">
                        <X size={14} /> Limpiar
                    </button>
                )}
                <div className="relative ml-auto" ref={exportRef}>
                    <button onClick={() => setExportOpen(!exportOpen)} disabled={exporting}
                        className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50">
                        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} CSV
                    </button>
                    {exportOpen && (
                        <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl">
                            <p className="px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">Exportar</p>
                            {[{ label: "Últimos 50", limit: 50 }, { label: "Últimos 100", limit: 100 }, { label: "Últimos 500", limit: 500 }, { label: "Todos", limit: null }].map(opt => (
                                <button key={opt.label} onClick={() => exportCSV(opt.limit)} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-300 hover:bg-primary/10 hover:text-primary">
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-500">{totalCount} pedido{totalCount !== 1 ? "s" : ""}{hasFilters && " (filtrado)"}</p>
                <p className="text-xs text-zinc-600">Página {page} de {totalPages || 1}</p>
            </div>

            {/* ── Table ── */}
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-xl mb-4">
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 border-b border-zinc-800/50 bg-zinc-900/80 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <div className="col-span-1">#</div>
                    <div className="col-span-2">Fecha</div>
                    <div className="col-span-3">Cliente</div>
                    <div className="col-span-2">Tipo</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-2 text-right">Estado</div>
                </div>
                {loading ? (
                    <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary/50" /></div>
                ) : orders.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center text-sm text-zinc-600"><Filter size={24} className="mb-2 text-zinc-700" /><p className="font-bold">Sin resultados</p></div>
                ) : (
                    <div className="divide-y divide-zinc-800/40">
                        {orders.map(o => {
                            const st = STATUS_LABELS[o.status] || { label: o.status, color: "text-zinc-400 bg-zinc-800" };
                            return (
                                <div key={o.id} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-zinc-800/20">
                                    <div className="sm:col-span-1 text-sm font-mono font-bold text-zinc-300">#{o.order_number}</div>
                                    <div className="sm:col-span-2 text-xs text-zinc-400">
                                        <span className="hidden sm:inline">{format(parseISO(o.created_at), "dd MMM yyyy", { locale: es })}</span>
                                        <span className="sm:hidden">{format(parseISO(o.created_at), "dd/MM")}</span>
                                        <br /><span className="text-[10px] text-zinc-600">{format(parseISO(o.created_at), "HH:mm 'hs'")}</span>
                                    </div>
                                    <div className="sm:col-span-3 text-sm text-zinc-200 font-medium truncate">{customerName(o)}</div>
                                    <div className="sm:col-span-2">
                                        <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${o.delivery_method === "DELIVERY" ? "bg-sky-500/10 text-sky-400" : "bg-amber-500/10 text-amber-400"}`}>
                                            {o.delivery_method === "DELIVERY" ? "Delivery" : "Retiro"}
                                        </span>
                                    </div>
                                    <div className="sm:col-span-2 text-right text-sm font-bold font-mono text-emerald-400">${Number(o.total_amount).toLocaleString("es-AR")}</div>
                                    <div className="sm:col-span-2 text-right"><span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${st.color}`}>{st.label}</span></div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30">
                        <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pn: number;
                        if (totalPages <= 7) pn = i + 1;
                        else if (page <= 4) pn = i + 1;
                        else if (page >= totalPages - 3) pn = totalPages - 6 + i;
                        else pn = page - 3 + i;
                        return (
                            <button key={pn} onClick={() => setPage(pn)}
                                className={`h-9 min-w-[36px] rounded-lg px-2 text-sm font-bold transition ${pn === page ? "bg-primary text-primary-foreground" : "border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800"}`}>
                                {pn}
                            </button>
                        );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30">
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── KPI Card ──
function KpiCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
    const styles: Record<string, { text: string; bg: string; ring: string; glow: string }> = {
        emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20", glow: "" },
        sky: { text: "text-sky-400", bg: "bg-sky-500/10", ring: "ring-sky-500/20", glow: "" },
        violet: { text: "text-violet-400", bg: "bg-violet-500/10", ring: "ring-violet-500/20", glow: "" },
        amber: { text: "text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/20", glow: "" },
    };
    const s = styles[color] || styles.emerald;
    return (
        <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5`}>
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg} ring-1 ${s.ring}`}>
                <span className={s.text}>{icon}</span>
            </div>
            <p className={`text-2xl font-black ${s.text} leading-none`}>{value}</p>
            <p className="mt-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</p>
        </div>
    );
}
