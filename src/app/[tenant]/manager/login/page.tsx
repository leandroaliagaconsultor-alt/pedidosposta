"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, Loader2, ArrowLeft } from "lucide-react";
import { toast, Toaster } from "sonner";

const loginSchema = z.object({
    email: z.string().email("Ingresá un email válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function ManagerLoginPage({ params: _params }: { params: Promise<{ tenant: string }> }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (authError || !authData.user) {
            toast.error("Error al iniciar sesión", { description: "Revisá tu email o contraseña e intentá nuevamente." });
            setLoading(false);
            return;
        }

        const { data: tenantData, error: tenantError } = await supabase
            .from("tenant_users")
            .select("tenants(slug)")
            .eq("user_id", authData.user.id)
            .single();

        if (tenantError || !tenantData?.tenants) {
            toast.error("Sin acceso a ningún local", {
                description: "Tu cuenta no tiene un local asignado. Contactá al administrador.",
            });
            await supabase.auth.signOut();
            setLoading(false);
            return;
        }

        const tenantRel = tenantData.tenants as unknown as { slug: string } | { slug: string }[];
        const slug = Array.isArray(tenantRel) ? tenantRel[0]?.slug : tenantRel.slug;

        if (!slug) {
            toast.error("Sin acceso a ningún local", {
                description: "Tu cuenta no tiene un local asignado. Contactá al administrador.",
            });
            await supabase.auth.signOut();
            setLoading(false);
            return;
        }

        toast.success("¡Bienvenido de vuelta!");
        router.push(`/${slug}/manager`);
        router.refresh();
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, var(--teal-soft), transparent 70%)" }} />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, var(--teal-soft), transparent 70%)" }} />
            </div>

            <Toaster
                position="top-center"
                toastOptions={{ style: { background: "var(--cream)", border: "1px solid var(--line)", color: "var(--ink)" } }}
            />

            <div className="w-full max-w-sm relative z-10">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center">
                        <span className="text-[28px] tracking-tight text-[var(--plomo)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Pedidos</span>
                        <span className="text-[28px] tracking-tight text-[var(--ink)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Posta</span>
                        <span className="inline-block w-3 h-3 rounded-full bg-[var(--teal)] ml-[2px]" />
                    </Link>
                </div>

                <div className="bg-white rounded-3xl border border-[var(--line)] p-8 shadow-[0_30px_60px_-20px_rgba(0,0,0,.08)]">
                    {!showForgot ? (
                        <>
                            <div className="text-center mb-7">
                                <h1 className="text-2xl tracking-[-0.02em] text-[var(--ink)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Manager Portal</h1>
                                <p className="mt-2 text-sm text-[var(--plomo)]">Acceso exclusivo para dueños</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.1em] text-[var(--plomo)]">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-[var(--plomo)]" />
                                        <input
                                            {...register("email")}
                                            type="email"
                                            placeholder="tunombre@restaurante.com"
                                            className={`w-full rounded-xl border bg-[var(--cream)] py-3 pl-10 pr-4 text-sm text-[var(--ink)] placeholder-[#a8a49a] outline-none transition focus:ring-2 focus:ring-[var(--teal)] ${errors.email ? "border-[var(--clay)]" : "border-[var(--line-strong)] focus:border-[var(--teal)]"}`}
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1 text-xs text-[var(--clay)]">{errors.email.message}</p>}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-[10px] font-bold uppercase tracking-[.1em] text-[var(--plomo)]">Contraseña</label>
                                        <button type="button" onClick={() => setShowForgot(true)} className="text-[11px] font-semibold text-[var(--teal)] hover:text-[var(--teal-deep)] transition-colors">
                                            Olvidé mi contraseña
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-[var(--plomo)]" />
                                        <input
                                            {...register("password")}
                                            type="password"
                                            placeholder="••••••••"
                                            className={`w-full rounded-xl border bg-[var(--cream)] py-3 pl-10 pr-4 text-sm text-[var(--ink)] placeholder-[#a8a49a] outline-none transition focus:ring-2 focus:ring-[var(--teal)] ${errors.password ? "border-[var(--clay)]" : "border-[var(--line-strong)] focus:border-[var(--teal)]"}`}
                                        />
                                    </div>
                                    {errors.password && <p className="mt-1 text-xs text-[var(--clay)]">{errors.password.message}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--teal)] py-3.5 font-bold text-white text-sm tracking-[.02em] shadow-[0_1px_0_rgba(0,0,0,.08),0_8px_22px_-10px_rgba(67,146,106,.7)] transition-all hover:translate-y-[-1px] hover:shadow-[0_2px_0_rgba(0,0,0,.08),0_12px_26px_-10px_rgba(67,146,106,.8)] active:scale-[.98] disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "INGRESAR AL PANEL"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setShowForgot(false)} className="flex items-center gap-1.5 text-sm text-[var(--plomo)] hover:text-[var(--ink)] transition-colors mb-5">
                                <ArrowLeft size={14} /> Volver al login
                            </button>

                            <div className="text-center mb-6">
                                <h1 className="text-2xl tracking-[-0.02em] text-[var(--ink)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Recuperar contraseña</h1>
                                <p className="mt-2 text-sm text-[var(--plomo)]">Ingresá tu email y te enviamos un link para crear una nueva.</p>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const email = forgotEmail.trim().toLowerCase();
                                if (!email) { toast.error("Ingresá tu email"); return; }
                                setForgotLoading(true);

                                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                    redirectTo: `${window.location.origin}/reset-password`,
                                });

                                if (error) {
                                    toast.error("No pudimos enviar el email. Verificá que sea correcto.");
                                } else {
                                    toast.success("Si el email está registrado, te enviamos un link para restablecer tu contraseña. Revisá tu bandeja de entrada y spam.", { duration: 8000 });
                                    setShowForgot(false);
                                    setForgotEmail("");
                                }
                                setForgotLoading(false);
                            }} className="space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.1em] text-[var(--plomo)]">Email de tu cuenta</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-[var(--plomo)]" />
                                        <input
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="tunombre@restaurante.com"
                                            className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--cream)] py-3 pl-10 pr-4 text-sm text-[var(--ink)] placeholder-[#a8a49a] outline-none transition focus:ring-2 focus:ring-[var(--teal)] focus:border-[var(--teal)]"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--teal)] py-3.5 font-bold text-white text-sm tracking-[.02em] shadow-[0_1px_0_rgba(0,0,0,.08),0_8px_22px_-10px_rgba(67,146,106,.7)] transition-all hover:translate-y-[-1px] active:scale-[.98] disabled:opacity-50"
                                >
                                    {forgotLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENVIAR LINK DE RECUPERACIÓN"}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-xs text-[var(--plomo)] hover:text-[var(--ink)] transition-colors">
                        ← Volver al sitio
                    </Link>
                </div>
            </div>
        </main>
    );
}
