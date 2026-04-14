// ═══════════════════════════════════════════════════════════════════════════════
// Centralised category config — used in directory, admin, and settings
// ═══════════════════════════════════════════════════════════════════════════════

export interface CategoryConfig {
    key: string;
    label: string;
    emoji: string;
    image: string | null;  // path in /public, null → emoji fallback
    from: string;          // tailwind gradient start
    to: string;            // tailwind gradient end
}

export const CATEGORIES: CategoryConfig[] = [
    { key: "hamburgueseria", label: "Hamburguesas",  emoji: "🍔", image: "/hamburguesas.png",      from: "from-orange-400", to: "to-red-500" },
    { key: "pizzeria",       label: "Pizzas",         emoji: "🍕", image: null,                     from: "from-yellow-400", to: "to-orange-500" },
    { key: "empanadas",      label: "Empanadas",     emoji: "🥟", image: "/empanadas.png",         from: "from-amber-400",  to: "to-yellow-600" },
    { key: "heladeria",      label: "Helados",       emoji: "🍦", image: "/helado_cabecera.png",   from: "from-pink-300",   to: "to-purple-500" },
    { key: "cafeteria",      label: "Cafeterías",    emoji: "☕", image: "/cafeterias.png",        from: "from-amber-600",  to: "to-yellow-800" },
    { key: "al_plato",       label: "Al Plato",      emoji: "🍛", image: "/al_plato.png",          from: "from-emerald-400", to: "to-teal-600" },
    { key: "sushi",          label: "Sushi",         emoji: "🍣", image: null,                     from: "from-rose-400",   to: "to-pink-600" },
    { key: "parrilla",       label: "Parrillas",     emoji: "🥩", image: null,                     from: "from-red-500",    to: "to-amber-600" },
    { key: "pastas",         label: "Pastas",        emoji: "🍝", image: null,                     from: "from-yellow-500", to: "to-red-500" },
    { key: "cerveceria",     label: "Cervecerías",   emoji: "🍺", image: null,                     from: "from-amber-400",  to: "to-orange-600" },
    { key: "comida_arabe",   label: "Comida Árabe",  emoji: "🧆", image: null,                     from: "from-emerald-400", to: "to-teal-600" },
    { key: "otros",          label: "Otros",         emoji: "🍽️", image: null,                     from: "from-zinc-500",   to: "to-zinc-700" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

export const CATEGORY_KEYS = CATEGORIES.map(c => c.key);
