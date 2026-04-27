"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Palette, Save, Store, Image as ImageIcon, Smartphone, Sun, Moon, Type, Upload, Plus, ExternalLink } from "lucide-react";
import { isLightColor } from "@/lib/utils/theme";

const brandSchema = z.object({
    name: z.string().min(2, "El nombre comercial es obligatorio"),
    color_hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color Inválido"),
    theme_mode: z.enum(["light", "dark"]).default("dark"),
    whatsapp_number: z.string().optional().nullable(),
    logo_url: z.string().optional().or(z.literal("")),
    banner_url: z.string().optional().or(z.literal("")),
    font_family: z.enum(["font-sans", "font-serif", "font-mono", "font-urbana", "font-artesanal", "font-vanguardia"]).default("font-sans"),
});

type BrandForm = z.infer<typeof brandSchema>;

const inputCls = "w-full rounded-[10px] border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] px-4 py-3 text-sm text-[#0F1210] outline-none transition focus:border-[#43926A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(67,146,106,.15)]";

export default function BrandStudioProPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = use(params);
    const router = useRouter();
    const supabase = createClient();

    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const logoFileRef = useRef<File | null>(null);
    const bannerFileRef = useRef<File | null>(null);

    const form = useForm({
        resolver: zodResolver(brandSchema),
        defaultValues: { name: "", color_hex: "#10b981", theme_mode: "dark" as const, whatsapp_number: "", logo_url: "", banner_url: "", font_family: "font-sans" as const },
    });

    const watchValues = form.watch();

    useEffect(() => {
        const fetchTenant = async () => {
            const { data, error } = await supabase.from("tenants").select("*").eq("slug", tenant).single();
            if (!error && data) {
                setTenantId(data.id);
                let themeData: any = {};
                if (data.theme) { try { themeData = typeof data.theme === 'string' ? JSON.parse(data.theme) : data.theme; } catch {} }
                form.reset({ name: data.name || "", color_hex: data.color_hex || "#10b981", theme_mode: themeData.mode || "dark", whatsapp_number: data.whatsapp_number || "", logo_url: data.logo_url || "", banner_url: data.banner_url || "", font_family: themeData.font_family || "font-sans" });
            }
            setLoading(false);
        };
        fetchTenant();
    }, [supabase, tenant, form]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "logo_url" | "banner_url") => {
        const file = e.target.files?.[0];
        if (!file || !tenantId) return;
        if (fieldName === "logo_url") logoFileRef.current = file; else bannerFileRef.current = file;
        form.setValue(fieldName, URL.createObjectURL(file), { shouldValidate: true, shouldDirty: true });
    };

    const onSubmit = async (data: BrandForm) => {
        if (!tenantId) return;
        setSaving(true);
        try {
            let finalLogoUrl = data.logo_url;
            let finalBannerUrl = data.banner_url;

            if (logoFileRef.current) {
                const fileName = `${tenantId}/logo-${Date.now()}.${logoFileRef.current.name.split('.').pop() || 'tmp'}`;
                const { error: uploadError } = await supabase.storage.from('tenant-assets').upload(fileName, logoFileRef.current, { upsert: true });
                if (uploadError) { toast.error(uploadError.message || 'Error subiendo logo'); setSaving(false); return; }
                finalLogoUrl = supabase.storage.from('tenant-assets').getPublicUrl(fileName).data.publicUrl;
            }
            if (bannerFileRef.current) {
                const fileName = `${tenantId}/banner-${Date.now()}.${bannerFileRef.current.name.split('.').pop() || 'tmp'}`;
                const { error: uploadError } = await supabase.storage.from('tenant-assets').upload(fileName, bannerFileRef.current, { upsert: true });
                if (uploadError) { toast.error(uploadError.message || 'Error subiendo banner'); setSaving(false); return; }
                finalBannerUrl = supabase.storage.from('tenant-assets').getPublicUrl(fileName).data.publicUrl;
            }

            const { error: updateError } = await supabase.from("tenants").update({ name: data.name, color_hex: data.color_hex, whatsapp_number: data.whatsapp_number, logo_url: finalLogoUrl, banner_url: finalBannerUrl, theme: { mode: data.theme_mode, font_family: data.font_family } }).eq("id", tenantId).select();
            if (updateError) throw new Error(updateError.message);

            logoFileRef.current = null; bannerFileRef.current = null;
            form.setValue("logo_url", finalLogoUrl || ""); form.setValue("banner_url", finalBannerUrl || "");
            toast.success("¡Diseño guardado!"); router.refresh();
        } catch (err: any) { toast.error("Error en el guardado", { description: err.message }); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 size={32} className="animate-spin text-[#43926A]" /></div>;

    const isDark = watchValues.theme_mode === "dark";
    const previewBg = isDark ? "#09090b" : "#fafafa";
    const previewSurface = isDark ? "rgba(24,24,27,0.6)" : "#ffffff";
    const previewBorder = isDark ? "rgba(39,39,42,0.6)" : "rgba(228,228,231,0.8)";
    const previewText = isDark ? "#fafafa" : "#18181b";
    const previewMuted = isDark ? "#a1a1aa" : "#71717a";
    const brandColor = watchValues.color_hex || "#10b981";
    const brandTextOnAccent = isLightColor(brandColor) ? "#18181b" : "#ffffff";

    return (
        <div className="h-full w-full max-w-7xl mx-auto">
            <header className="mb-8">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#575757]">Diseño</p>
                <h1 className="font-['Archivo_Black',sans-serif] text-4xl tracking-tight mt-1">Brand <span className="text-[#43926A]">Studio</span></h1>
                <p className="text-sm text-[#575757] mt-1.5">Personalizá la identidad visual de tu tienda.</p>
            </header>

            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
                {/* Left: Controls */}
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6 pb-24">

                    {/* Identity Section */}
                    <div className="rounded-[18px] border border-[rgba(15,18,16,.1)] bg-white p-6">
                        <h2 className="mb-6 flex items-center gap-3 font-['Archivo_Black',sans-serif] text-sm uppercase tracking-tight">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D7E9DE] text-[11px] font-black text-[#2F6E4F]">1</span>
                            Identidad
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-1.5">Nombre Comercial</label>
                                <input {...form.register("name")} className={`${inputCls} ${form.formState.errors.name ? "border-[#E25A2B]" : ""}`} />
                                {form.formState.errors.name && <p className="mt-1 text-xs text-[#B9431C]">{form.formState.errors.name.message}</p>}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {/* Logo */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-1.5">Logotipo</label>
                                    <div className="relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(15,18,16,.18)] bg-[#FBF8F1] transition hover:border-[#43926A] hover:bg-white">
                                        <input type="file" onChange={(e) => { handleFileSelect(e, "logo_url"); (e.target as HTMLInputElement).value = ''; }} accept="image/png, image/jpeg, image/webp" className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer" disabled={saving} />
                                        {watchValues.logo_url ? (
                                            <img src={watchValues.logo_url} alt="Logo" className="h-full w-full object-contain p-2" />
                                        ) : (
                                            <div className="flex flex-col items-center text-[#575757]"><ImageIcon size={24} className="mb-2 opacity-50" /><span className="text-[11px] font-bold">Subir Imagen</span></div>
                                        )}
                                    </div>
                                </div>
                                {/* Banner */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-1.5">Banner de Portada</label>
                                    <div className="relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(15,18,16,.18)] bg-[#FBF8F1] transition hover:border-[#43926A] hover:bg-white">
                                        <input type="file" onChange={(e) => { handleFileSelect(e, "banner_url"); (e.target as HTMLInputElement).value = ''; }} accept="image/png, image/jpeg, image/webp" className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer" disabled={saving} />
                                        {watchValues.banner_url ? (
                                            <img src={watchValues.banner_url} alt="Banner" className="h-full w-full object-cover rounded-lg" />
                                        ) : (
                                            <div className="flex flex-col items-center text-[#575757]"><Upload size={24} className="mb-2 opacity-50" /><span className="text-[11px] font-bold">Subir Banner</span></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="rounded-[18px] border border-[rgba(15,18,16,.1)] bg-white p-6">
                        <h2 className="mb-6 flex items-center gap-3 font-['Archivo_Black',sans-serif] text-sm uppercase tracking-tight">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D7E9DE] text-[11px] font-black text-[#2F6E4F]">2</span>
                            Apariencia
                        </h2>

                        <div className="space-y-6">
                            {/* Theme Mode */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-3">Modo de la Tienda</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {([
                                        { val: "light", icon: Sun, name: "Claro", desc: "Fondo blanco, ideal para delivery diurno" },
                                        { val: "dark", icon: Moon, name: "Oscuro", desc: "Fondo negro, premium y moderno" },
                                    ] as const).map((m) => {
                                        const active = watchValues.theme_mode === m.val;
                                        const Icon = m.icon;
                                        return (
                                            <label key={m.val} className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${active ? "border-[#43926A] bg-[rgba(67,146,106,.06)] shadow-[0_0_0_3px_rgba(67,146,106,.08)]" : "border-[rgba(15,18,16,.18)] bg-[#FBF8F1] hover:bg-white"}`}>
                                                <input type="radio" value={m.val} {...form.register("theme_mode")} className="sr-only" />
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-[#D7E9DE]" : "bg-[#E9E7E2]"}`}>
                                                    <Icon size={20} className={active ? "text-[#2F6E4F]" : "text-[#575757]"} />
                                                </div>
                                                <div>
                                                    <span className={`text-sm font-bold ${active ? "text-[#2F6E4F]" : "text-[#0F1210]"}`}>{m.name}</span>
                                                    <p className="text-[11px] text-[#575757]">{m.desc}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Brand Color */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-1.5">Color de Marca</label>
                                <p className="mb-3 text-[11px] text-[#575757]">Se aplica a botones, bordes del logo, precios y acentos visuales.</p>
                                <div className="flex items-center gap-4">
                                    <div className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-[10px] border border-[rgba(15,18,16,.18)] cursor-pointer">
                                        <input type="color" value={watchValues.color_hex} onChange={(e) => form.setValue("color_hex", e.target.value, { shouldValidate: true, shouldDirty: true })} className="absolute -inset-4 h-24 w-28 cursor-pointer opacity-0" />
                                        <div className="pointer-events-none h-full w-full" style={{ backgroundColor: watchValues.color_hex }} />
                                    </div>
                                    <input type="text" value={watchValues.color_hex} onChange={(e) => form.setValue("color_hex", e.target.value, { shouldValidate: true, shouldDirty: true })} placeholder="#10b981"
                                        className={`${inputCls} font-mono uppercase tracking-widest ${form.formState.errors.color_hex ? "border-[#E25A2B]" : ""}`} />
                                </div>
                                {form.formState.errors.color_hex && <p className="mt-1 text-xs text-[#B9431C]">{form.formState.errors.color_hex.message}</p>}
                            </div>

                            {/* Typography */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-3">Tipografía</label>
                                <div className="flex flex-col gap-2">
                                    {[
                                        { id: "font-sans", name: "Moderna", desc: "Sistémica, limpia" },
                                        { id: "font-serif", name: "Clásica", desc: "Elegante, tradicional" },
                                        { id: "font-mono", name: "Divertida", desc: "Técnica, llamativa" },
                                        { id: "font-urbana", name: "Urbana", desc: "Alto impacto, condensada" },
                                        { id: "font-artesanal", name: "Artesanal", desc: "Rústica, cálida" },
                                        { id: "font-vanguardia", name: "Vanguardia", desc: "Trendy, geométrica" },
                                    ].map((font) => {
                                        const active = watchValues.font_family === font.id;
                                        return (
                                            <label key={font.id} className={`relative flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${active ? "border-[#43926A] bg-[rgba(67,146,106,.06)] shadow-[0_0_0_3px_rgba(67,146,106,.08)]" : "border-[rgba(15,18,16,.1)] bg-[#FBF8F1] hover:bg-white"}`}>
                                                <input type="radio" value={font.id} {...form.register("font_family")} className="sr-only" />
                                                <div className="flex flex-col">
                                                    <span className={`text-[13px] font-bold ${active ? 'text-[#2F6E4F]' : 'text-[#0F1210]'} ${font.id} ${font.id === 'font-urbana' ? 'uppercase' : ''}`}>{font.name}</span>
                                                    <span className={`text-[10px] text-[#575757] ${font.id}`}>Hamburguesa Clasica $5.900</span>
                                                </div>
                                                <div className={`h-[18px] w-[18px] rounded-full border-2 relative ${active ? 'border-[#43926A]' : 'border-[rgba(15,18,16,.18)]'}`}>
                                                    {active && <span className="absolute inset-[2px] rounded-full bg-[#43926A]" />}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save bar */}
                    <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between border-t border-[rgba(15,18,16,.1)] bg-white/80 p-5 px-6 backdrop-blur-xl xl:static xl:mx-0 xl:rounded-[18px] xl:border xl:shadow-sm">
                        <p className="hidden text-sm text-[#575757] xl:block">Guardá para ver los cambios reflejados.</p>
                        <button type="submit" disabled={saving}
                            className="flex w-full xl:w-auto items-center justify-center gap-2 rounded-full px-10 py-3.5 font-['Archivo_Black',sans-serif] text-sm uppercase tracking-[.04em] shadow-lg transition hover:-translate-y-px active:scale-95 disabled:opacity-50"
                            style={{ backgroundColor: brandColor, color: brandTextOnAccent }}>
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Publicar Cambios
                        </button>
                    </div>

                    <a href={`/${tenant}`} target="_blank" rel="noopener noreferrer"
                        className="flex lg:hidden items-center justify-center gap-2 w-full py-3 rounded-xl border border-[rgba(15,18,16,.18)] text-sm font-bold text-[#575757] hover:text-[#0F1210] hover:border-[#0F1210] transition">
                        <Smartphone size={16} /> Ver como se ve tu tienda <ExternalLink size={14} />
                    </a>
                </form>

                {/* Right: Live Preview (unchanged logic, just frame colors) */}
                <div className="relative hidden w-full lg:block">
                    <div className="sticky top-10 flex flex-col items-center">
                        <div className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#575757] flex items-center gap-2">
                            <Smartphone size={14} /> Vista Previa
                        </div>

                        <div className={`relative h-[780px] w-[375px] overflow-hidden rounded-[2.5rem] border-[8px] shadow-2xl ${isDark ? 'border-[#0F1210] shadow-black/40' : 'border-[#E9E7E2] shadow-zinc-300/50'} ${watchValues.font_family}`} style={{ backgroundColor: previewBg }}>
                            <div className={`absolute left-1/2 top-0 z-50 h-6 w-32 -translate-x-1/2 rounded-b-3xl ${isDark ? 'bg-[#0F1210]' : 'bg-[#E9E7E2]'}`} />
                            <div className="h-full w-full overflow-y-auto pb-20 [&::-webkit-scrollbar]:hidden transition-colors duration-500" style={{ color: previewText }}>
                                <div className="relative h-48 w-full bg-cover bg-center" style={{ backgroundImage: watchValues.banner_url ? `url(${watchValues.banner_url})` : `linear-gradient(135deg, ${brandColor}30, transparent)` }}>
                                    <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to top, ${previewBg}, transparent)` }} />
                                </div>
                                <div className="relative z-10 flex flex-col items-center px-4 pb-6">
                                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-lg -mt-10 border-2" style={{ borderColor: brandColor, backgroundColor: previewSurface }}>
                                        {watchValues.logo_url ? <img src={watchValues.logo_url} alt="Logo" className="h-full w-full object-contain" /> : <Store size={32} style={{ color: previewMuted }} />}
                                    </div>
                                    <div className="mt-3"><span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />Abierto</span></div>
                                    <h3 className={`mt-3 text-xl font-bold tracking-tight text-center px-4 leading-tight ${watchValues.font_family === 'font-urbana' ? 'uppercase' : ''}`}>{watchValues.name || "Mi Local"}</h3>
                                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                                        {["Envío $500", "Retiro gratis"].map(pill => (
                                            <span key={pill} className="px-2.5 py-1 rounded-full text-[9px] font-medium" style={{ backgroundColor: previewSurface, border: `1px solid ${previewBorder}`, color: previewMuted }}>{pill}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-1 px-4 py-2 mb-2">
                                    {["Populares", "Combos", "Bebidas"].map((cat, i) => (
                                        <span key={cat} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={i === 0 ? { backgroundColor: `${brandColor}18`, color: brandColor } : { color: previewMuted }}>{cat}</span>
                                    ))}
                                </div>
                                <div className="px-4 space-y-3">
                                    {["Classic Smash Burger", "Papas con Cheddar"].map((name, i) => (
                                        <div key={i} className="flex items-stretch rounded-2xl overflow-hidden border" style={{ backgroundColor: previewSurface, borderColor: previewBorder }}>
                                            <div className="w-24 shrink-0 flex items-center justify-center" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5', color: `${brandColor}60` }}>
                                                <span className="text-lg font-bold">{name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
                                            </div>
                                            <div className="flex-1 p-3 flex flex-col justify-between">
                                                <div><h5 className="font-bold text-sm leading-tight mb-1">{name}</h5><p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: previewMuted }}>Doble medallón, doble cheddar, pan de papa.</p></div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm font-extrabold" style={{ color: brandColor }}>${(8500 + i * 3000).toLocaleString("es-AR")}</span>
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: brandColor, color: brandTextOnAccent }}><Plus size={16} strokeWidth={2.5} /></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute bottom-6 left-5 right-5">
                                    <button className="w-full py-4 text-sm font-bold tracking-wide rounded-2xl shadow-lg flex items-center justify-between px-6" style={{ backgroundColor: brandColor, color: brandTextOnAccent }}>
                                        <div className="flex items-center gap-3"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/15 text-xs font-bold text-white">2</div><span className="uppercase">Ver Pedido</span></div>
                                        <span className="font-bold">$17.000</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
