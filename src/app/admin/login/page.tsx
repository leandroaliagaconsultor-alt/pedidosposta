"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Loader2, Lock, Mail, KeyRound, AlertTriangle } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [checkingSession, setCheckingSession] = useState(true);

    // If already logged in, redirect to /admin
    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.replace("/admin");
            } else {
                setCheckingSession(false);
            }
        };
        checkSession();
    }, [supabase, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(
                authError.message === "Invalid login credentials"
                    ? "Credenciales inválidas. Verificá tu email y contraseña."
                    : authError.message
            );
            setLoading(false);
            return;
        }

        router.push("/admin");
        router.refresh();
    };

    if (checkingSession) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505]">
                <Loader2 className="h-8 w-8 animate-spin text-red-500/50" />
            </div>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 relative overflow-hidden">
            {/* Background grid */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.06),transparent_60%)]" />
            </div>

            <div className="w-full max-w-sm">
                {/* Header */}
                <div className="mb-10 flex flex-col items-center text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
                        <Shield className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        Acceso <span className="text-red-500">Restringido</span>
                    </h1>
                    <p className="mt-2 text-xs text-zinc-500 font-mono uppercase tracking-widest">
                        Super Admin — PedidoPosta SaaS
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                            <AlertTriangle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
                            Email
                        </label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="admin@pedidoposta.com"
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3.5 pl-11 pr-4 text-sm text-zinc-100 outline-none transition focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
                            Contraseña
                        </label>
                        <div className="relative">
                            <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3.5 pl-11 pr-4 text-sm text-zinc-100 outline-none transition focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 placeholder:text-zinc-700"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3.5 text-sm font-extrabold tracking-wider text-white shadow-[0_0_30px_rgba(239,68,68,0.25)] transition-all hover:bg-red-600 hover:shadow-[0_0_40px_rgba(239,68,68,0.35)] active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Lock size={16} />
                        )}
                        {loading ? "Verificando..." : "Acceder"}
                    </button>
                </form>

                <p className="mt-8 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-700">
                    Este acceso es exclusivo del administrador del SaaS
                </p>
            </div>
        </main>
    );
}
