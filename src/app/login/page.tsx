"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Lock, Mail, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";

const loginSchema = z.object({
    email: z.string().email("Ingresá un email válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
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

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (authError || !authData.user) {
            toast.error("Error al iniciar sesión", {
                description: "Revisá tu email o contraseña e intentá nuevamente.",
            });
            setLoading(false);
            return;
        }

        // Buscar el tenant del usuario
        const { data: tenantData, error: tenantError } = await supabase
            .from("tenant_users")
            .select("tenants(slug)")
            .eq("user_id", authData.user.id)
            .single();

        if (tenantError || !tenantData?.tenants) {
            toast.error("Sin acceso a ningún local", {
                description: "Tu cuenta no tiene un local asignado. ¿Querés crear uno?",
            });
            await supabase.auth.signOut();
            setLoading(false);
            return;
        }

        const tenantRel = tenantData.tenants as unknown as { slug: string } | { slug: string }[];
        const slug = Array.isArray(tenantRel) ? tenantRel[0]?.slug : tenantRel.slug;

        if (!slug) {
            toast.error("Error al buscar tu local");
            await supabase.auth.signOut();
            setLoading(false);
            return;
        }

        toast.success("¡Bienvenido de vuelta!");
        router.push(`/${slug}/manager`);
        router.refresh();
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <Toaster
                position="top-center"
                toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }}
            />
            <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
                {/* Glow */}
                <div className="pointer-events-none absolute -top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-[80px]" />

                <div className="relative z-10 mb-8 text-center">
                    <Link href="/" className="inline-block mb-6">
                        <Image
                            src="/logo.png"
                            alt="PedidosPosta"
                            width={180}
                            height={40}
                            className="h-10 w-auto object-contain mx-auto"
                            priority
                        />
                    </Link>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white">Iniciar sesión</h1>
                    <p className="mt-2 text-sm text-zinc-400">Ingresá a tu panel de administración</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="tu@email.com"
                                className={`w-full rounded-xl border bg-zinc-950/80 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:ring-2 focus:ring-primary ${
                                    errors.email ? "border-red-500/50" : "border-zinc-800 focus:border-primary/50"
                                }`}
                            />
                        </div>
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Contraseña
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                            <input
                                {...register("password")}
                                type="password"
                                placeholder="••••••••"
                                className={`w-full rounded-xl border bg-zinc-950/80 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:ring-2 focus:ring-primary ${
                                    errors.password ? "border-red-500/50" : "border-zinc-800 focus:border-primary/50"
                                }`}
                            />
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-primary/30 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar sesión"}
                    </button>
                </form>

                <div className="relative z-10 mt-6 text-center">
                    <p className="text-sm text-zinc-500">
                        ¿No tenés cuenta?{" "}
                        <Link href="/register" className="text-primary font-medium hover:underline">
                            Crear mi tienda gratis
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
