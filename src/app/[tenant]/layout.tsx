import React from "react";
import { createClient } from "@/lib/supabase/server";
import TenantThemeWrapper from "./TenantThemeWrapper";

export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tenant: string }>;
}) {
    const { tenant } = await params;
    const supabase = await createClient();

    // Fetch theme config early
    const { data } = await supabase
        .from("tenants")
        .select("color_hex, theme")
        .eq("slug", tenant)
        .single();

    // Fallbacks and parsing
    const colorHex = data?.color_hex || "#10b981";
    let themeObj: any = {};
    if (data?.theme) {
        try {
            themeObj = typeof data.theme === 'string' ? JSON.parse(data.theme) : data.theme;
        } catch (e) { }
    }

    const bgColor = themeObj?.bg_color || "";
    const templateClass = `theme-${themeObj?.template || 'midnight'}`;
    const fontClass = themeObj?.font_family || "font-sans";
    const themeMode = themeObj?.mode || "";

    return (
        <TenantThemeWrapper themeData={{ colorHex, bgColor, templateClass, fontClass, themeMode }}>
            {children}
        </TenantThemeWrapper>
    );
}
