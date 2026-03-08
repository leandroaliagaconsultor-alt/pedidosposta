"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Minus, Plus, ShoppingBag, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cartStore";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ModifierOption {
    id: string;
    name: string;
    additionalPrice: number;
}

export interface Modifier {
    id: string;
    name: string;
    isMultiple: boolean; // false = radio (obligatorio), true = checkboxes (opcional)
    isRequired: boolean;
    options: ModifierOption[];
}

export interface Product {
    id: string;
    categoryId?: string; // used by page for filtering; not needed in modal logic
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    modifiers?: Modifier[];
}

interface ProductModalProps {
    product: Product;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductModal({ product, open, onOpenChange }: ProductModalProps) {
    const addItem = useCartStore((state) => state.addItem);

    const [quantity, setQuantity] = useState(1);
    // Map: modifierId -> Set of selected optionIds
    const [selectedOptions, setSelectedOptions] = useState<Map<string, Set<string>>>(new Map());

    // Recalculate price whenever selections or quantity changes
    const modifiersPrice = useMemo(() => {
        let extra = 0;
        (product.modifiers ?? []).forEach((mod) => {
            const sel = selectedOptions.get(mod.id);
            sel?.forEach((optId) => {
                const opt = mod.options.find((o) => o.id === optId);
                if (opt) extra += opt.additionalPrice;
            });
        });
        return extra;
    }, [selectedOptions, product.modifiers]);

    const unitPrice = product.price + modifiersPrice;
    const totalPrice = unitPrice * quantity;

    const handleOptionClick = (modifier: Modifier, optionId: string) => {
        setSelectedOptions((prev) => {
            const next = new Map(prev);
            if (modifier.isMultiple) {
                // Checkbox: toggle
                const set = new Set(next.get(modifier.id) ?? []);
                set.has(optionId) ? set.delete(optionId) : set.add(optionId);
                next.set(modifier.id, set);
            } else {
                // Radio: replace
                next.set(modifier.id, new Set([optionId]));
            }
            return next;
        });
    };

    const handleAdd = () => {
        // Build human-readable modifier summary for cart
        const modTexts: string[] = [];
        (product.modifiers ?? []).forEach((mod) => {
            const sel = selectedOptions.get(mod.id);
            sel?.forEach((optId) => {
                const opt = mod.options.find((o) => o.id === optId);
                if (opt) modTexts.push(opt.name);
            });
        });

        addItem({
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            name: product.name,
            price: unitPrice,
            quantity,
            imageUrl: product.imageUrl,
            modifiersText: modTexts.join(", ") || undefined,
        });

        toast.success(`${product.name} agregado al carrito`, {
            description: modTexts.length ? modTexts.join(" · ") : undefined,
            duration: 2500,
        });

        // Reset and close
        setQuantity(1);
        setSelectedOptions(new Map());
        onOpenChange(false);
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            setQuantity(1);
            setSelectedOptions(new Map());
        }
        onOpenChange(isOpen);
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={handleClose}>
            <DialogPrimitive.Portal>
                {/* Backdrop */}
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                {/* Panel — slide from bottom on mobile, centered on desktop */}
                <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-950 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">

                    {/* Drag handle pill (mobile) */}
                    <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-zinc-700 sm:hidden" />

                    {/* Close button */}
                    <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-full bg-zinc-900 p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                        <X size={18} />
                    </DialogPrimitive.Close>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto">
                        {/* Hero image */}
                        {product.imageUrl && (
                            <div className="relative h-52 w-full bg-zinc-900">
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                {/* gradient fade */}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                            </div>
                        )}

                        <div className="p-5">
                            {/* Title & Description */}
                            <DialogPrimitive.Title className="mb-1 text-2xl font-extrabold tracking-tight text-white">
                                {product.name}
                            </DialogPrimitive.Title>
                            <p className="mb-5 text-sm text-zinc-400">{product.description}</p>

                            {/* Modifiers */}
                            {(product.modifiers ?? []).map((modifier) => (
                                <div key={modifier.id} className="mb-6">
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="text-sm font-bold text-zinc-200">{modifier.name}</span>
                                        {modifier.isRequired && (
                                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                                                Obligatorio
                                            </span>
                                        )}
                                        {!modifier.isRequired && (
                                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                                                Opcional
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {modifier.options.map((option) => {
                                            const isSelected = selectedOptions.get(modifier.id)?.has(option.id) ?? false;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => handleOptionClick(modifier, option.id)}
                                                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${isSelected
                                                        ? "border-primary bg-primary/10 text-white"
                                                        : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* Indicator: circle for radio, square for checkbox */}
                                                        <span
                                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-${modifier.isMultiple ? "md" : "full"} border transition-all ${isSelected
                                                                ? "border-primary bg-primary"
                                                                : "border-zinc-600 bg-transparent"
                                                                }`}
                                                        >
                                                            {isSelected && <Check size={11} strokeWidth={3} />}
                                                        </span>
                                                        <span className="font-medium">{option.name}</span>
                                                    </div>
                                                    {option.additionalPrice > 0 && (
                                                        <span className="text-xs font-semibold text-primary">
                                                            +${option.additionalPrice.toLocaleString("es-AR")}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="border-t border-zinc-800 bg-zinc-950 p-4">
                        <div className="flex items-center gap-4">
                            {/* Quantity stepper */}
                            <div className="flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="text-zinc-400 transition hover:text-white disabled:opacity-30"
                                    disabled={quantity <= 1}
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="min-w-[20px] text-center text-base font-bold text-white">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="text-zinc-400 transition hover:text-white"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Add to cart button */}
                            <button
                                type="button"
                                onClick={handleAdd}
                                className="flex flex-1 items-center justify-between rounded-xl bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-[0_0_20px_var(--brand-color)] shadow-primary/30 transition-all hover:brightness-110 active:scale-[0.98]"
                            >
                                <span className="flex items-center gap-2">
                                    <ShoppingBag size={18} />
                                    AGREGAR AL PEDIDO
                                </span>
                                <span>${totalPrice.toLocaleString("es-AR")}</span>
                            </button>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
