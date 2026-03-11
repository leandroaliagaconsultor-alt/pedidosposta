"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ListOrdered, Palette, LayoutDashboard, LogOut,
    Loader2, Settings, BarChart, Menu, X, ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";

export default function ManagerShell({
    children,
    tenant,
}: {
    children: React.ReactNode;
    tenant: string;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [tenantData, setTenantData] = useState<{ name: string; logo_url: string | null } | null>(null);

    useEffect(() => {
        supabase.from("tenants").select("name, logo_url").eq("slug", tenant).single()
            .then(({ data }) => { if (data) setTenantData(data); });
    }, [supabase, tenant]);

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        await supabase.auth.signOut();
        toast.success("Sesión cerrada correctamente");
        router.push(`/${tenant}/manager/login`);
        router.refresh();
    };

    const navLinks = [
        { name: "Live Orders", href: `/${tenant}/manager`, icon: ListOrdered },
        { name: "Menu Builder", href: `/${tenant}/manager/menu`, icon: LayoutDashboard },
        { name: "Brand Studio", href: `/${tenant}/manager/brand`, icon: Palette },
        { name: "Configuración", href: `/${tenant}/manager/settings`, icon: Settings },
        { name: "Analytics", href: `/${tenant}/manager/analytics`, icon: BarChart },
    ];

    // Shared nav items renderer
    const renderNavLinks = (onClickExtra?: () => void) =>
        navLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClickExtra}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${isActive
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-inner"
                        : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                        }`}
                >
                    <Icon size={18} className={isActive ? "text-primary" : "text-zinc-500"} />
                    {item.name}
                </Link>
            );
        });

    const renderLogoutButton = () => (
        <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 text-sm font-semibold text-zinc-400 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
        >
            {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            Cerrar Sesión
        </button>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            {/* ═══════════════════════════════════════════════════════════
                DESKTOP SIDEBAR — Unchanged, hidden on mobile
               ═══════════════════════════════════════════════════════════ */}
            <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
                <div className="p-6">
                    <Link href={`/${tenant}/manager`} className="flex items-center">
                        <img
                            src="/logo-pedidoposta.png"
                            alt="PedidosPosta"
                            className="h-10 w-auto object-contain cursor-pointer"
                        />
                    </Link>
                    <div className="mt-3 flex flex-col">
                        <span className="text-xs font-bold text-white leading-tight">{tenantData?.name || tenant}</span>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mt-0.5">Panel Administrador</span>
                    </div>

                    <Link
                        href={`/${tenant}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[11px] font-black tracking-widest text-[#09090b] shadow-[0_4px_15px_var(--brand-color)] shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        {tenantData?.logo_url ? (
                            <img src={tenantData.logo_url} alt="Store" className="h-4 w-4 rounded-md object-cover" />
                        ) : (
                            <ExternalLink size={16} />
                        )}
                        VER MI TIENDA
                    </Link>
                </div>

                <nav className="flex-1 space-y-2 px-4 py-4">
                    {renderNavLinks()}
                </nav>

                <div className="border-t border-zinc-800 p-4 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-zinc-900/60 px-3 py-2.5">
                        <div className="h-8 w-8 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
                            {tenantData?.logo_url ? (
                                <img src={tenantData.logo_url} alt={tenantData.name} className="h-full w-full object-cover" />
                            ) : (
                                <span className="font-black text-primary text-sm">
                                    {(tenantData?.name || tenant).charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-200 truncate">{tenantData?.name || tenant}</p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">/{tenant}</p>
                        </div>
                    </div>
                    {renderLogoutButton()}
                </div>
            </aside>

            {/* ═══════════════════════════════════════════════════════════
                MOBILE HEADER + DRAWER — Only visible on mobile
               ═══════════════════════════════════════════════════════════ */}

            {/* Mobile Header Bar (fixed at top) */}
            <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-lg px-4 py-3 md:hidden">
                <div>
                    <Link href={`/${tenant}/manager`} className="flex items-center">
                        <img
                            src="/logo-pedidoposta.png"
                            alt="PedidosPosta"
                            className="h-8 w-auto object-contain cursor-pointer"
                        />
                    </Link>
                    <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">{tenantData?.name || tenant}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/${tenant}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-[10px] font-black tracking-widest text-[#09090b] shadow-[0_4px_15px_var(--brand-color)] shadow-primary/20 transition-all active:scale-95"
                    >
                        {tenantData?.logo_url ? (
                            <img src={tenantData.logo_url} alt="Store" className="h-3.5 w-3.5 rounded-md object-cover" />
                        ) : (
                            <ExternalLink size={14} />
                        )}
                        TIENDA
                    </Link>
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white active:scale-95"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </div>

            {/* Mobile Drawer Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Drawer Panel (slides in from right) */}
                    <div className="absolute right-0 top-0 bottom-0 w-72 bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between border-b border-zinc-800 p-5">
                            <div>
                                <h3 className="text-lg font-bold text-white">Navegación</h3>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{tenant}.pedidoposta</p>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white active:scale-95"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Nav Links */}
                        <nav className="flex-1 space-y-2 px-4 py-5 overflow-y-auto">
                            {renderNavLinks(() => setMobileMenuOpen(false))}
                        </nav>

                        {/* Logout */}
                        <div className="border-t border-zinc-800 p-4">
                            {renderLogoutButton()}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                MAIN CONTENT — responsive padding
               ═══════════════════════════════════════════════════════════ */}
            <main className="flex-1 overflow-y-auto bg-zinc-950/50 p-4 pt-20 md:p-8 md:pt-8 shadow-inner relative">
                {/* Glow accent */}
                <div className="pointer-events-none absolute -top-40 -right-40 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
                {children}
            </main>
        </div>
    );
}
