"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, ArrowRight, X } from "lucide-react";

const ACTIVE_STATUSES = ["pending", "preparing", "on_the_way"];

export default function ActiveOrderBanner({ tenant }: { tenant: string }) {
    const supabase = createClient();
    const [orderId, setOrderId] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const key = `active_order_${tenant}`;
        const stored = localStorage.getItem(key);
        if (!stored) return;

        // Check order status
        supabase
            .from("orders")
            .select("id, status")
            .eq("id", stored)
            .single()
            .then(({ data }) => {
                if (!data) {
                    localStorage.removeItem(key);
                    return;
                }
                if (ACTIVE_STATUSES.includes(data.status)) {
                    setOrderId(data.id);
                    setVisible(true);
                } else {
                    // delivered or cancelled — clean up
                    localStorage.removeItem(key);
                }
            });
    }, [supabase, tenant]);

    if (!visible || dismissed || !orderId) return null;

    return (
        <div className="fixed bottom-4 inset-x-4 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto sm:max-w-sm animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-zinc-950/95 backdrop-blur-xl px-4 py-3.5 shadow-[0_0_30px_var(--brand-color)] shadow-primary/20 ring-1 ring-primary/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <ShoppingBag size={20} className="text-primary animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">Tenés un pedido en curso</p>
                    <p className="text-[11px] text-zinc-400">Seguí el estado de tu pedido en tiempo real.</p>
                </div>
                <Link
                    href={`/${tenant}/order/${orderId}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-95"
                >
                    Ver <ArrowRight size={14} />
                </Link>
                <button
                    onClick={() => setDismissed(true)}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
