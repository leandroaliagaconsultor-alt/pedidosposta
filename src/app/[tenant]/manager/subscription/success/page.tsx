"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function SubscriptionSuccessPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const { tenant } = use(params);
    const supabase = createClient();
    const [status, setStatus] = useState<"loading" | "active" | "pending">("loading");

    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 10;

        const checkStatus = async () => {
            const { data } = await supabase
                .from("tenants")
                .select("subscription_status")
                .eq("slug", tenant)
                .single();

            if (data?.subscription_status === "active") {
                setStatus("active");
                return;
            }

            attempts++;
            if (attempts >= maxAttempts) {
                setStatus("pending");
                return;
            }

            // Reintentar en 3 segundos (webhook puede demorar)
            setTimeout(checkStatus, 3000);
        };

        checkStatus();
    }, [supabase, tenant]);

    return (
        <div className="flex min-h-[70vh] items-center justify-center">
            <div className="max-w-md w-full text-center space-y-6 px-4">
                {status === "loading" ? (
                    <>
                        <div className="flex justify-center">
                            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-primary/10">
                                <Loader2 size={36} className="text-primary animate-spin" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Procesando tu suscripción...</h1>
                            <p className="text-sm text-zinc-500 mt-2">
                                Estamos confirmando tu pago con MercadoPago. Esto puede tardar unos segundos.
                            </p>
                        </div>
                    </>
                ) : status === "active" ? (
                    <>
                        <div className="flex justify-center">
                            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-primary/10">
                                <CheckCircle2 size={36} className="text-primary" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">¡Suscripción activada!</h1>
                            <p className="text-sm text-zinc-500 mt-2">
                                Tu plan Full Commerce está activo. Tu tienda ya está online y lista para recibir pedidos.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 pt-2">
                            <Link
                                href={`/${tenant}/manager`}
                                className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-zinc-950 hover:bg-primary/90 transition-colors"
                            >
                                <Sparkles size={16} />
                                Ir a mi panel
                                <ArrowRight size={14} />
                            </Link>
                            <Link
                                href={`/${tenant}/manager/subscription`}
                                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                Ver detalles de mi suscripción
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-center">
                            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-amber-500/10">
                                <Loader2 size={36} className="text-amber-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Pago en proceso</h1>
                            <p className="text-sm text-zinc-500 mt-2">
                                Tu pago está siendo procesado por MercadoPago. Esto puede demorar unos minutos.
                                Te notificaremos cuando esté confirmado.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 pt-2">
                            <Link
                                href={`/${tenant}/manager/subscription`}
                                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
                            >
                                Volver a Suscripción
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
