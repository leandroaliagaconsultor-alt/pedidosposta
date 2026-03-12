"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";
import { ShieldAlert, Loader2, Lock } from "lucide-react";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error("Credenciales inválidas.");
            setLoading(false);
            return;
        }

        if (data.user?.email === "leandro@pedidosposta.com") {
            toast.success("Welcome, God.");
            router.push("/admin-posta");
        } else {
            toast.error("Acceso Denegado. No eres el SuperAdmin.");
            await supabase.auth.signOut();
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-[#FAFAFA] font-sans selection:bg-primary/30 p-4 relative overflow-hidden">
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="mb-8 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-6">
                        <ShieldAlert className="h-8 w-8 text-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter drop-shadow-md">
                        Acceso <span className="text-primary">Restringido</span>
                    </h1>
                    <p className="text-sm font-medium tracking-wide text-zinc-500 mt-2 uppercase">
                        Portal God Mode
                    </p>
                </div>

                <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">
                                Email Autorizado
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3.5 text-sm outline-none transition-all placeholder:text-zinc-700 focus:border-primary focus:ring-1 focus:ring-primary/50 text-white"
                                placeholder="god@pedidosposta.com"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3.5 text-sm outline-none transition-all placeholder:text-zinc-700 focus:border-primary focus:ring-1 focus:ring-primary/50 text-white font-mono tracking-widest"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-sm font-black uppercase tracking-widest text-[#09090b] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.3)] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative flex items-center gap-2">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" />
                                        Desbloquear Panel
                                    </>
                                )}
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
