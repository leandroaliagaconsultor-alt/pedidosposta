"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useTenantThemeEngine } from "@/hooks/useTenantThemeEngine";

export default function TenantThemeWrapper({
    children,
    themeData,
}: {
    children: React.ReactNode;
    themeData: {
        colorHex: string;
        bgColor: string;
        templateClass: string;
        fontClass: string;
        themeMode: string;
    };
}) {
    const pathname = usePathname();
    const isManager = pathname?.includes("/manager");

    const templateRaw = themeData.templateClass.replace("theme-", "");

    const { tokens, fontClass, cssVars } = useTenantThemeEngine({
        template: templateRaw,
        color_hex: themeData.colorHex,
        font_family: themeData.fontClass,
        theme_mode: (themeData.themeMode === "light" || themeData.themeMode === "dark") ? themeData.themeMode : undefined,
    });

    if (isManager) {
        return (
            <div className="min-h-screen bg-zinc-950 font-sans text-zinc-50">
                {children}
            </div>
        );
    }

    // Public Side (Storefront, Tracker, Checkout)
    return (
        <div
            className={`min-h-screen ${fontClass} ${tokens.bg} ${tokens.text} transition-colors duration-500`}
            style={cssVars}
        >
            {children}
        </div>
    );
}
