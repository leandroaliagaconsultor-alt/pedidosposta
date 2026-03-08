"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ListOrdered, Palette, LayoutDashboard, LogOut, Loader2, Settings, BarChart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";

export default function ManagerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tenant: string }>;
}) {
    const { tenant } = React.use(params);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    // Exclude login page from rendering the sidebar
    if (pathname.endsWith("/login")) {
        return <>{children}</>;
    }

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

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            {/* Sidebar */}
            <aside className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
                <div className="p-6">
                    <h2 className="text-xl font-extrabold tracking-tight text-white">
                        Manager <span className="text-primary">Portal</span>
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500 font-mono">{tenant}.pedidoposta</p>
                </div>

                <nav className="flex-1 space-y-2 px-4 py-4">
                    {navLinks.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${isActive
                                    ? "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-inner"
                                    : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                                    }`}
                            >
                                <Icon size={18} className={isActive ? "text-primary" : "text-zinc-500"} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-zinc-800 p-4">
                    <button
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 text-sm font-semibold text-zinc-400 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    >
                        {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto bg-zinc-950/50 p-8 shadow-inner relative">
                {/* Glow accent */}
                <div className="pointer-events-none absolute -top-40 -right-40 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
                {children}
            </main>
        </div>
    );
}
