"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, Clock, ExternalLink, ShoppingBag, X, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";

// ── Store hours check ───────────────────────────────────────────────────────
function checkIsOpen(openingHours: any): boolean {
    if (!openingHours) return false;
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    const dayMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = dayMap[now.getDay()];
    const slots = openingHours[today];
    if (!slots || slots.length === 0) return false;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return slots.some((slot: { start: string; end: string }) => {
        const [sh, sm] = slot.start.split(":").map(Number);
        const [eh, em] = slot.end.split(":").map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        if (endMin <= startMin) return currentMinutes >= startMin || currentMinutes <= endMin;
        return currentMinutes >= startMin && currentMinutes <= endMin;
    });
}

interface Tenant {
    id: string; name: string; slug: string; description: string | null;
    category: string; categories: string[] | null;
    type: "saas" | "directory"; logo_url: string | null;
    banner_url: string | null; external_url: string | null;
    opening_hours: any; is_directory_active: boolean; city: string;
}

function getTenantCategories(t: Tenant): string[] {
    if (t.categories && t.categories.length > 0) return t.categories;
    if (t.category) return [t.category];
    return ["otros"];
}

async function trackClick(tenantId: string) {
    try { await fetch("/api/directory/click", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId }) }); } catch { /* silent */ }
}

// ═════════════════════════════════════════════════════════════════════════════

