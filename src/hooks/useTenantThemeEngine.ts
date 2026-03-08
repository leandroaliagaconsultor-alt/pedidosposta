import { useMemo } from 'react';
import {
    getAppBackground,
    isLightColor,
    getCardClasses,
    getButtonClasses,
    getAvatarClasses,
    getCTAClasses
} from '@/lib/theme';

interface ThemeData {
    template?: string;
    bg_color?: string;
    color_hex?: string;
    font_family?: string;
    banner_url?: string;
    logo_url?: string;
    name?: string;
}

export function useTenantThemeEngine(themeData?: ThemeData) {
    return useMemo(() => {
        const template = themeData?.template || 'midnight';
        const primaryColor = themeData?.color_hex || '#10b981';
        const fontClass = themeData?.font_family || 'font-sans';

        // Calcular fondo real según la plantilla o el bg_color personalizado
        const currentBg = getAppBackground(template, themeData?.bg_color);

        // Detectar modo texto basado en LUMINOSIDAD del color del fondo, NO la plantilla.
        const lightTextMode = !isLightColor(currentBg);

        // Clases utilitarias
        const textClass = lightTextMode ? 'text-zinc-50' : 'text-zinc-900';

        const wrapperClasses = `min-h-screen ${fontClass} theme-${template} ${textClass} transition-colors duration-500`;

        const renderVars = {
            "--brand-color": primaryColor,
            "--bg-color": currentBg,
        } as React.CSSProperties;

        // Skin Dictionary
        const skin = {
            card: getCardClasses(template),
            button: getButtonClasses(template),
            avatar: getAvatarClasses(template),
            cta: getCTAClasses(template),
        };

        return {
            template,
            primaryColor,
            currentBg,
            fontClass,
            lightTextMode,
            textClass,
            wrapperClasses,
            renderVars,
            skin,
            isProLayout: template === 'neon_stack_pro',
        };
    }, [themeData]);
}
