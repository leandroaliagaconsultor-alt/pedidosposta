"use client";

import React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import type { ThemeTokens } from "@/lib/utils/theme";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

interface CartDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isStoreOpen?: boolean;
    tokens: ThemeTokens;
    accentColor: string;
    accentTextColor: string;
}

export function CartDrawer({ open, onOpenChange, isStoreOpen = true, tokens: t, accentColor, accentTextColor }: CartDrawerProps) {
    const router = useRouter();
    const params = useParams() as { tenant: string };
    const tenantSlug = params.tenant;

    const { items, updateQuantity, removeItem } = useCartStore();

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const handleCheckoutRedirect = () => {
        onOpenChange(false);
        setTimeout(() => {
            router.push(`/${tenantSlug}/checkout`);
        }, 300);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className={`flex w-full flex-col p-0 sm:max-w-md shadow-2xl overflow-hidden ${t.bg} ${t.surfaceBorder}`}>
                {/* ── Header ── */}
                <SheetHeader className={`border-b p-5 backdrop-blur-md relative z-10 shrink-0 ${t.navBorder} ${t.navBg}`}>
                    <SheetTitle className={`flex items-center gap-2 text-xl tracking-tight ${t.text}`}>
                        <ShoppingBag className="h-5 w-5" style={{ color: accentColor }} />
                        Tu Orden
                    </SheetTitle>
                </SheetHeader>

                {/* ── Cart Items ── */}
                <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                    {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                            <div className={`rounded-full p-6 border ${t.surface} ${t.surfaceBorder}`}>
                                <ShoppingBag className={`h-10 w-10 ${t.textMuted}`} />
                            </div>
                            <p className={`font-medium ${t.textMuted}`}>Bolsa vacía. ¡Sumá algo rico!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 group">
                                    <div className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border shadow-sm ${t.surface} ${t.surfaceBorder}`}>
                                        {item.imageUrl ? (
                                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover transition-transform group-hover:scale-105" />
                                        ) : (
                                            <div className={`flex h-full w-full items-center justify-center ${t.textMuted}`}>
                                                <ShoppingBag size={24} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-1 flex-col justify-between py-0.5">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className={`font-bold leading-tight ${t.text}`}>{item.name}</h4>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className={`hover:text-red-500 transition-colors shrink-0 p-1 -mr-1 ${t.textMuted}`}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <p className={`mt-1 text-[11px] font-medium line-clamp-2 leading-relaxed ${t.textMuted}`}>
                                                {item.modifiersText || "Original"}
                                            </p>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="font-black font-mono tracking-tight" style={{ color: accentColor }}>
                                                ${(item.price * item.quantity).toFixed(0)}
                                            </span>
                                            <div className={`flex items-center gap-1 overflow-hidden rounded-full border shadow-inner p-0.5 ${t.surfaceBorder} ${t.surface}`}>
                                                <button
                                                    className="flex h-7 w-7 items-center justify-center rounded-full transition"
                                                    style={{ color: accentColor }}
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className={`min-w-[1.5rem] text-center text-xs font-bold ${t.text}`}>
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    className="flex h-7 w-7 items-center justify-center rounded-full transition"
                                                    style={{ color: accentColor }}
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Cart Footer ── */}
                {items.length > 0 && (
                    <div className={`border-t p-6 shadow-2xl mt-auto shrink-0 relative z-10 ${t.navBorder} ${t.bg}`}>
                        <div className="space-y-2.5 mb-6 text-sm">
                            <div className={`flex justify-between font-medium ${t.textMuted}`}>
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(0)}</span>
                            </div>
                            <div className={`flex justify-between font-medium border-b pb-3 ${t.textMuted} ${t.surfaceBorder}`}>
                                <span>Envío y Descuentos</span>
                                <span className="text-xs text-right">Se calculan en el Checkout</span>
                            </div>
                            <div className={`flex justify-between pt-1 text-xl font-extrabold tracking-tight ${t.text}`}>
                                <span>Total Parcial</span>
                                <span style={{ color: accentColor }}>${subtotal.toFixed(0)}</span>
                            </div>
                        </div>

                        {isStoreOpen ? (
                            <button
                                onClick={handleCheckoutRedirect}
                                className="w-full rounded-2xl px-4 py-4 font-black tracking-widest transition-transform hover:scale-[1.02] active:scale-95 text-center uppercase"
                                style={{ backgroundColor: accentColor, color: accentTextColor }}
                            >
                                Finalizar Pedido
                            </button>
                        ) : (
                            <button
                                disabled
                                className="w-full rounded-2xl bg-red-950/40 border border-red-900/50 px-4 py-4 font-black tracking-widest text-red-500 opacity-80 cursor-not-allowed text-center uppercase"
                            >
                                Local Cerrado
                            </button>
                        )}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
