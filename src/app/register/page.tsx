"use client";

import React, { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { registerTenant, type RegisterState } from "./actions";
import { slugify } from "@/utils/slugify";
import { Store, Mail, Lock, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

// ── Submit Button con estado de pending ──────────────────────────────────────
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="group relative mt-6 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-primary py-4 font-bold tracking-wide text-primary-foreground shadow-[0_0_30px_var(--brand-color)] shadow-primary/30 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
            {pending ? (
                <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creando tu local...</span>
                </>
            ) : (
                <>
                    <span>CREAR MI LOCAL GRATIS</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
            )}
        </button>
    );
}

// ── Página principal ─────────────────────────────────────────────────────────
const initialState: RegisterState = {};

export default function RegisterPage() {
    const [state, formAction] = useActionState(registerTenant, initialState);
    const [localName, setLocalName] = useState("");
    const [, startTransition] = useTransition();

    const slug = slugify(localName);

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 text-primary shadow-inner ring-1 ring-zinc-700/50">
                        <Store className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Abrí tu local en <span className="text-primary">minutos</span>
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Creá tu menú digital y empezá a recibir pedidos hoy.
                    </p>
                </div>

                {/* Card */}
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-md">
                    {/* Glow */}
                    <div className="pointer-events-none absolute -top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />

                    {/* Error global */}
                    {state.error && (
                        <div className="relative mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            ⚠ {state.error}
                        </div>
                    )}

                    <form
                        action={formAction}
                        className="relative z-10 space-y-5"
                    >
                        {/* Campo: Nombre del Local */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Nombre del Local
                            </label>
                            <div className="relative">
                                <Store className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="Ej: Búfalo Grill"
                                    autoComplete="organization"
                                    value={localName}
                                    onChange={(e) => {
                                        startTransition(() => setLocalName(e.target.value));
                                    }}
                                    className={`w-full rounded-xl border bg-zinc-950/80 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:ring-2 focus:ring-primary ${state.fieldError?.name ? "border-red-500/50" : "border-zinc-800 focus:border-primary/50"}`}
                                />
                            </div>
                            {state.fieldError?.name && (
                                <p className="mt-1.5 text-xs text-red-400">{state.fieldError.name}</p>
                            )}

                            {/* Preview del link en tiempo real */}
                            <div className={`mt-2.5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all ${slug ? "border border-primary/20 bg-primary/5 text-primary" : "border border-zinc-800 bg-zinc-900/50 text-zinc-600"}`}>
                                {slug ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                                ) : (
                                    <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-zinc-700" />
                                )}
                                <span className="font-mono">
                                    pedidosposta.com/
                                    <span className={slug ? "font-bold" : "text-zinc-600"}>
                                        {slug || "tu-local"}
                                    </span>
                                </span>
                            </div>
                        </div>

                        {/* Campo: Email */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Email del Dueño
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="vos@tulocal.com"
                                    autoComplete="email"
                                    className={`w-full rounded-xl border bg-zinc-950/80 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:ring-2 focus:ring-primary ${state.fieldError?.email ? "border-red-500/50" : "border-zinc-800 focus:border-primary/50"}`}
                                />
                            </div>
                            {state.fieldError?.email && (
                                <p className="mt-1.5 text-xs text-red-400">{state.fieldError.email}</p>
                            )}
                        </div>

                        {/* Campo: Contraseña */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    autoComplete="new-password"
                                    className={`w-full rounded-xl border bg-zinc-950/80 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:ring-2 focus:ring-primary ${state.fieldError?.password ? "border-red-500/50" : "border-zinc-800 focus:border-primary/50"}`}
                                />
                            </div>
                            {state.fieldError?.password && (
                                <p className="mt-1.5 text-xs text-red-400">{state.fieldError.password}</p>
                            )}
                        </div>

                        <SubmitButton />
                    </form>

                    {/* Footer link */}
                    <p className="relative z-10 mt-6 text-center text-xs text-zinc-600">
                        ¿Ya tenés cuenta?{" "}
                        <a
                            href="/angus/manager/login"
                            className="font-semibold text-zinc-400 underline-offset-2 hover:text-primary hover:underline transition-colors"
                        >
                            Iniciá sesión
                        </a>
                    </p>
                </div>

                {/* Trust badges */}
                <div className="mt-6 flex items-center justify-center gap-6 text-xs text-zinc-700">
                    <span>✓ Gratis para siempre</span>
                    <span>✓ Sin tarjeta de crédito</span>
                    <span>✓ Listo en 2 minutos</span>
                </div>
            </div>
        </main>
    );
}
