/**
 * Meta Pixel (Facebook Pixel) — utilidad centralizada.
 *
 * Pixel ID: 1651527349300923
 * Eventos configurados:
 *   - PageView   → automático en el script base (layout.tsx)
 *   - ViewContent → scroll a la sección de pricing (landing)
 *   - Lead       → clic en CTA de registro o WhatsApp
 *   - CompleteRegistration → registro exitoso en /register
 *
 * Todos los eventos llevan eventID para deduplicación con CAPI futuro.
 */

declare global {
    interface Window {
        fbq: (...args: any[]) => void;
        _fbq: any;
    }
}

export const META_PIXEL_ID = "1651527349300923";

/**
 * Dispara un evento de Meta Pixel con deduplicación.
 * Si fbq no está cargado (ej: bloqueador de ads), falla silenciosamente.
 */
export function trackPixelEvent(
    eventName: string,
    params?: Record<string, any>
) {
    if (typeof window === "undefined" || !window.fbq) return;

    const eventId = crypto.randomUUID();
    window.fbq("track", eventName, params ?? {}, { eventID: eventId });
}

/**
 * Dispara el evento "Lead" con el source de dónde vino el clic.
 * Sources: hero, pricing, footer, whatsapp, navbar, register
 */
export function trackLead(source: string) {
    trackPixelEvent("Lead", {
        content_name: "CTA Click",
        source,
    });
}

/**
 * Dispara el evento "ViewContent" para la sección de pricing.
 * Debe llamarse UNA SOLA VEZ por sesión (controlado por el caller con IntersectionObserver).
 */
export function trackPricingView() {
    trackPixelEvent("ViewContent", {
        content_name: "Pricing Section",
        content_category: "Plan Full Commerce",
        value: 60000,
        currency: "ARS",
    });
}

/**
 * Dispara el evento "CompleteRegistration" tras un registro exitoso.
 */
export function trackRegistrationComplete() {
    trackPixelEvent("CompleteRegistration", {
        content_name: "Plan Full Commerce",
        value: 60000,
        currency: "ARS",
        status: true,
    });
}
