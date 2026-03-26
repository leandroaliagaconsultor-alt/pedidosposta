"use client";

import { useState } from "react";
import Image from "next/image";
import { type Product, ProductModal } from "@/components/storefront/ProductModal";
import { Plus } from "lucide-react";
import type { ThemeTokens } from "@/lib/utils/theme";
import { badgeStyles, badgeLabels } from "@/lib/utils/theme";

interface ProductCardProps {
    product: Product;
    tokens: ThemeTokens;
    accentColor: string;
    accentTextColor: string;
}

export function ProductCard({ product, tokens, accentColor, accentTextColor }: ProductCardProps) {
    const [modalOpen, setModalOpen] = useState(false);

    const initials = product.name
        .split(" ")
        .slice(0, 2)
        .map(w => w[0])
        .join("")
        .toUpperCase();

    const hasPromo = typeof product.promotionalPrice === "number";

    return (
        <>
            <article
                className={`
                    group relative flex flex-row items-stretch gap-0
                    rounded-2xl border ${tokens.surfaceBorder}
                    ${tokens.surface} ${tokens.cardShadow} shadow-sm
                    overflow-hidden cursor-pointer
                    transition-all duration-300
                    hover:shadow-md
                `}
                onClick={() => setModalOpen(true)}
            >
                {/* ── Image ── */}
                <div className="relative shrink-0 w-28 sm:w-36 overflow-hidden">
                    {product.imageUrl ? (
                        <>
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 112px, 144px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/[0.03] pointer-events-none" />
                        </>
                    ) : (
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ backgroundColor: `${accentColor}15` }}
                        >
                            <span
                                className="font-semibold text-xl tracking-wide"
                                style={{ color: accentColor }}
                            >
                                {initials}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Content ── */}
                <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 min-w-0">
                    <div className="space-y-1.5">
                        {product.badges && product.badges.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {product.badges.map(badge => {
                                    const s = badgeStyles[badge];
                                    if (!s) return null;
                                    return (
                                        <span
                                            key={badge}
                                            className={`inline-flex items-center text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}
                                        >
                                            {badgeLabels[badge] || badge}
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        <h3 className={`text-[15px] sm:text-base font-bold leading-snug tracking-tight ${tokens.text} line-clamp-2`}>
                            {product.name}
                        </h3>

                        {product.description && (
                            <p className={`text-xs sm:text-[13px] leading-relaxed ${tokens.textMuted} line-clamp-2`}>
                                {product.description}
                            </p>
                        )}
                    </div>

                    {/* Bottom: price + add button */}
                    <div className="flex items-end justify-between mt-3 gap-2">
                        <div className="flex flex-col">
                            {hasPromo ? (
                                <>
                                    <span
                                        className="text-base sm:text-lg font-extrabold tabular-nums"
                                        style={{ color: accentColor }}
                                    >
                                        ${product.promotionalPrice!.toLocaleString("es-AR")}
                                    </span>
                                    <span className={`text-[11px] font-medium line-through ${tokens.textMuted}`}>
                                        ${product.price.toLocaleString("es-AR")}
                                    </span>
                                </>
                            ) : (
                                <span
                                    className="text-base sm:text-lg font-extrabold tabular-nums"
                                    style={{ color: accentColor }}
                                >
                                    ${product.price.toLocaleString("es-AR")}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setModalOpen(true);
                            }}
                            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all duration-200 active:scale-90 sm:hover:scale-105"
                            style={{ backgroundColor: accentColor, color: accentTextColor }}
                            aria-label={`Agregar ${product.name}`}
                        >
                            <Plus size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </article>

            <ProductModal
                product={product}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />
        </>
    );
}
