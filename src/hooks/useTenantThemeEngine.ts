import { useMemo } from 'react';
import {
    resolveTheme,
    mapLegacyToMode,
    isLightColor,
    type ThemeMode,
    type ThemeTokens,
} from '@/lib/utils/theme';

interface ThemeData {
    template?: string;
    bg_color?: string;
    color_hex?: string;
    font_family?: string;
    theme_mode?: ThemeMode;
}

export function useTenantThemeEngine(themeData?: ThemeData) {
    return useMemo(() => {
        const primaryColor = themeData?.color_hex || '#10b981';
        const fontClass = themeData?.font_family || 'font-sans';

        // Resolve mode: prefer explicit theme_mode, fallback to legacy template mapper
        const mode: ThemeMode = themeData?.theme_mode || mapLegacyToMode(themeData?.template);
        const tokens: ThemeTokens = resolveTheme(mode);

        // Is the brand accent light? (used for text-on-accent decisions)
        const accentIsLight = isLightColor(primaryColor);

        // CSS variables to inject on the root container
        const cssVars = {
            "--brand-accent": primaryColor,
            "--brand-color": primaryColor,
        } as React.CSSProperties;

        return {
            tokens,
            mode,
            primaryColor,
            fontClass,
            accentIsLight,
            cssVars,
            // Legacy compat for Pro layout
            isProLayout: themeData?.template === 'neon_stack_pro',
        };
    }, [themeData]);
}