export function DirectoryClient({ tenants, city }: { tenants: Tenant[]; city: string }) {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showOpenOnly, setShowOpenOnly] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const cityName = city.charAt(0).toUpperCase() + city.slice(1);

    const availableCategories = useMemo(() => {
        const catSet = new Set<string>();
        tenants.forEach(t => getTenantCategories(t).forEach(c => catSet.add(c)));
        return CATEGORIES.filter(c => catSet.has(c.key));
    }, [tenants]);

    const filtered = useMemo(() => {
        return tenants.filter(t => {
            if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
            if (selectedCategory && !getTenantCategories(t).includes(selectedCategory)) return false;
            if (showOpenOnly && !checkIsOpen(t.opening_hours)) return false;
            return true;
        });
    }, [tenants, search, selectedCategory, showOpenOnly]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            if (a.type === "saas" && b.type !== "saas") return -1;
            if (a.type !== "saas" && b.type === "saas") return 1;
            return 0;
        });
    }, [filtered]);

    const scroll = (dir: "left" | "right") => {
        scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ════════ BRAND BAR (acento de color) ════════ */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600" />

            {/* ════════ NAVBAR ════════ */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/">
                        <Image src="/logo.png" alt="PedidosPosta" width={180} height={40} className="h-9 sm:h-10 w-auto" priority />
                    </Link>
                    <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gray-100 border border-gray-200 text-sm text-gray-700 hover:bg-gray-200 transition">
                        <MapPin size={14} className="text-emerald-500" />
                        <span className="font-semibold">{cityName}</span>
                    </button>
                </div>
            </header>

            {/* ════════ HERO + SEARCH ════════ */}
            <section className="relative overflow-hidden">
                {/* Decorative bg */}
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-gray-50" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40 -mr-48 -mt-24" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-30 -ml-36 -mb-12" />

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        ¿Qué vas a pedir<br className="sm:hidden" /> <span className="text-emerald-600">hoy</span>?
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm sm:text-base">
                        Explorá los mejores locales gastronómicos de {cityName}
                    </p>
                    <div className="relative mt-6 max-w-2xl">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar locales o comidas..."
                            className="w-full bg-white border border-gray-200 rounded-full pl-12 pr-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition shadow-sm"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* ════════ CATEGORY CAROUSEL ════════ */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-900">Explorar categorías</h2>
                    <div className="hidden sm:flex gap-1.5">
                        <button onClick={() => scroll("left")} className="p-2 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:shadow-sm transition">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => scroll("right")} className="p-2 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:shadow-sm transition">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                    {availableCategories.map(cat => {
                        const isActive = selectedCategory === cat.key;
                        const count = tenants.filter(t => getTenantCategories(t).includes(cat.key)).length;
                        return (
                            <button
                                key={cat.key}
                                onClick={() => setSelectedCategory(isActive ? null : cat.key)}
                                className={`flex-shrink-0 snap-start w-28 sm:w-32 flex flex-col items-center gap-2.5 pt-4 pb-3 rounded-2xl border transition-all duration-200 ${
                                    isActive
                                        ? "border-emerald-400 bg-emerald-50 scale-[1.03] shadow-md shadow-emerald-100"
                                        : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
                                }`}
                            >
                                <div className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl overflow-hidden flex items-center justify-center shadow transition-transform ${isActive ? "scale-110" : ""} ${!cat.image ? `bg-gradient-to-br ${cat.from} ${cat.to}` : ""}`}>
                                    {cat.image ? (
                                        <Image src={cat.image} alt={cat.label} width={72} height={72} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl sm:text-4xl drop-shadow">{cat.emoji}</span>
                                    )}
                                </div>
                                <span className={`text-xs sm:text-sm font-semibold transition-colors ${isActive ? "text-emerald-700" : "text-gray-700"}`}>
                                    {cat.label}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">{count} locales</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ════════ DIVIDER ════════ */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>

            {/* ════════ FILTER BAR ════════ */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center gap-2.5">
                {selectedCategory && (
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 hover:bg-emerald-100 transition"
                    >
                        {CATEGORY_MAP[selectedCategory]?.emoji} {CATEGORY_MAP[selectedCategory]?.label}
                        <X size={12} />
                    </button>
                )}
                <button
                    onClick={() => setShowOpenOnly(!showOpenOnly)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        showOpenOnly
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                    }`}
                >
                    <Clock size={12} /> Abiertos ahora
                </button>
                <span className="text-xs text-gray-400 ml-auto font-medium">{sorted.length} locales</span>
            </div>

            {/* ════════ STORE CARDS ════════ */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
                <h2 className="text-xl font-bold text-gray-900 mb-5">
                    {selectedCategory ? (CATEGORY_MAP[selectedCategory]?.label || "Locales") : "Locales en tu ciudad"}
                </h2>

                {sorted.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                        <span className="text-5xl block mb-4">🍽️</span>
                        <p className="text-gray-500 text-sm">No encontramos locales con esos filtros.</p>
                        <button onClick={() => { setSelectedCategory(null); setSearch(""); setShowOpenOnly(false); }} className="mt-3 text-sm text-emerald-600 hover:underline font-semibold">
                            Ver todos los locales
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sorted.map(tenant => {
                            const isOpen = checkIsOpen(tenant.opening_hours);
                            const isSaas = tenant.type === "saas";
                            const href = isSaas ? `/${tenant.slug}` : (tenant.external_url || "#");
                            const cats = getTenantCategories(tenant);
                            const primaryCat = CATEGORY_MAP[cats[0]] || CATEGORY_MAP.otros;

                            return (
                                <article
                                    key={tenant.id}
                                    className={`group rounded-2xl bg-white p-5 transition-all duration-300 hover:shadow-lg ${
                                        isSaas
                                            ? "border-2 border-emerald-200 hover:border-emerald-300 shadow-sm shadow-emerald-50"
                                            : "border border-gray-200 hover:border-gray-300 shadow-sm"
                                    }`}
                                >
                                    {/* Top row: Logo + Info */}
                                    <div className="flex items-start gap-4">
                                        {tenant.logo_url ? (
                                            <img src={tenant.logo_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 shadow shrink-0" />
                                        ) : (
                                            <div className={`w-20 h-20 rounded-full border-2 border-gray-100 shadow shrink-0 bg-gradient-to-br ${primaryCat.from} ${primaryCat.to} flex items-center justify-center text-2xl font-black text-white`}>
                                                {tenant.name.charAt(0)}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight truncate">{tenant.name}</h3>
                                                {isSaas && (
                                                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200" title="Verificado — Pedí online directo">
                                                        <Zap size={12} className="text-emerald-600 fill-emerald-200" />
                                                    </span>
                                                )}
                                            </div>

                                            {/* Category tags */}
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {cats.map(catKey => {
                                                    const c = CATEGORY_MAP[catKey];
                                                    return c ? (
                                                        <span key={catKey} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">
                                                            {c.emoji} {c.label}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>

                                            {/* Open/Closed badge */}
                                            {isOpen ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Abierto
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-400 border border-gray-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                    Cerrado
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {tenant.description && (
                                        <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed mt-3">{tenant.description}</p>
                                    )}

                                    <a
                                        href={href}
                                        onClick={() => trackClick(tenant.id)}
                                        target={isSaas ? undefined : "_blank"}
                                        rel={isSaas ? undefined : "noopener noreferrer"}
                                        className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                                            !isOpen
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                                                : isSaas
                                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-200 active:scale-[0.98]"
                                                    : "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]"
                                        }`}
                                    >
                                        {!isOpen ? (
                                            <><Clock size={14} /> Abre más tarde</>
                                        ) : isSaas ? (
                                            <><ShoppingBag size={14} /> Ver Menú y Pedir</>
                                        ) : (
                                            <><ExternalLink size={14} /> Contactar</>
                                        )}
                                    </a>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ════════ FOOTER ════════ */}
            <footer className="border-t border-gray-200 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center space-y-2">
                    <Image src="/logo.png" alt="PedidosPosta" width={120} height={28} className="h-6 w-auto mx-auto opacity-50" />
                    <p className="text-[11px] text-gray-400">Directorio gastronómico de {cityName}</p>
                    <p className="text-[11px] text-gray-400">
                        ¿Tenés un local? <Link href="/register" className="text-emerald-600 hover:underline font-semibold">Registrate gratis</Link>
                    </p>
                </div>
                {/* Bottom brand accent */}
                <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600" />
            </footer>
        </div>
    );
}
