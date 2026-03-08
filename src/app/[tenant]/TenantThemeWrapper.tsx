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
    };
}) {
    const pathname = usePathname();
    const isManager = pathname?.includes("/manager");

    const templateRaw = themeData.templateClass.replace("theme-", "");

    // Inject custom hook.
    const rawDataMap = {
        template: templateRaw,
        bg_color: themeData.bgColor,
        color_hex: themeData.colorHex,
        font_family: themeData.fontClass,
    };

    const { wrapperClasses, renderVars, currentBg } = useTenantThemeEngine(rawDataMap);

    if (isManager) {
        // Fallback for Manager side (don't inject the storefront aesthetic here)
        return (
            <div className="min-h-screen bg-zinc-950 font-sans text-zinc-50">
                {children}
            </div>
        );
    }

    // Public Side (Storefront, Tracker, Checkout)
    return (
        <div
            className={wrapperClasses}
            style={{
                backgroundColor: currentBg,
                ...renderVars,
            }}
        >
            {children}
        </div>
    );
}
