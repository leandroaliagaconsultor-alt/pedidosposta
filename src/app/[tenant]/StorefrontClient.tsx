"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Toaster } from "sonner";
import { ShoppingBag, MapPin, Clock, Bike, ShoppingCart, Instagram, Facebook, MessageCircle } from "lucide-react";

import { ProductCard } from "@/components/storefront/ProductCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import ActiveOrderBanner from "@/components/storefront/ActiveOrderBanner";
import { useCartStore } from "@/lib/store/cartStore";
import type { Product } from "@/components/storefront/ProductModal";
import { useTenantThemeEngine } from "@/hooks/useTenantThemeEngine";
import { checkIfStoreIsOpen } from "@/utils/storeHours";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = {
    id: string;
    name: string;
};

export interface StorefrontData {
    brand: {
        name: string;
        slug: string;
        color_hex: string | null;
        logo_url: string | null;
        banner_url: string | null;
        address: string | null;
        business_hours: string | null;
        schedule: any;
        override_status: string | null;
        announcement_text: string | null;
        is_suspended: boolean;
        min_order: number | null;
        public_phone: string | null;
        instagram_url: string | null;
        facebook_url: string | null;
        delivery_pricing_type: string | null;
        fixed_delivery_price: number | null;
        base_delivery_price: number | null;
        base_delivery_km: number | null;
        extra_price_per_km: number | null;
        theme: any;
        show_whatsapp_checkout: boolean;
    };
    categories: Category[];
    products: Product[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StorefrontClient({ data }: { data: StorefrontData }) {
    const { brand, categories, products } = data;

    const [activeCategory, setActiveCategory] = useState<string | null>(
        categories.length > 0 ? categories[0].id : null
    );
    const [cartOpen, setCartOpen] = useState(false);
    const [isStoreOpen, setIsStoreOpen] = useState(true);

    const cartItems = useCartStore((state) => state.items);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const themeEngine = useTenantThemeEngine({
        template: brand?.theme?.template,
        theme_mode: brand?.theme?.mode,
        color_hex: brand?.color_hex ?? undefined,
        font_family: brand?.theme?.font_family,
    });

    // ── Motor de Horarios en Vivo ──
    useEffect(() => {
        if (!brand) return;

        const evaluateStatus = () => {
            const currentStatus = checkIfStoreIsOpen(brand.schedule, brand.override_status as any);
            setIsStoreOpen(currentStatus);
        };

        evaluateStatus();

        const intervalId = setInterval(evaluateStatus, 60000);
        return () => clearInterval(intervalId);
    }, [brand]);

    const formatUrl = (url: string) => (url && !url.startsWith("http")) ? `https://${url}` : url;

    const filteredProducts = products.filter(
        (p) => p.categoryId === activeCategory
    );

    if (themeEngine.isProLayout) {
        if (brand?.is_suspended) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-center px-4">
                    <div className="h-20 w-20 mb-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <ShoppingCart size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Tienda no disponible</h1>
                    <p className="text-zinc-500 max-w-sm">
                        La tienda no está disponible temporalmente. Por favor, intentá nuevamente más tarde.
                    </p>
                </div>
            );
        }

        return (
            <main className="flex min-h-screen w-full flex-col lg:grid lg:grid-cols-12 bg-[#09090b] text-[#FAFAFA]" style={{ '--brand-color': themeEngine.primaryColor, '--brand-accent': themeEngine.primaryColor } as React.CSSProperties}>
                {brand?.announcement_text && (
                    <div className="lg:col-span-12 w-full bg-emerald-500 text-white text-sm py-2 px-4 text-center font-bold tracking-wide shadow-md z-50 order-first">
                        {brand.announcement_text}
                    </div>
                )}
                <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

                {/* ─── 1. Hero Section (Cols 1-4) ─── */}
                <section className="relative w-full lg:col-span-4 lg:sticky lg:top-0 lg:h-screen lg:border-r border-zinc-800/50 flex flex-col justify-end p-6 overflow-hidden">
                    {/* Background */}
                    {brand?.banner_url && (
                        <div className="absolute inset-0 z-0">
                            <Image src={brand.banner_url} fill objectFit="cover" className="opacity-40 mix-blend-luminosity" alt="Banner" />
                            <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
                        </div>
                    )}
                    <div className="relative z-10 w-full mb-4 lg:mb-12 flex flex-col items-center lg:items-start">
                        {brand?.logo_url && (
                            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-2 mb-6 overflow-hidden transition-all duration-300" style={{ borderColor: themeEngine.primaryColor, boxShadow: `0 0 15px ${themeEngine.primaryColor}80, 0 0 30px ${themeEngine.primaryColor}40` }}>
                                <Image src={brand.logo_url} width={128} height={128} alt="logo" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <h1 className="text-5xl lg:text-[5rem] font-black uppercase tracking-tighter text-white leading-[0.85] text-center lg:text-left drop-shadow-md pb-2">
                            {brand?.name ? brand.name : "MY LOCAL"}
                        </h1>
                        <p className="mt-4 font-black uppercase tracking-[0.2em] text-xs lg:text-sm text-center lg:text-left drop-shadow-[0_0_10px_var(--brand-color)]" style={{ color: "var(--brand-color)" }}>
                            BUILD YOUR MASTERPIECE
                        </p>

                        {/* Status Badge Pro */}
                        <div className="mt-6 flex justify-center lg:justify-start">
                            {!isStoreOpen ? (
                                <span className="inline-flex items-center rounded-full bg-red-500 px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                    <span className="mr-2 h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                    Cerrado momentáneamente
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                    <span className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                    Abierto ahora
                                </span>
                            )}
                        </div>

                        {/* Info Bar pro */}
                        <div className="mt-8 flex flex-wrap justify-center lg:justify-start items-center gap-2">
                            {brand?.address && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/50 text-[10px] sm:text-xs font-bold backdrop-blur-md">
                                    <MapPin size={12} style={{ color: "var(--brand-color)" }} />
                                    <span>{brand.address}</span>
                                </div>
                            )}
                            {brand?.business_hours && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/50 text-[10px] sm:text-xs font-bold backdrop-blur-md">
                                    <Clock size={12} style={{ color: "var(--brand-color)" }} />
                                    <span>{brand.business_hours}</span>
                                </div>
                            )}
                            {brand?.delivery_pricing_type === 'fixed' && brand?.fixed_delivery_price !== undefined && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/50 text-[10px] sm:text-xs font-bold backdrop-blur-md">
                                    <Bike size={12} style={{ color: "var(--brand-color)" }} />
                                    <span>Envío: {brand.fixed_delivery_price === 0 ? "Gratis" : `$${brand.fixed_delivery_price}`}</span>
                                </div>
                            )}
                            {brand?.delivery_pricing_type === 'distance' && brand?.base_delivery_price !== undefined && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={300}>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/50 text-[10px] sm:text-xs font-bold backdrop-blur-md cursor-help">
                                                <Bike size={12} style={{ color: "var(--brand-color)" }} />
                                                <span className="border-b border-dashed border-zinc-500">Envío desde ${brand.base_delivery_price}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-center p-3 text-xs z-50">
                                            <p>Tarifa base de ${brand.base_delivery_price} cubriendo hasta {brand.base_delivery_km} km.</p>
                                            <p>Luego, ${brand.extra_price_per_km} por cada kilómetro adicional.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/50 text-[10px] sm:text-xs font-bold backdrop-blur-md">
                                <ShoppingBag size={12} style={{ color: "var(--brand-color)" }} />
                                <span>Retiro en local gratis</span>
                            </div>
                            {brand?.min_order !== null && brand?.min_order !== undefined && brand.min_order > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/50 text-[10px] sm:text-xs font-bold backdrop-blur-md">
                                    <ShoppingCart size={12} style={{ color: "var(--brand-color)" }} />
                                    <span>Mín. $ {brand.min_order}</span>
                                </div>
                            )}
                            {brand?.public_phone && (
                                <a href={`https://wa.me/${brand.public_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/50 text-[10px] sm:text-xs font-bold backdrop-blur-md hover:bg-zinc-800 transition-colors">
                                    <MessageCircle size={12} className="text-[#25D366]" />
                                    <span>WhatsApp</span>
                                </a>
                            )}
                            {brand?.instagram_url && (
                                <a href={formatUrl(brand.instagram_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/50 text-[10px] sm:text-xs font-bold backdrop-blur-md hover:bg-zinc-800 transition-colors">
                                    <Instagram size={12} className="text-[#E4405F]" />
                                    <span>Instagram</span>
                                </a>
                            )}
                            {brand?.facebook_url && (
                                <a href={formatUrl(brand.facebook_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/50 text-[10px] sm:text-xs font-bold backdrop-blur-md hover:bg-zinc-800 transition-colors">
                                    <Facebook size={12} className="text-[#1877F2]" />
                                    <span>Facebook</span>
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {/* ─── 2. Product Grid (Cols 5-9) ─── */}
                <div className="lg:col-span-5 flex flex-col p-4 lg:p-8 border-r border-zinc-800/50 bg-[#09090b] min-h-screen pb-28 lg:pb-8">
                    {/* Categories sticky inside this col */}
                    <nav className="sticky top-0 z-40 w-full bg-[#09090b]/90 backdrop-blur-md mb-6 py-4">
                        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
                            {categories.map((cat) => {
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`relative whitespace-nowrap text-sm font-bold uppercase tracking-widest transition-all duration-300 ${isActive ? "text-white" : "opacity-40 hover:opacity-100"}`}
                                    >
                                        {cat.name}
                                        {isActive && <span className="absolute -bottom-4 left-0 right-0 h-[2px] shadow-[0_0_10px_var(--brand-color)]" style={{ backgroundColor: themeEngine.primaryColor }} />}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    <h2 className="mb-6 text-2xl font-black uppercase tracking-widest opacity-90 text-white leading-none">
                        {categories.find((c) => c.id === activeCategory)?.name || "Menú"}
                    </h2>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} tokens={themeEngine.tokens} accentColor={themeEngine.primaryColor} accentTextColor={themeEngine.accentIsLight ? '#18181b' : '#ffffff'} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20">
                            <p className="opacity-60 text-sm font-bold uppercase tracking-widest">No products here</p>
                        </div>
                    )}
                </div>

                {/* ─── 3. Cart Fixed (Cols 10-12) ─── */}
                <aside className="hidden lg:flex lg:col-span-3 bg-[#050505] flex-col h-screen sticky top-0 p-8 border-l border-zinc-800/50">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-white border-b border-zinc-800 pb-6 mb-6">Your Order</h3>
                    <div className="flex-1 overflow-y-auto w-full no-scrollbar">
                        {cartItems.length > 0 ? (
                            cartItems.map((item) => (
                                <div key={item.productId} className="flex justify-between items-start mb-4 bg-zinc-900/30 p-4 rounded-lg border border-zinc-800 transition-colors hover:border-zinc-700">
                                    <div className="flex flex-col gap-1 pr-4">
                                        <p className="font-bold text-white leading-tight">{item.name}</p>
                                        <span className="text-xs font-black" style={{ color: "var(--brand-color)" }}>QTY: {item.quantity}</span>
                                    </div>
                                    <p className="font-bold text-sm text-white whitespace-nowrap">${(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="flex h-full items-center justify-center opacity-40 font-bold tracking-widest uppercase text-sm">Cart is empty</div>
                        )}
                    </div>
                    {cartItems.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-zinc-800">
                            <div className="flex justify-between items-center mb-6">
                                <span className="font-bold text-zinc-400 uppercase tracking-widest text-sm">Total</span>
                                <span className="text-2xl font-black text-white">${cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}</span>
                            </div>
                            {isStoreOpen ? (
                                <button onClick={() => setCartOpen(true)} className="w-full py-4 text-[#09090b] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_var(--brand-color)] hover:scale-[1.02] active:scale-95 transition-all outline-none" style={{ backgroundColor: "var(--brand-color)" }}>Checkout</button>
                            ) : (
                                <button disabled className="w-full py-4 bg-red-950/40 border border-red-900/50 text-red-500 font-black uppercase tracking-[0.2em] opacity-80 cursor-not-allowed">Local Cerrado</button>
                            )}
                        </div>
                    )}
                </aside>

                {/* Floating mobile cart pill + drawer */}
                {totalItems > 0 && (
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent">
                        <button
                            onClick={() => setCartOpen(true)}
                            className="flex w-full items-center justify-between rounded-2xl px-6 py-4 text-sm font-extrabold shadow-[0_-4px_30px_var(--brand-color)] shadow-primary/30 transition-all active:scale-[0.98]"
                            style={{ backgroundColor: themeEngine.primaryColor, color: '#09090b' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-sm font-black text-white">
                                    {totalItems}
                                </div>
                                <span className="tracking-wide uppercase">Ver Pedido</span>
                            </div>
                            <span className="text-base font-black">
                                ${cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString('es-AR')}
                            </span>
                        </button>
                    </div>
                )}
                <CartDrawer open={cartOpen} onOpenChange={setCartOpen} isStoreOpen={isStoreOpen} />
            </main>
        );
    }

    const t = themeEngine.tokens;
    const accentColor = themeEngine.primaryColor;
    const accentTextColor = themeEngine.accentIsLight ? '#18181b' : '#ffffff';

    if (brand?.is_suspended) {
        return (
            <div className={`flex min-h-screen flex-col items-center justify-center ${t.bg} text-center px-4`}>
                <div className="h-20 w-20 mb-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-500">
                    <ShoppingCart size={32} />
                </div>
                <h1 className={`text-2xl font-bold ${t.text} mb-2`}>Tienda no disponible</h1>
                <p className={`${t.textMuted} max-w-sm`}>
                    La tienda no está disponible temporalmente. Por favor, intentá nuevamente más tarde.
                </p>
            </div>
        );
    }

    return (
        <main className={`mx-auto flex min-h-screen w-full flex-col pb-28 ${t.bg} ${t.text} transition-colors duration-300`} style={themeEngine.cssVars}>
            {brand?.announcement_text && (
                <div
                    className="w-full text-sm py-2.5 px-4 text-center font-semibold tracking-wide shadow-sm z-50"
                    style={{ backgroundColor: accentColor, color: accentTextColor }}
                >
                    {brand.announcement_text}
                </div>
            )}
            <Toaster
                position="top-center"
                toastOptions={{
                    style: t.mode === 'light'
                        ? { background: "#ffffff", border: "1px solid #e4e4e7", color: "#18181b" }
                        : { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" },
                }}
            />

            {/* ─── 1. Hero Section ─── */}
            <section className="relative w-full">
                {/* Banner */}
                <div className={`relative h-44 w-full overflow-hidden sm:h-64 ${t.bg}`}>
                    {brand?.banner_url ? (
                        <Image
                            src={brand.banner_url}
                            alt="Banner"
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="h-full w-full" style={{ backgroundColor: `${accentColor}15` }} />
                    )}
                    <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${t.mode === 'light' ? 'from-black/20' : 'from-black/40'} to-transparent`} />
                    <div className={`absolute inset-x-0 bottom-0 h-32 ${t.bg} [mask-image:linear-gradient(to_top,black_60%,transparent)]`} />
                </div>

                {/* Profile Header */}
                <div className="w-full max-w-3xl mx-auto flex flex-col items-center px-4 pb-10">
                    {/* Logo */}
                    <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 z-10 mx-auto -mt-12 sm:-mt-14 ${t.surface} shadow-lg transition-all duration-300`} style={{ borderColor: accentColor }}>
                        {brand?.logo_url ? (
                            <Image src={brand.logo_url} alt="Logo" width={180} height={180} className="object-cover w-full h-full" />
                        ) : (
                            <div className={`flex h-full w-full items-center justify-center ${t.textMuted} font-bold text-4xl`}>
                                {brand?.name?.charAt(0) || "P"}
                            </div>
                        )}
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4">
                        {!isStoreOpen ? (
                            <span className="inline-flex items-center rounded-full bg-red-500 px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white">
                                <span className="mr-2 h-1.5 w-1.5 rounded-full bg-white" />
                                Cerrado momentáneamente
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white">
                                <span className="mr-2 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                Abierto ahora
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className={`mt-5 text-3xl sm:text-4xl md:text-5xl text-center max-w-2xl mx-auto leading-tight px-4 font-bold tracking-tight ${t.text}`}>
                        {brand?.name || "PedidosPosta"}
                    </h1>

                    {/* Info Pills */}
                    <div className="flex flex-wrap justify-center items-center gap-2 mt-4 w-full px-4">
                        {brand?.address && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${t.surfaceBorder} ${t.surface} text-[10px] sm:text-xs font-medium ${t.textMuted}`}>
                                <MapPin size={13} style={{ color: accentColor }} />
                                <span>{brand.address}</span>
                            </div>
                        )}
                        {brand?.business_hours && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${t.surfaceBorder} ${t.surface} text-[10px] sm:text-xs font-medium ${t.textMuted}`}>
                                <Clock size={13} style={{ color: accentColor }} />
                                <span>{brand.business_hours}</span>
                            </div>
                        )}
                        {brand?.delivery_pricing_type === 'fixed' && brand?.fixed_delivery_price !== undefined && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${t.surfaceBorder} ${t.surface} text-[10px] sm:text-xs font-medium ${t.textMuted}`}>
                                <Bike size={13} style={{ color: accentColor }} />
                                <span>Envío: {brand.fixed_delivery_price === 0 ? "Gratis" : `$${brand.fixed_delivery_price}`}</span>
                            </div>
                        )}
                        {brand?.delivery_pricing_type === 'distance' && brand?.base_delivery_price !== undefined && (
                            <TooltipProvider>
                                <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${t.surfaceBorder} ${t.surface} text-[10px] sm:text-xs font-medium ${t.textMuted} cursor-help`}>
                                            <Bike size={13} style={{ color: accentColor }} />
                                            <span>Envío desde ${brand.base_delivery_price}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-center p-3 text-xs z-50">
                                        <p>Tarifa base de ${brand.base_delivery_price} cubriendo hasta {brand.base_delivery_km} km.</p>
                                        <p>Luego, ${brand.extra_price_per_km} por cada kilómetro adicional.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${t.surfaceBorder} ${t.surface} text-[10px] sm:text-xs font-medium ${t.textMuted}`}>
                            <ShoppingBag size={13} style={{ color: accentColor }} />
                            <span>Retiro en local gratis</span>
                        </div>
                        {brand?.min_order !== null && brand?.min_order !== undefined && brand.min_order > 0 && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${t.surfaceBorder} ${t.surface} text-[10px] sm:text-xs font-medium ${t.textMuted}`}>
                                <ShoppingCart size={13} style={{ color: accentColor }} />
                                <span>Mín. $ {brand.min_order}</span>
                            </div>
                        )}
                        {brand?.public_phone && (
                            <a href={`https://wa.me/${brand.public_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${t.surfaceBorder} ${t.surface} text-[10px] sm:text-xs font-medium ${t.textMuted} hover:opacity-80 transition-opacity`}>
                                <MessageCircle size={13} className="text-emerald-500" />
                                <span>WhatsApp</span>
                            </a>
                        )}
                        {brand?.instagram_url && (
                            <a href={formatUrl(brand.instagram_url)} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${t.surfaceBorder} ${t.surface} text-[10px] sm:text-xs font-medium ${t.textMuted} hover:opacity-80 transition-opacity`}>
                                <Instagram size={13} className="text-rose-500" />
                                <span>Instagram</span>
                            </a>
                        )}
                        {brand?.facebook_url && (
                            <a href={formatUrl(brand.facebook_url)} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${t.surfaceBorder} ${t.surface} text-[10px] sm:text-xs font-medium ${t.textMuted} hover:opacity-80 transition-opacity`}>
                                <Facebook size={13} className="text-blue-500" />
                                <span>Facebook</span>
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* ─── 2. Sticky Category Nav ─── */}
            <nav className={`sticky top-0 z-40 w-full border-b ${t.navBorder} ${t.navBg} backdrop-blur-md`}>
                <div className="mx-auto flex w-full max-w-3xl items-center gap-1 overflow-x-auto px-4 py-3 scrollbar-hide">
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`relative whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? `${t.categoryActiveBg} font-semibold`
                                    : `${t.textMuted} hover:${t.text}`
                                    }`}
                                style={isActive ? { color: accentColor } : undefined}
                            >
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* ─── 3. Product Grid ─── */}
            <div className="mx-auto w-full max-w-3xl px-4 pt-6">
                <h2 className={`mb-5 text-xl font-bold ${t.text}`}>
                    {categories.find((c) => c.id === activeCategory)?.name || "Menú"}
                </h2>

                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                tokens={t}
                                accentColor={accentColor}
                                accentTextColor={accentTextColor}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={`flex h-40 flex-col items-center justify-center rounded-xl border border-dashed ${t.surfaceBorder}`}>
                        <p className={t.textMuted}>No hay productos en esta categoría.</p>
                    </div>
                )}
            </div>

            {/* ─── 4. Floating Cart Pill ─── */}
            {totalItems > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-8 pointer-events-none">
                    <button
                        onClick={() => setCartOpen(true)}
                        className="pointer-events-auto flex w-full max-w-3xl mx-auto items-center justify-between rounded-2xl px-6 py-4 text-sm font-bold shadow-lg transition-all active:scale-[0.98]"
                        style={{ backgroundColor: accentColor, color: accentTextColor }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-sm font-bold text-white">
                                {totalItems}
                            </div>
                            <span className="tracking-wide uppercase">Ver Pedido</span>
                        </div>
                        <span className="text-base font-bold">
                            ${cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString('es-AR')}
                        </span>
                    </button>
                </div>
            )}

            {/* ─── 5. Cart Drawer ─── */}
            <CartDrawer open={cartOpen} onOpenChange={setCartOpen} isStoreOpen={isStoreOpen} />
            <ActiveOrderBanner tenant={brand.slug} />
        </main>
    );
}
