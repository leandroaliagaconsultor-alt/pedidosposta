"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // En el futuro aquí podemos enviar el log a Sentry
        console.error("Global Error Boundary caught:", error);
    }, [error]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-12 text-center text-zinc-100">
            {/* Branding Logo fallback */}
            <div className="mb-8 flex items-center gap-1 text-4xl font-black tracking-tight drop-shadow-lg">
                <span className="text-white">Pedidos</span>
                <span className="text-primary italic">Posta</span>
            </div>

            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500 ring-1 ring-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <AlertTriangle size={36} />
            </div>

            <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                ¡Uy! Algo salió mal en la cocina.
            </h1>

            <p className="mb-10 max-w-md text-sm font-medium text-zinc-400 leading-relaxed drop-shadow-sm">
                Tuvimos un inconveniente inesperado al procesar tu solicitud.
                Por favor, intentá nuevamente en unos instantes.
            </p>

            <button
                onClick={() => reset()}
                className="group mb-12 flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-black uppercase tracking-widest text-[#09090b] shadow-[0_5px_25px_var(--brand-color)] shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            >
                <RefreshCcw size={18} className="transition-transform group-hover:-rotate-180" />
                Volver a intentar
            </button>

            {/* Terminal style error block */}
            <div className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm text-left shadow-xl">
                <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/80 px-4 py-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
                        Error Debug Info
                    </span>
                </div>
                <div className="p-4 overflow-x-auto">
                    <p className="font-mono text-xs text-red-400 break-all leading-relaxed drop-shadow-sm">
                        {error.message || "Error desconocido en la aplicación."}
                    </p>
                    {error.digest && (
                        <p className="mt-2 font-mono text-[10px] text-zinc-500">
                            Digest: {error.digest}
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
