// ─── Hybrid Theme System ─────────────────────────────────────────────────────
// Backgrounds: strictly controlled (light = zinc-50, dark = zinc-950)
// Accents: tenant's brand color via CSS variable --brand-accent
//
// IMPORTANT: Tailwind opacity modifiers (e.g. bg-[var(--x)]/10) do NOT work
// with hex CSS vars. All accent colors that need opacity MUST use inline styles.
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeMode = "light" | "dark";

export interface ThemeTokens {
  mode: ThemeMode;
  bg: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  textMuted: string;
  navBg: string;
  navBorder: string;
  cardShadow: string;
  // These tokens are safe (no opacity on CSS vars)
  categoryActiveBg: string;
  categoryActiveText: string;
}

const lightTokens: ThemeTokens = {
  mode: "light",
  bg: "bg-zinc-50",
  surface: "bg-white",
  surfaceBorder: "border-zinc-200/80",
  text: "text-zinc-900",
  textMuted: "text-zinc-500",
  navBg: "bg-zinc-50/80",
  navBorder: "border-zinc-200/60",
  cardShadow: "shadow-zinc-900/[0.04]",
  categoryActiveBg: "bg-zinc-100",
  categoryActiveText: "text-zinc-900",
};

const darkTokens: ThemeTokens = {
  mode: "dark",
  bg: "bg-zinc-950",
  surface: "bg-zinc-900/60",
  surfaceBorder: "border-zinc-800/60",
  text: "text-zinc-50",
  textMuted: "text-zinc-400",
  navBg: "bg-zinc-950/80",
  navBorder: "border-zinc-800/40",
  cardShadow: "shadow-black/20",
  categoryActiveBg: "bg-zinc-800",
  categoryActiveText: "text-zinc-50",
};

// ─── Resolver ────────────────────────────────────────────────────────────────

export function resolveTheme(mode: ThemeMode): ThemeTokens {
  return mode === "light" ? lightTokens : darkTokens;
}

// ─── Contrast helper ─────────────────────────────────────────────────────────

export function isLightColor(hex: string): boolean {
  if (!hex) return false;
  const c = hex.charAt(0) === "#" ? hex.substring(1, 7) : hex;
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150;
}

// ─── Legacy Mapper ───────────────────────────────────────────────────────────

const DARK_TEMPLATES = new Set([
  "midnight", "neon-cyber", "elegant-dark", "boutique", "neon_stack_pro",
]);

export function mapLegacyToMode(template?: string): ThemeMode {
  if (!template) return "dark";
  return DARK_TEMPLATES.has(template) ? "dark" : "light";
}

// ─── Badge Palette (product badges — independent of accent) ──────────────────

export const badgeStyles: Record<string, { bg: string; text: string; border: string }> = {
  nuevo:   { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  popular: { bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400",     border: "border-amber-500/20" },
  vegano:  { bg: "bg-green-500/10",   text: "text-green-600 dark:text-green-400",     border: "border-green-500/20" },
  sintacc: { bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400",       border: "border-blue-500/20" },
  picante: { bg: "bg-red-500/10",     text: "text-red-600 dark:text-red-400",         border: "border-red-500/20" },
};

export const badgeLabels: Record<string, string> = {
  nuevo: "Nuevo",
  popular: "Popular",
  vegano: "Vegano",
  sintacc: "Sin TACC",
  picante: "Picante",
};
