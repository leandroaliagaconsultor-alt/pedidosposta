"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function ResetPasswordPage() {
    const router = useRouter();
    const supabase = createClient();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);

    // Supabase redirects here with tokens in the URL hash — the client picks them up automatically
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
            if (event === "PASSWORD_RECOVERY") {
                setSessionReady(true);
            }
        });

        // Also check if already in recovery session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
            if (session) setSessionReady(true);
        });

        return () => { subscription.unsubscribe(); };
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            toast.error("No pudimos actualizar tu contraseña. El link puede haber expirado.");
        } else {
            setSuccess(true);
            toast.success("¡Contraseña actualizada!");
            setTimeout(() => router.push("/login"), 3000);
        }
        setLoading(false);
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden" style={{ background: "#F6F2EA" }}>
            <Toaster position="top-center" />

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, #D7E9DE, transparent 70%)" }} />
            </div>

            <div className="w-full max-w-sm relative z-10">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center">
                        <span className="font-['Archivo_Black',sans-serif] text-[28px] text-[#575757]">Pedidos</span>
                        <span className="font-['Archivo_Black',sans-serif] text-[28px] text-[#0F1210]">Posta</span>
                        <span className="inline-block w-3 h-3 rounded-full bg-[#43926A] ml-[2px]" />
                    </Link>
                </div>

                <div className="bg-white rounded-3xl border border-[rgba(15,18,16,.12)] p-8 shadow-[0_30px_60px_-20px_rgba(0,0,0,.08)]">
                    {success ? (
                        <div className="text-center py-6">
                            <CheckCircle2 size={48} className="mx-auto mb-4 text-[#43926A]" />
                            <h1 className="font-['Archivo_Black',sans-serif] text-2xl text-[#0F1210] mb-2">Contraseña actualizada</h1>
                            <p className="text-sm text-[#575757]">Redirigiendo al login...</p>
                        </div>
                    ) : !sessionReady ? (
                        <div className="text-center py-6">
                            <Loader2 size={32} className="mx-auto mb-4 animate-spin text-[#43926A]" />
                            <p className="text-sm text-[#575757]">Verificando link de recuperación...</p>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-7">
                                <h1 className="font-['Archivo_Black',sans-serif] text-2xl text-[#0F1210]">Nueva contraseña</h1>
                                <p className="mt-2 text-sm text-[#575757]">Elegí tu nueva contraseña para acceder al panel.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.1em] text-[#575757]">Nueva contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-[#575757]" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#F6F2EA] py-3 pl-10 pr-4 text-sm text-[#0F1210] placeholder-[#a8a49a] outline-none transition focus:ring-2 focus:ring-[#43926A] focus:border-[#43926A]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.1em] text-[#575757]">Confirmar contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-[#575757]" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repetí tu nueva contraseña"
                                            className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#F6F2EA] py-3 pl-10 pr-4 text-sm text-[#0F1210] placeholder-[#a8a49a] outline-none transition focus:ring-2 focus:ring-[#43926A] focus:border-[#43926A]"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#43926A] py-3.5 font-bold text-white text-sm tracking-[.02em] shadow-[0_1px_0_rgba(0,0,0,.08),0_8px_22px_-10px_rgba(67,146,106,.7)] transition-all hover:translate-y-[-1px] active:scale-[.98] disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "GUARDAR NUEVA CONTRASEÑA"}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-xs text-[#575757] hover:text-[#0F1210] transition-colors">
                        ← Volver al login
                    </Link>
                </div>
            </div>
        </main>
    );
}
