"use client";

import React, { useState } from "react";
import Image from "next/image";
import { type Product, ProductModal } from "@/components/storefront/ProductModal";
import { Plus } from "lucide-react";
import { getCardClasses, getButtonClasses, getButtonStyles } from "@/lib/theme";

interface ProductCardProps {
    product: Product;
    template?: string;
    primaryColor?: string;
    skin?: {
        card: string;
        button: string;
    };
    isPro?: boolean;
}

export function ProductCard({
    product,
    template = "midnight",
    primaryColor = "#10b981",
    skin,
    isPro
}: ProductCardProps) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <div
                className={`${skin?.card || getCardClasses(template)} group cursor-pointer relative flex flex-row items-center gap-3 sm:gap-4 p-3 overflow-hidden transition-all duration-300 hover:border-[var(--brand-color)]/30 hover:bg-zinc-900/40`}
                onClick={() => setModalOpen(true)}
                style={{ "--brand-color": primaryColor } as React.CSSProperties}
            >
                {/* Image Appetizer Container */}
                <div className={`relative shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-zinc-500/10 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.6)] aspect-square h-24 w-24 sm:h-32 sm:w-32`}>
                    {product.imageUrl ? (
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 96px, 128px"
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-zinc-700 opacity-60">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Sin<br />Imagen</span>
                        </div>
                    )}
                    {/* Shadow overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between py-1 sm:py-2">
                    <div className="mb-2">
                        <h3 className={`text-base sm:text-lg font-black uppercase tracking-tight leading-tight transition-colors ${['brutalism', 'minimal', 'retro-pop', 'organic-earth', 'fast-food', 'glass-frost', 'urban-flow', 'sweet-pastel'].includes(template) ? 'text-zinc-900 group-hover:text-black' : 'text-zinc-100 group-hover:text-white'}`}>
                            {product.name}
                        </h3>
                        <p className={`line-clamp-2 text-xs sm:text-[13px] mt-1 leading-relaxed ${['brutalism', 'minimal', 'retro-pop', 'organic-earth', 'fast-food', 'glass-frost', 'urban-flow', 'sweet-pastel'].includes(template) ? 'text-zinc-600' : 'text-zinc-400'}`}>{product.description}</p>
                    </div>

                    {/* Footer Flex Between */}
                    <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm sm:text-base font-black tracking-widest" style={{ color: "var(--brand-color)", textShadow: "0 0 10px rgba(var(--brand-color), 0.2)" }}>
                            ${product.price.toLocaleString("es-AR")}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // avoid double-open
                                setModalOpen(true);
                            }}
                            className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-current transition-all sm:hover:scale-110 sm:active:scale-95`}
                            style={{
                                color: "var(--brand-color)",
                                backgroundColor: "rgba(0,0,0,0.4)"
                            }}
                            aria-label={`Agregar ${product.name}`}
                        >
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Burger Architect Modal */}
            <ProductModal
                product={product}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />
        </>
    );
}
