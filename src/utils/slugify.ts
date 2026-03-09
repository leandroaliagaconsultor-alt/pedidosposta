/**
 * Convierte un nombre de local a un slug válido para URLs.
 * Ej: "Búfalo Grill & Co." → "bufalo-grill-co"
 */
export function slugify(text: string): string {
    return text
        .normalize("NFD")                          // Descompone acentos
        .replace(/[\u0300-\u036f]/g, "")           // Elimina diacríticos
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")             // Solo alfanuméricos, espacios y guiones
        .replace(/\s+/g, "-")                      // Espacios → guiones
        .replace(/-+/g, "-")                       // Guiones múltiples → uno solo
        .replace(/^-|-$/g, "");                    // Elimina guiones al inicio/fin
}
