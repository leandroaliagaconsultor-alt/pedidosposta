"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ListOrdered, Palette, LayoutDashboard, LogOut,
    Loader2, Settings, BarChart, Menu, X, ExternalLink,
    CreditCard, AlertTriangle, Tag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";

export default function ManagerShell({
    children,
    tenant,
    subscriptionStatus,
    trialEndsAt,
}: {
    children: React.ReactNode;
    tenant: string;
    subscriptionStatus: string;
    trialEndsAt: string | null;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [tenantData, setTenantData] = useState<{ name: string; logo_url: string | null } | null>(null);

    useEffect(() => {
        supabase.from("tenants").select("name, logo_url").eq("slug", tenant).single()
            .then(({ data }: { data: any }) => { if (data) setTenantData(data); });
    }, [supabase, tenant]);

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        await supabase.auth.signOut();
        toast.success("Sesión cerrada correctamente");
        router.push(`/${tenant}/manager/login`);
        router.refresh();
    };

    // ── Subscription status logic ────────────────────────────────────────
    const isTrialing = subscriptionStatus === "trialing";
    const isExpired = (() => {
        if (subscriptionStatus === "active") return false;
        if (isTrialing && trialEndsAt) return new Date(trialEndsAt) < new Date();
        if (subscriptionStatus === "past_due" || subscriptionStatus === "cancelled") return true;
        return false;
    })();

    const trialDaysLeft = (() => {
        if (!isTrialing || !trialEndsAt) return 0;
        const diff = new Date(trialEndsAt).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    })();

    const navLinks = [
        { name: "Live Orders", href: `/${tenant}/manager`, icon: ListOrdered },
        { name: "Menu Builder", href: `/${tenant}/manager/menu`, icon: LayoutDashboard },
        { name: "Brand Studio", href: `/${tenant}/manager/brand`, icon: Palette },
        { name: "Configuración", href: `/${tenant}/manager/settings`, icon: Settings },
        { name: "Cupones", href: `/${tenant}/manager/coupons`, icon: Tag },
        { name: "Analytics", href: `/${tenant}/manager/analytics`, icon: BarChart },
        { name: "Suscripción", href: `/${tenant}/manager/subscription`, icon: CreditCard },
    ];

    const renderNavLinks = (onClickExtra?: () => void) =>
        navLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClickExtra}
                    className={`relative flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[13px] font-medium transition-all ${isActive
                        ? "bg-white font-bold text-[#0F1210] border border-[rgba(15,18,16,.18)] shadow-sm"
                        : "text-[#0F1210]/70 hover:bg-[rgba(15,18,16,.04)] hover:text-[#0F1210] border border-transparent"
                        }`}
                >
                    {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r bg-[#43926A]" />
                    )}
                    <Icon size={16} className={isActive ? "text-[#43926A]" : "opacity-60"} />
                    {item.name}
                </Link>
            );
        });

    const renderLogoutButton = () => (
        <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-[9px] border border-[rgba(15,18,16,.1)] py-2.5 text-xs font-medium text-[#575757] transition-all hover:border-[#E25A2B] hover:text-[#E25A2B] disabled:opacity-50"
        >
            {isLoggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            Cerrar Sesión
        </button>
    );

    return (
        <div className="flex h-screen overflow-hidden text-[#0F1210]" style={{ background: "#F6F2EA" }}>
            <Toaster position="top-center" toastOptions={{ style: { background: "#fff", border: "1px solid rgba(15,18,16,.1)", color: "#0F1210" } }} />

            {/* ═══ DESKTOP SIDEBAR ═══ */}
            <aside className="hidden md:flex w-[260px] flex-col border-r border-[rgba(15,18,16,.1)]" style={{ background: "#FBF8F1" }}>
                <div className="p-6 pb-4">
                    <Link href={`/${tenant}/manager`} className="flex items-center">
                        <span className="font-['Archivo_Black',sans-serif] text-[18px] text-[#575757]">Pedidos</span>
                        <span className="font-['Archivo_Black',sans-serif] text-[18px] text-[#0F1210]">Posta</span>
                        <span className="ml-0.5 inline-block h-[7px] w-[7px] rounded-full bg-[#43926A]" />
                    </Link>

                    {/* Store ID card */}
                    <div className="mt-4 rounded-[10px] bg-[#0F1210] px-3 py-2.5 text-[#F6F2EA]">
                        <div className="font-['Archivo_Black',sans-serif] text-sm tracking-tight">
                            {(tenantData?.name || tenant).toUpperCase()}
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#F6F2EA]/55 mt-0.5">
                            Panel administrador
                        </div>
                    </div>

                    {/* View shop button */}
                    <Link
                        href={`/${tenant}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#43926A] px-4 py-2.5 font-['Archivo_Black',sans-serif] text-[11px] uppercase tracking-[.06em] text-white shadow-[0_6px_18px_-8px_rgba(67,146,106,.6)] transition-all hover:-translate-y-px hover:shadow-[0_10px_22px_-8px_rgba(67,146,106,.7)]"
                    >
                        <ExternalLink size={14} />
                        Ver mi tienda
                    </Link>
                </div>

                <nav className="flex-1 space-y-0.5 px-[18px] py-2">
                    {renderNavLinks()}
                </nav>

                <div className="border-t border-[rgba(15,18,16,.1)] p-[18px] space-y-2.5">
                    <div className="flex items-center gap-2.5 px-1.5 py-1">
                        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#43926A] text-white font-['Archivo_Black',sans-serif] text-xs">
                            {(tenantData?.name || tenant).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-bold truncate">{tenantData?.name || tenant}</p>
                            <p className="text-[10px] font-mono text-[#575757] truncate">{tenant}</p>
                        </div>
                    </div>
                    {renderLogoutButton()}
                </div>
            </aside>

            {/* ═══ MOBILE HEADER ═══ */}
            <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-[rgba(15,18,16,.1)] px-4 py-3 md:hidden" style={{ background: "#FBF8F1" }}>
                <div>
                    <Link href={`/${tenant}/manager`} className="flex items-center">
                        <span className="font-['Archivo_Black',sans-serif] text-[15px] text-[#575757]">Pedidos</span>
                        <span className="font-['Archivo_Black',sans-serif] text-[15px] text-[#0F1210]">Posta</span>
                        <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-[#43926A]" />
                    </Link>
                    <p className="text-[9px] uppercase font-bold text-[#575757] tracking-widest">{tenantData?.name || tenant}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/${tenant}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-[#43926A] px-3 font-['Archivo_Black',sans-serif] text-[10px] uppercase tracking-[.06em] text-white shadow-[0_6px_18px_-8px_rgba(67,146,106,.6)]"
                    >
                        <ExternalLink size={12} />
                        Tienda
                    </Link>
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0F1210] text-[#F6F2EA]"
                    >
                        <Menu size={18} />
                    </button>
                </div>
            </div>

            {/* ═══ MOBILE DRAWER ═══ */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-[260px] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300" style={{ background: "#FBF8F1" }}>
                        <div className="flex items-center justify-between border-b border-[rgba(15,18,16,.1)] p-5">
                            <div>
                                <h3 className="font-['Archivo_Black',sans-serif] text-base">Navegación</h3>
                                <p className="text-[10px] font-mono text-[#575757] mt-0.5">{tenant}.pedidoposta</p>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(15,18,16,.06)] text-[#575757] hover:text-[#0F1210]"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <nav className="flex-1 space-y-0.5 px-[18px] py-5 overflow-y-auto">
                            {renderNavLinks(() => setMobileMenuOpen(false))}
                        </nav>
                        <div className="border-t border-[rgba(15,18,16,.1)] p-[18px]">
                            {renderLogoutButton()}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ MAIN CONTENT ═══ */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-20 md:p-8 md:pt-8 relative" style={{ background: "#F6F2EA" }}>

                {/* ── Subscription Banners ── */}
                {isExpired && (
                    <div className="mb-6 rounded-2xl border border-[#E25A2B]/30 bg-[#E25A2B]/8 px-5 py-4 flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E25A2B]/15">
                            <AlertTriangle size={20} className="text-[#E25A2B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#B9431C]">Tu tienda está pausada</p>
                            <p className="text-xs text-[#B9431C]/70 mt-0.5">
                                {isTrialing
                                    ? "Tu periodo de prueba gratuita ha finalizado. Suscribite para reactivar tu tienda."
                                    : "Tu suscripción está vencida. Renová tu plan para que tus clientes puedan seguir comprando."}
                            </p>
                        </div>
                        <Link
                            href={`/${tenant}/manager/subscription`}
                            className="shrink-0 rounded-xl bg-[#E25A2B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#B9431C] transition-colors"
                        >
                            Ver planes
                        </Link>
                    </div>
                )}

                {isTrialing && !isExpired && trialDaysLeft <= 3 && (
                    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-5 py-4 flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                            <AlertTriangle size={20} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-amber-700">
                                Te {trialDaysLeft === 1 ? "queda 1 día" : `quedan ${trialDaysLeft} días`} de prueba gratuita
                            </p>
                            <p className="text-xs text-amber-600/80 mt-0.5">
                                Suscribite antes de que termine para que tu tienda siga activa.
                            </p>
                        </div>
                        <Link
                            href={`/${tenant}/manager/subscription`}
                            className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
                        >
                            Suscribirme
                        </Link>
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}
