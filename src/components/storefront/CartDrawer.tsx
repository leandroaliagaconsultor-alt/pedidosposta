"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { X, Minus, Plus, ShoppingBag, ChefHat, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cartStore";
import { createClient } from "@/lib/supabase/client";
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
    const searchParams = useSearchParams();
    const tableNumber = searchParams.get("mesa");
    const tenantSlug = params.tenant;

    const { items, updateQuantity, removeItem, clearCart } = useCartStore();
    const [sendingToKitchen, setSendingToKitchen] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);

    // Cerrar el drawer si se queda sin items
    React.useEffect(() => {
        if (open && items.length === 0 && !sentSuccess) {
            onOpenChange(false);
        }
    }, [items.length, open, sentSuccess, onOpenChange]);

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const handleCheckoutRedirect = () => {
        onOpenChange(false);
        setTimeout(() => {
            router.push(`/${tenantSlug}/checkout`);
        }, 300);
    };

    // ── MESA: enviar directo a cocina sin checkout ──
    const handleSendToKitchen = async () => {
        if (items.length === 0 || sendingToKitchen) return;
        setSendingToKitchen(true);

        try {
            const supabase = createClient();

            // Get tenant ID
            const { data: tenantData } = await supabase
                .from("tenants")
                .select("id")
                .eq("slug", tenantSlug)
                .single();

            if (!tenantData) throw new Error("Tenant not found");

            // Send order via RPC (same as checkout but minimal data)
            const { error } = await supabase.rpc("process_checkout", {
                payload: {
                    tenant_id: tenantData.id,
                    customer_name: `Mesa ${tableNumber}`,
                    first_name: `Mesa ${tableNumber}`,
                    last_name: "",
                    customer_phone: "",
                    customer_address: `Mesa ${tableNumber}`,
                    delivery_notes: `Mesa ${tableNumber}`,
                    delivery_method: "DINE_IN",
                    payment_method: "CASH",
                    is_asap: true,
                    scheduled_time: null,
                    scheduled_slot: null,
                    total_amount: subtotal,
                    delivery_fee: 0,
                    table_number: tableNumber,
                    status: "pending",
                    receipt_url: null,
                    items: items.map((item) => ({
                        product_id: item.productId,
                        quantity: item.quantity,
                        unit_price: item.price,
                        total_price: item.price * item.quantity,
                        notes: item.modifiersText || null,
                    })),
                },
            });

            if (error) throw error;

            setSentSuccess(true);
            clearCart();

            // Reset after 3 seconds
            setTimeout(() => {
                setSentSuccess(false);
                onOpenChange(false);
            }, 3000);
        } catch (err) {
            console.error("Error sending to kitchen:", err);
            toast.error("No se pudo enviar el pedido. Intentá de nuevo.");
            setSendingToKitchen(false);
        }
    };

    // ── Success screen ──
    if (sentSuccess) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className={`flex w-full flex-col p-0 sm:max-w-md shadow-2xl overflow-hidden ${t.bg} ${t.surfaceBorder}`}>
                    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${accentColor}20` }}>
                            <CheckCircle2 size={40} style={{ color: accentColor }} />
                        </div>
                        <h2 className={`text-2xl font-extrabold mb-2 ${t.text}`}>¡Pedido enviado!</h2>
                        <p className={`text-sm ${t.textMuted}`}>
                            Tu pedido para la <strong className={t.text}>Mesa {tableNumber}</strong> fue enviado a cocina.
                        </p>
                        <p className={`text-xs mt-3 ${t.textMuted}`}>Podés seguir agregando items si querés.</p>
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className={`flex w-full flex-col p-0 sm:max-w-md shadow-2xl overflow-hidden ${t.bg} ${t.surfaceBorder}`}>
                {/* ── Header ── */}
                <SheetHeader className={`border-b p-5 relative z-10 shrink-0 ${t.navBorder} ${t.navBg}`}>
                    <SheetTitle className={`flex items-center gap-2 text-xl tracking-tight ${t.text}`}>
                        <ShoppingBag className="h-5 w-5" style={{ color: accentColor }} />
                        {tableNumber ? `Mesa ${tableNumber}` : "Tu Orden"}
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
                                                <button onClick={() => removeItem(item.id)} className={`hover:text-red-500 transition-colors shrink-0 p-1 -mr-1 ${t.textMuted}`}>
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
                                                <button className="flex h-7 w-7 items-center justify-center rounded-full transition" style={{ color: accentColor }}
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                    <Minus size={14} />
                                                </button>
                                                <span className={`min-w-[1.5rem] text-center text-xs font-bold ${t.text}`}>{item.quantity}</span>
                                                <button className="flex h-7 w-7 items-center justify-center rounded-full transition" style={{ color: accentColor }}
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}>
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
                            {!tableNumber && (
                                <div className={`flex justify-between font-medium border-b pb-3 ${t.textMuted} ${t.surfaceBorder}`}>
                                    <span>Envío y Descuentos</span>
                                    <span className="text-xs text-right">Se calculan en el Checkout</span>
                                </div>
                            )}
                            <div className={`flex justify-between pt-1 text-xl font-extrabold tracking-tight ${t.text}`}>
                                <span>{tableNumber ? "Total" : "Total Parcial"}</span>
                                <span style={{ color: accentColor }}>${subtotal.toFixed(0)}</span>
                            </div>
                        </div>

                        {isStoreOpen ? (
                            tableNumber ? (
                                /* ── MESA: Enviar directo a cocina ── */
                                <button
                                    onClick={handleSendToKitchen}
                                    disabled={sendingToKitchen}
                                    className="w-full rounded-2xl px-4 py-4 font-black tracking-widest transition-transform hover:scale-[1.02] active:scale-95 text-center uppercase flex items-center justify-center gap-3 disabled:opacity-70"
                                    style={{ backgroundColor: accentColor, color: accentTextColor }}
                                >
                                    {sendingToKitchen ? (
                                        <><Loader2 size={20} className="animate-spin" /> Enviando...</>
                                    ) : (
                                        <><ChefHat size={20} /> Enviar a Cocina</>
                                    )}
                                </button>
                            ) : (
                                /* ── Normal: ir al checkout ── */
                                <button
                                    onClick={handleCheckoutRedirect}
                                    className="w-full rounded-2xl px-4 py-4 font-black tracking-widest transition-transform hover:scale-[1.02] active:scale-95 text-center uppercase"
                                    style={{ backgroundColor: accentColor, color: accentTextColor }}
                                >
                                    Finalizar Pedido
                                </button>
                            )
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
