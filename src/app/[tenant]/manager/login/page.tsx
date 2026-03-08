"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";

const loginSchema = z.object({
    email: z.string().email("Ingresá un email válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function ManagerLoginPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = React.use(params);
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            toast.error("Error al iniciar sesión", { description: "Revisá tu email o contraseña e intentá nuevamente." });
            setLoading(false);
        } else {
            toast.success("¡Bienvenido de vuelta!");
            // Redirect to dashboard
            router.push(`/${tenant}/manager`);
            router.refresh();
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />
            <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">

                {/* Glow effect */}
                <div className="pointer-events-none absolute -top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-[80px]" />

                <div className="relative z-10 mb-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 text-primary shadow-inner ring-1 ring-zinc-700/50">
                        <Lock className="h-7 w-7" />
                    </div>
                    <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white">Manager Portal</h1>
                    <p className="mt-2 text-sm text-zinc-400">Acceso exclusivo para dueños</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="tunombre@restaurante.com"
                                className={`w-full rounded-xl border bg-zinc-950/80 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:ring-2 focus:ring-primary ${errors.email ? "border-red-500/50" : "border-zinc-800 focus:border-primary/50"}`}
                            />
                        </div>
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                            <input
                                {...register("password")}
                                type="password"
                                placeholder="••••••••"
                                className={`w-full rounded-xl border bg-zinc-950/80 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:ring-2 focus:ring-primary ${errors.password ? "border-red-500/50" : "border-zinc-800 focus:border-primary/50"}`}
                            />
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-[0_0_20px_var(--brand-color)] shadow-primary/30 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin invert" /> : "INGRESAR AL PANEL"}
                    </button>
                </form>
            </div>
        </main>
    );
}
