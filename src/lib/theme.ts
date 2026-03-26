// @deprecated — Legacy theme utilities. Used only by Pro layout via useTenantThemeEngine.
// New code should use src/lib/utils/theme.ts (curated token system) instead.

export const getAppBackground = (template: string, customBg?: string) => {
    if (customBg && customBg.trim() !== "") return customBg;
    switch (template) {
        case 'brutalism': return '#fefce8';
        case 'minimal': return '#ffffff';
        case 'glass-frost': return '#f8fafc';
        case 'organic-earth': return '#faf9f6';
        case 'retro-pop': return '#f1f5f9';
        case 'fast-food': return '#fffbeb';
        case 'neon-cyber': return '#050505';
        case 'elegant-dark': return '#0a0a0a';
        case 'boutique': return '#09090b';
        case 'urban-flow': return '#ffffff';
        case 'sweet-pastel': return '#fdfbfb';
        case 'midnight':
        default: return '#09090b';
    }
};

export const isLightColor = (hex: string) => {
    if (!hex) return false;
    const c = hex.charAt(0) === '#' ? hex.substring(1, 7) : hex;
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128;
};

export const getCardClasses = (t: string) => {
    let base = "flex gap-4 p-4 transition-all duration-300 relative overflow-hidden ";
    switch (t) {
        case 'brutalism':
            return base + "border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] rounded-none bg-white text-black";
        case 'minimal':
            return base + "border border-zinc-100 shadow-sm rounded-2xl bg-white text-zinc-900";
        case 'retro-pop':
            return base + "border-2 border-zinc-800 shadow-md rounded-[2rem] bg-white text-black";
        case 'neon-cyber':
            return base + "border border-white/10 shadow-[0_0_15px_var(--brand-color)] rounded-xl bg-zinc-900/80 text-white backdrop-blur-md";
        case 'elegant-dark':
            return base + "rounded-none bg-black/40 border border-white/10 text-white backdrop-blur-md hover:border-primary/50";
        case 'boutique':
            return base + "border-[0.5px] border-zinc-700/50 rounded-lg bg-zinc-900/80 text-white font-serif";
        case 'urban-flow':
            return base + "border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white text-zinc-900 uppercase font-sans";
        case 'sweet-pastel':
            return base + "rounded-3xl shadow-xl shadow-zinc-900/5 bg-white text-zinc-800";
        case 'organic-earth':
            return base + "rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md bg-[#fefcf8] shadow-[0_4px_20px_rgb(0,0,0,0.05)] text-amber-950";
        case 'fast-food':
            return base + "rounded-2xl bg-white shadow-xl text-black border border-zinc-100";
        case 'glass-frost':
            return base + "rounded-3xl bg-white/40 backdrop-blur-md border border-white/80 text-zinc-900 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]";
        case 'midnight':
        default:
            return base + "rounded-2xl bg-zinc-900/50 border border-zinc-800/50 text-white hover:border-primary/50 hover:bg-zinc-800/80";
    }
};

export const getButtonStyles = (t: string, primaryColor: string) => {
    if (t === 'elegant-dark') return { borderColor: primaryColor, color: primaryColor };
    if (t === 'neon-cyber') return { backgroundColor: primaryColor, boxShadow: `0 0 15px ${primaryColor}40`, color: '#09090b' };
    if (t === 'brutalism' || t === 'retro-pop' || t === 'urban-flow') return { backgroundColor: primaryColor, color: '#000' };
    return { backgroundColor: primaryColor, color: '#fff' };
};

export const getButtonClasses = (t: string) => {
    let base = "flex items-center justify-center font-bold transition-all duration-300 ";

    switch (t) {
        case 'brutalism': return base + "rounded-none border-2 border-black shadow-[2px_2px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";
        case 'retro-pop': return base + "rounded-full border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none";
        case 'elegant-dark': return base + "rounded-none border backdrop-blur-sm bg-transparent";
        case 'neon-cyber': return base + "rounded-xl font-black scale-105";
        case 'boutique': return base + "rounded-md border border-current bg-transparent";
        case 'urban-flow': return base + "rounded-none border-2 border-zinc-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase";
        case 'sweet-pastel': return base + "rounded-3xl shadow-md";
        case 'organic-earth': return base + `rounded-tl-[10px] rounded-br-[10px] rounded-tr-[4px] rounded-bl-[4px] shadow-sm`;
        case 'fast-food': return base + "rounded-xl -skew-x-6 shadow-md hover:scale-110";
        case 'glass-frost': return base + `rounded-full backdrop-blur-xl bg-white/50 border border-white shadow-sm font-semibold !text-zinc-900`;
        case 'minimal': return base + "rounded-xl shadow-sm hover:opacity-80";
        case 'midnight':
        default: return base + "rounded-full shadow-lg hover:scale-110 active:scale-95";
    }
};

export const getCTAClasses = (t: string) => {
    let base = "w-full py-4 text-sm font-black tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ";

    switch (t) {
        case 'brutalism': return base + "rounded-none border-4 border-black shadow-[4px_4px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none";
        case 'retro-pop': return base + "rounded-full border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none";
        case 'elegant-dark': return base + "rounded-none border backdrop-blur-md bg-black/40 hover:bg-black/60";
        case 'neon-cyber': return base + "rounded-xl font-black uppercase tracking-[0.2em] shadow-[0_0_20px_var(--brand-color)]";
        case 'boutique': return base + "rounded-none border-[0.5px] border-current bg-transparent font-serif hover:bg-zinc-900";
        case 'urban-flow': return base + "rounded-none border-2 border-zinc-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase font-sans tracking-widest";
        case 'sweet-pastel': return base + "rounded-full shadow-lg hover:shadow-xl font-bold";
        case 'organic-earth': return base + `rounded-tl-2xl rounded-br-2xl rounded-tr-md rounded-bl-md shadow-lg hover:shadow-xl`;
        case 'fast-food': return base + "rounded-xl -skew-x-6 italic shadow-xl border-b-4 border-black/20 hover:scale-[1.02] active:scale-95";
        case 'glass-frost': return base + `rounded-full backdrop-blur-xl bg-white/40 border border-white shadow-xl !text-zinc-900 hover:bg-white/60`;
        case 'minimal': return base + "rounded-xl shadow-sm hover:opacity-90";
        case 'midnight':
        default: return base + "rounded-full shadow-lg hover:scale-[1.02] active:scale-95";
    }
};

export const getAvatarClasses = (t: string) => {
    let base = "relative z-10 h-32 w-32 overflow-hidden rounded-full border-[8px] transition-all duration-300 sm:h-40 sm:w-40 ";
    switch (t) {
        case 'brutalism': return base + "border-black shadow-[8px_8px_0px_black] rounded-none";
        case 'retro-pop': return base + "border-zinc-800 shadow-xl rounded-[2.5rem]";
        case 'neon-cyber': return base + "border-zinc-900 shadow-[0_0_30px_var(--brand-color)]";
        case 'boutique': return base + "border-[0.5px] border-zinc-700/50 shadow-2xl rounded-none";
        case 'urban-flow': return base + "border-2 border-zinc-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] rounded-xl";
        case 'sweet-pastel': return base + "border-4 border-white shadow-xl rounded-full";
        case 'minimal': return base + "border-white shadow-md";
        case 'elegant-dark': return base + "border-black shadow-2xl rounded-none";
        case 'fast-food': return base + "border-white shadow-xl -rotate-3";
        default: return base + "shadow-2xl";
    }
};
