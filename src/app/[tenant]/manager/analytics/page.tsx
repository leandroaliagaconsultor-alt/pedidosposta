"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Loader2, DollarSign, TrendingUp, ShoppingBag,
    Receipt, Package, Truck, BarChart2,
    PieChart, Activity, Map, Ghost, Star, CalendarDays
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function AnalyticsPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = React.use(params);
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");
    const [activeTab, setActiveTab] = useState<"finanzas" | "menu" | "operaciones">("finanzas");

    // KPI Data
    const [grossRevenue, setGrossRevenue] = useState(0);
    const [netProfit, setNetProfit] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);

    // Chart Data - Menú & Productos
    const [topProducts, setTopProducts] = useState<{ name: string, count: number, percentage: number }[]>([]);
    const [profitableProducts, setProfitableProducts] = useState<{ name: string, profit: number }[]>([]);
    const [zombieProducts, setZombieProducts] = useState<{ name: string }[]>([]);

    // Chart Data - Finanzas
    const [paymentMethods, setPaymentMethods] = useState<{ method: string, count: number, total: number, percentage: number }[]>([]);
    const [salesEvolution, setSalesEvolution] = useState<{ date: string, amount: number, maxAmount: number }[]>([]);

    // Chart Data - Operaciones
    const [hourlyData, setHourlyData] = useState<{ hour: string, count: number, maxCount: number }[]>([]);
    const [deliveryCount, setDeliveryCount] = useState(0);
    const [takeawayCount, setTakeawayCount] = useState(0);
    const [topZones, setTopZones] = useState<{ zone: string, count: number, percentage: number }[]>([]);

    const ticketPromedio = totalOrders > 0 ? grossRevenue / totalOrders : 0;

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);

            // 1. Get Tenant ID
            const { data: tenantData } = await supabase
                .from("tenants")
                .select("id")
                .eq("slug", tenant)
                .single();

            if (!tenantData) {
                setLoading(false);
                return;
            }

            // 2. Fetch Active Products (For Zombies)
            const { data: allActiveProducts } = await supabase
                .from("products")
                .select("id, name")
                .eq("tenant_id", tenantData.id)
                .eq("is_active", true);

            // 3. Fetch Orders
            let startDate = new Date();
            if (timeRange === "today") {
                startDate.setHours(0, 0, 0, 0);
            } else if (timeRange === "week") {
                const day = startDate.getDay();
                const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
                startDate.setDate(diff);
                startDate.setHours(0, 0, 0, 0);
            } else if (timeRange === "month") {
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
            }

            const { data: orders } = await supabase
                .from("orders")
                .select("id, total_amount, created_at, delivery_method, is_asap, scheduled_time, payment_method, customer_address, order_items(quantity, product:products(id, name, cost_price, profit_margin))")
                .eq("tenant_id", tenantData.id)
                .in("status", ["delivered", "pending", "preparing", "on_the_way", "ready"])
                .gte("created_at", startDate.toISOString());

            if (!orders) {
                setLoading(false);
                return;
            }

            // --- Metrics calculation ---
            let tempGross = 0;
            let tempCost = 0;
            let totalItemsSold = 0;

            const productMap: Record<string, { name: string, count: number, profit: number }> = {};
            const hourCounts: Record<string, number> = {};
            const paymentMap: Record<string, { count: number, total: number }> = {};
            const dateSalesMap: Record<string, number> = {};
            const zonesMap: Record<string, number> = {};

            let dCount = 0;
            let tCount = 0;
            let dCountTotalWithAddress = 0;

            const productsSoldIds = new Set<string>();

            orders.forEach((order: any) => {
                tempGross += order.total_amount;

                // Operaciones: Delivery / Takeaway
                if (order.delivery_method === "DELIVERY") {
                    dCount++;
                    // Inferir Zona desde la dirección (Agrupando por Nombre de la calle sin número)
                    if (order.customer_address) {
                        const zoneRaw = order.customer_address.replace(/[0-9].*$/, '').trim().toUpperCase();
                        const zone = zoneRaw || "OTRO";
                        zonesMap[zone] = (zonesMap[zone] || 0) + 1;
                        dCountTotalWithAddress++;
                    }
                }
                if (order.delivery_method === "TAKEAWAY") tCount++;

                // Operaciones: Horarios Pico
                let hourObj = new Date(order.created_at);
                if (!order.is_asap && order.scheduled_time) {
                    hourObj = new Date(order.scheduled_time);
                }
                const hr = hourObj.getHours().toString().padStart(2, '0') + ':00';
                hourCounts[hr] = (hourCounts[hr] || 0) + 1;

                // Finanzas: Evolución de Ventas por Día
                const dateKey = format(new Date(order.created_at), "dd/MM");
                dateSalesMap[dateKey] = (dateSalesMap[dateKey] || 0) + order.total_amount;

                // Finanzas: Payment Methods
                const pMethod = order.payment_method || "OTRO";
                if (!paymentMap[pMethod]) paymentMap[pMethod] = { count: 0, total: 0 };
                paymentMap[pMethod].count += 1;
                paymentMap[pMethod].total += order.total_amount;

                // Menú: Items logic
                if (order.order_items) {
                    order.order_items.forEach((item: any) => {
                        const cost = item.product?.cost_price || 0;
                        const margin = item.product?.profit_margin || 0;

                        // Calculated Price
                        const priceCalculated = cost * (1 + (margin / 100));
                        const netItemProfit = (priceCalculated - cost) * item.quantity;

                        tempCost += (cost * item.quantity);
                        totalItemsSold += item.quantity;

                        if (item.product?.id) {
                            productsSoldIds.add(item.product.id);
                            if (!productMap[item.product.id]) {
                                productMap[item.product.id] = { name: item.product.name, count: 0, profit: 0 };
                            }
                            productMap[item.product.id].count += item.quantity;
                            productMap[item.product.id].profit += netItemProfit;
                        }
                    });
                }
            });

            setGrossRevenue(tempGross);
            setNetProfit(tempGross - tempCost);
            setTotalOrders(orders.length);
            setDeliveryCount(dCount);
            setTakeawayCount(tCount);

            // --- Post-Processing Maps to Arrays ---

            // Products list Processing (Top 5 Vendidos)
            const pArray = Object.values(productMap)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(p => ({
                    ...p,
                    percentage: totalItemsSold > 0 ? (p.count / totalItemsSold) * 100 : 0
                }));
            setTopProducts(pArray);

            // Top 3 Más Rentables
            const profitArray = Object.values(productMap)
                .sort((a, b) => b.profit - a.profit)
                .slice(0, 3);
            setProfitableProducts(profitArray);

            // Productos Zombie
            if (allActiveProducts) {
                const zombies = allActiveProducts.filter(p => !productsSoldIds.has(p.id));
                setZombieProducts(zombies);
            }

            // Hourly map Processing
            const maxHour = Math.max(...Object.values(hourCounts), 1);
            const hArray = Object.entries(hourCounts)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([hour, count]) => ({
                    hour, count, maxCount: maxHour
                }));
            setHourlyData(hArray);

            // Zonas de Envío Top
            const zArray = Object.entries(zonesMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([zone, count]) => ({
                    zone,
                    count,
                    percentage: dCountTotalWithAddress > 0 ? (count / dCountTotalWithAddress) * 100 : 0
                }));
            setTopZones(zArray);

            // Payment Methods Processing
            const payArray = Object.entries(paymentMap)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([method, data]) => ({
                    method,
                    count: data.count,
                    total: data.total,
                    percentage: tempGross > 0 ? (data.total / tempGross) * 100 : 0
                }));
            setPaymentMethods(payArray);

            // Sales Evolution Processing
            const maxSalesDay = Math.max(...Object.values(dateSalesMap), 1);
            const salesDateArray = Object.entries(dateSalesMap)
                .sort() // simple string sort for dd/MM works fine for close dates
                .slice(-14) // max 14 days
                .map(([date, amount]) => ({
                    date, amount, maxAmount: maxSalesDay
                }));
            setSalesEvolution(salesDateArray);

            setLoading(false);
        };

        fetchAnalytics();
    }, [tenant, timeRange, supabase]);

    // ── UI Shell ──
    if (loading) {
        return (
            <div className="flex h-full min-h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header & Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                        Business Analytics
                    </h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Inteligencia de negocio y rendimiento financiero.
                    </p>
                </div>

                <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 backdrop-blur-sm">
                    {(["today", "week", "month"] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${timeRange === range
                                    ? "bg-primary/20 text-primary ring-1 ring-primary/30 shadow-md"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                }`}
                        >
                            {range === "today" && "Hoy"}
                            {range === "week" && "Esta Semana"}
                            {range === "month" && "Este Mes"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top KPIs (Fixed) */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
                <KpiCard
                    title="Ingresos Brutos"
                    value={`$${grossRevenue.toLocaleString("es-AR")}`}
                    icon={<DollarSign size={20} />}
                    colorClass="text-emerald-400 bg-emerald-400/10 ring-emerald-400/20"
                />
                <KpiCard
                    title="Ganancia Neta"
                    value={`$${netProfit.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
                    icon={<TrendingUp size={20} />}
                    colorClass="text-primary bg-primary/10 ring-primary/20"
                    subtitle="Bruto menos precio de costo"
                />
                <KpiCard
                    title="Ticket Promedio"
                    value={`$${ticketPromedio.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
                    icon={<Receipt size={20} />}
                    colorClass="text-amber-400 bg-amber-400/10 ring-amber-400/20"
                />
                <KpiCard
                    title="Total de Pedidos"
                    value={`${totalOrders}`}
                    icon={<ShoppingBag size={20} />}
                    colorClass="text-sky-400 bg-sky-400/10 ring-sky-400/20"
                />
            </div>

            {/* Nav Tabs */}
            <div className="border-b border-zinc-800">
                <nav className="-mb-px flex space-x-8">
                    {(["finanzas", "menu", "operaciones"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors
                                ${activeTab === tab
                                    ? "border-primary text-primary drop-shadow-sm"
                                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                                }
                            `}
                        >
                            {tab === "finanzas" && "Finanzas"}
                            {tab === "menu" && "Menú & Productos"}
                            {tab === "operaciones" && "Operaciones"}
                        </button>
                    ))}
                </nav>
            </div>

            {/* TAB CONTENT */}

            {/* Tab: Finanzas */}
            {activeTab === "finanzas" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Evolución de Ventas */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md shadow-2xl">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                            <CalendarDays className="text-primary" size={20} />
                            Evolución de Ventas (Bruto)
                        </h3>
                        {salesEvolution.length === 0 ? (
                            <p className="text-zinc-500 py-10 text-center font-medium">Sin datos para graficar.</p>
                        ) : (
                            <div className="flex items-end gap-2 h-44 pt-4 mt-8 border-b border-zinc-800">
                                {salesEvolution.map((s, i) => {
                                    const heightPct = (s.amount / s.maxAmount) * 100;
                                    return (
                                        <div key={i} className="flex flex-col items-center flex-1 gap-2">
                                            <div className="group relative w-full flex justify-center items-end h-full">
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-zinc-800 text-white text-[10px] py-1 px-2 rounded font-mono transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                                    ${s.amount.toLocaleString()}
                                                </div>
                                                <div
                                                    className="w-full max-w-[40px] bg-primary/80 rounded-t-sm hover:ring-2 ring-primary/50 hover:bg-primary transition-all duration-300"
                                                    style={{ height: `${heightPct}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-zinc-500 font-mono rotate-45 mt-3 origin-top-left -ml-2">{s.date}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Métodos de Pago */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md shadow-2xl">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                            <PieChart className="text-emerald-400" size={20} />
                            Desglose de Medios de Pago
                        </h3>
                        {paymentMethods.length === 0 ? (
                            <p className="text-zinc-500 py-10 text-center font-medium">Sin ventas aún.</p>
                        ) : (
                            <div className="space-y-5">
                                {paymentMethods.map((pm, i) => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <div className="flex justify-between items-end text-sm">
                                            <span className="font-bold text-zinc-100 flex gap-2">
                                                {pm.method === "CASH" ? "Efectivo" : pm.method === "TRANSFER" ? "Transferencia" : pm.method === "MERCADOPAGO" ? "MercadoPago" : pm.method}
                                                <span className="text-emerald-400 font-normal">({pm.count} ops)</span>
                                            </span>
                                            <div className="flex items-end gap-3 tracking-tight">
                                                <span className="text-zinc-300 font-bold">${pm.total.toLocaleString("es-AR")}</span>
                                                <span className="font-mono text-zinc-500 text-xs w-10 text-right">{pm.percentage.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${pm.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Menú & Productos */}
            {activeTab === "menu" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Ranking de Productos */}
                    <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md shadow-2xl">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                            <BarChart2 className="text-sky-400" size={20} />
                            Productos más vendidos (Top 5 en Volumen)
                        </h3>
                        {topProducts.length === 0 ? (
                            <p className="text-zinc-500 py-10 text-center font-medium">Sin datos para mostrar en este período.</p>
                        ) : (
                            <div className="space-y-6">
                                {topProducts.map((p, i) => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <div className="flex justify-between items-end text-sm">
                                            <span className="font-bold text-zinc-100">{p.name} <span className="text-zinc-500 font-normal ml-2">{p.count} unid.</span></span>
                                            <span className="font-mono text-zinc-400 text-xs">{p.percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-sky-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_theme(colors.sky.500)]"
                                                style={{ width: `${p.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 flex flex-col">
                        {/* Top Rentables */}
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md shadow-2xl bg-gradient-to-tr from-amber-500/5 to-transparent flex-1">
                            <h3 className="flex items-center gap-2 text-md font-bold text-white mb-4">
                                <Star className="text-amber-400" size={18} fill="currentColor" />
                                Top 3 Rentables
                            </h3>
                            {profitableProducts.length === 0 ? (
                                <p className="text-xs text-zinc-500">Sin impacto por ahora.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {profitableProducts.map((p, i) => (
                                        <li key={i} className="flex justify-between items-center bg-zinc-900/80 p-3 rounded-xl border border-amber-900/30">
                                            <span className="text-sm font-semibold text-zinc-200 line-clamp-1">{p.name}</span>
                                            <span className="text-sm font-bold text-amber-400 font-mono tracking-tight shrink-0 ml-2">+${p.profit.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Productos Zombie */}
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md shadow-2xl flex-1">
                            <h3 className="flex items-center gap-2 text-md font-bold text-white mb-4">
                                <Ghost className="text-zinc-500" size={18} />
                                Productos Zombie (0 Ventas)
                            </h3>
                            {zombieProducts.length === 0 ? (
                                <p className="text-xs font-bold text-emerald-500/80 bg-emerald-500/10 p-3 rounded-xl text-center">¡Genial! No hay stock estancado.</p>
                            ) : (
                                <ul className="flex flex-wrap gap-2">
                                    {zombieProducts.map((p, i) => (
                                        <li key={i} className="px-2.5 py-1 rounded-md bg-zinc-800/80 text-xs font-medium text-zinc-400 border border-zinc-700/50">
                                            {p.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Operaciones */}
            {activeTab === "operaciones" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Logística & Top Zones Container */}
                    <div className="space-y-6">
                        {/* Logística */}
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md shadow-2xl">
                            <h3 className="text-lg font-bold text-white mb-6">Logística</h3>
                            <div className="space-y-5">
                                {(() => {
                                    const total = deliveryCount + takeawayCount;
                                    const delPct = total > 0 ? (deliveryCount / total) * 100 : 0;
                                    const takPct = total > 0 ? (takeawayCount / total) * 100 : 0;
                                    return (
                                        <>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold text-zinc-300">
                                                    <span className="flex items-center gap-1.5"><Truck size={14} className="text-indigo-400" /> Delivery ({deliveryCount})</span>
                                                    <span>{delPct.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_10px_theme(colors.indigo.500)]" style={{ width: `${delPct}%` }} />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold text-zinc-300">
                                                    <span className="flex items-center gap-1.5"><Package size={14} className="text-fuchsia-400" /> Retiro Local ({takeawayCount})</span>
                                                    <span>{takPct.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-fuchsia-500 transition-all duration-1000 shadow-[0_0_10px_theme(colors.fuchsia.500)]" style={{ width: `${takPct}%` }} />
                                                </div>
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>
                        </div>

                        {/* Top Zonas de Envío */}
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md shadow-2xl min-h-[160px]">
                            <h3 className="flex items-center gap-2 text-md font-bold text-white mb-4">
                                <Map className="text-indigo-400" size={18} />
                                Zonas de Envío Frecuentes
                            </h3>
                            {topZones.length === 0 ? (
                                <p className="text-xs text-zinc-500 mt-4">Sin información de zonas.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {topZones.map((z, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">{i + 1}</div>
                                            <span className="text-sm font-semibold text-zinc-200 uppercase truncate flex-1">{z.zone}</span>
                                            <span className="text-xs font-mono text-indigo-400">{z.percentage.toFixed(0)}%</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Heatmap / Horarios Pico */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-md shadow-2xl flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Activity className="text-primary" size={20} />
                            Horarios Pico (Afluencia)
                        </h3>
                        {hourlyData.length === 0 ? (
                            <p className="text-zinc-500 text-center font-medium mt-6">Sin actividad aún.</p>
                        ) : (
                            <div className="flex items-end gap-2 flex-1 pt-6 overflow-x-auto pb-4 scrollbar-hide border-b border-zinc-800/80">
                                {hourlyData.map((data, i) => {
                                    const heightPct = (data.count / data.maxCount) * 100;
                                    return (
                                        <div key={i} className="flex flex-col items-center flex-1 gap-2 min-w-[30px]">
                                            <div className="group relative w-full flex justify-center items-end h-full min-h-[150px]">
                                                {/* Tooltip on hover */}
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-zinc-800 text-white text-[10px] py-1 px-2 rounded font-mono transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                                    {data.count} ped.
                                                </div>
                                                <div
                                                    className="w-full max-w-[20px] bg-primary/40 rounded-t-sm hover:bg-primary transition-all duration-500 border-x border-t border-primary/20 backdrop-blur-sm shadow-[inset_0_2px_10px_rgba(var(--brand-color-rgb),0.2)]"
                                                    style={{ height: `${heightPct}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-zinc-500 font-mono -rotate-45 mt-4 origin-top-left -ml-2">{data.hour}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}

function KpiCard({ title, value, icon, colorClass, subtitle }: { title: string, value: string, icon: React.ReactNode, colorClass: string, subtitle?: string }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-2xl">
            {/* Soft decorative glow underneath */}
            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 blur-2xl ${colorClass.split(' ')[0].replace('text-', 'bg-')}`} />

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">{title}</h4>
                    <span className="mt-2 block text-2xl lg:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">{value}</span>
                    {subtitle && <span className="text-[10px] text-zinc-500 mt-1.5 font-medium block leading-tight border-l-2 border-zinc-800 pl-2">{subtitle}</span>}
                </div>
                <div className={`p-2.5 rounded-xl ring-1 ring-inset shadow-lg ${colorClass}`}>
                    {icon}
                </div>
            </div>
        </div>
    )
} 
