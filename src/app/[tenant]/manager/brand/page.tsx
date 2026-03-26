"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Palette, Save, Store, Image as ImageIcon, Smartphone, Sun, Moon, Type, Upload, X, Plus } from "lucide-react";
import { isLightColor } from "@/lib/utils/theme";

// ─── Schema ──────────────────────────────────────────────────────────────────

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
        defaultValues: {
            name: "",
            color_hex: "#10b981",
            theme_mode: "dark" as const,
            whatsapp_number: "",
            logo_url: "",
            banner_url: "",
            font_family: "font-sans" as const,
        },
    });

    const watchValues = form.watch();

    // Fetch initial profile
    useEffect(() => {
        const fetchTenant = async () => {
            const { data, error } = await supabase.from("tenants").select("*").eq("slug", tenant).single();
            if (!error && data) {
                setTenantId(data.id);

                let themeData: any = {};
                if (data.theme) {
                    try {
                        themeData = typeof data.theme === 'string' ? JSON.parse(data.theme) : data.theme;
                    } catch (e) { }
                }

                form.reset({
                    name: data.name || "",
                    color_hex: data.color_hex || "#10b981",
                    theme_mode: themeData.mode || "dark",
                    whatsapp_number: data.whatsapp_number || "",
                    logo_url: data.logo_url || "",
                    banner_url: data.banner_url || "",
                    font_family: themeData.font_family || "font-sans",
                });
            }
            setLoading(false);
        };
        fetchTenant();
    }, [supabase, tenant, form]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "logo_url" | "banner_url") => {
        const file = e.target.files?.[0];
        if (!file || !tenantId) return;

        if (fieldName === "logo_url") {
            logoFileRef.current = file;
        } else {
            bannerFileRef.current = file;
        }

        const objectUrl = URL.createObjectURL(file);
        form.setValue(fieldName, objectUrl, { shouldValidate: true, shouldDirty: true });
    };

    const onSubmit = async (data: BrandForm) => {
        if (!tenantId) return;
        setSaving(true);

        try {
            let finalLogoUrl = data.logo_url;
            let finalBannerUrl = data.banner_url;

            if (logoFileRef.current) {
                const fileExt = logoFileRef.current.name.split('.').pop() || 'tmp';
                const fileName = `${tenantId}/logo-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('tenant-assets')
                    .upload(fileName, logoFileRef.current, { upsert: true });
                if (uploadError) {
                    toast.error(uploadError.message || 'Error subiendo logo');
                    setSaving(false);
                    return;
                }
                const { data: publicData } = supabase.storage.from('tenant-assets').getPublicUrl(fileName);
                finalLogoUrl = publicData.publicUrl;
            }

            if (bannerFileRef.current) {
                const fileExt = bannerFileRef.current.name.split('.').pop() || 'tmp';
                const fileName = `${tenantId}/banner-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('tenant-assets')
                    .upload(fileName, bannerFileRef.current, { upsert: true });
                if (uploadError) {
                    toast.error(uploadError.message || 'Error subiendo banner');
                    setSaving(false);
                    return;
                }
                const { data: publicData } = supabase.storage.from('tenant-assets').getPublicUrl(fileName);
                finalBannerUrl = publicData.publicUrl;
            }

            const themeJson = {
                mode: data.theme_mode,
                font_family: data.font_family,
            };

            const { error: updateError } = await supabase
                .from("tenants")
                .update({
                    name: data.name,
                    color_hex: data.color_hex,
                    whatsapp_number: data.whatsapp_number,
                    logo_url: finalLogoUrl,
                    banner_url: finalBannerUrl,
                    theme: themeJson,
                })
                .eq("id", tenantId)
                .select();

            if (updateError) {
                throw new Error(updateError.message || "Error al actualizar");
            }

            logoFileRef.current = null;
            bannerFileRef.current = null;
            form.setValue("logo_url", finalLogoUrl || "");
            form.setValue("banner_url", finalBannerUrl || "");

            toast.success("¡Diseño guardado!");
            router.refresh();
        } catch (err: any) {
            toast.error("Error en el guardado", { description: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    // ─── Preview helpers ─────────────────────────────────────────────────────
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
            <header className="mb-10">
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Brand <span className="text-primary italic">Studio</span></h1>
                <p className="text-zinc-400">Personalizá la identidad visual de tu tienda.</p>
            </header>

            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">

                {/* ── Left Panel: Controles ── */}
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8 pb-24">

                    {/* Sección Identidad */}
                    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-6 backdrop-blur-xl">
                        <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-white">
                            <Store className="text-primary" size={20} /> Identidad
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-300">Nombre Comercial</label>
                                <input
                                    {...form.register("name")}
                                    className={`w-full rounded-xl border bg-zinc-950/50 px-4 py-3 text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${form.formState.errors.name ? "border-red-500/50 focus:ring-red-500" : "border-zinc-800"}`}
                                />
                                {form.formState.errors.name && <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>}
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                {/* Logo Upload */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-300">Logotipo</label>
                                    <div className="relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                                        <input
                                            type="file"
                                            onChange={(e) => { handleFileSelect(e, "logo_url"); (e.target as HTMLInputElement).value = ''; }}
                                            accept="image/png, image/jpeg, image/webp"
                                            className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                                            disabled={saving}
                                        />
                                        {watchValues.logo_url ? (
                                            <img src={watchValues.logo_url} alt="Logo" className="h-full w-full object-contain p-2" />
                                        ) : (
                                            <div className="flex flex-col items-center text-zinc-500">
                                                <ImageIcon size={28} className="mb-2 opacity-50" />
                                                <span className="text-xs font-medium">Subir Imagen</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Banner Upload */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-300">Banner de Portada</label>
                                    <div className="relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                                        <input
                                            type="file"
                                            onChange={(e) => { handleFileSelect(e, "banner_url"); (e.target as HTMLInputElement).value = ''; }}
                                            accept="image/png, image/jpeg, image/webp"
                                            className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                                            disabled={saving}
                                        />
                                        {watchValues.banner_url ? (
                                            <img src={watchValues.banner_url} alt="Banner" className="h-full w-full object-cover rounded-xl" />
                                        ) : (
                                            <div className="flex flex-col items-center text-zinc-500">
                                                <Upload size={28} className="mb-2 opacity-50" />
                                                <span className="text-xs font-medium">Fondo Hero</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección Apariencia */}
                    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-6 backdrop-blur-xl">
                        <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-white">
                            <Palette className="text-primary" size={20} /> Apariencia
                        </h2>

                        <div className="space-y-6">

                            {/* Modo Claro / Oscuro */}
                            <div>
                                <label className="mb-3 block text-sm font-medium text-zinc-300">Modo de la Tienda</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label
                                        className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${watchValues.theme_mode === "light"
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                            : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            value="light"
                                            {...form.register("theme_mode")}
                                            className="sr-only"
                                        />
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${watchValues.theme_mode === "light" ? "bg-primary/10" : "bg-zinc-800"}`}>
                                            <Sun size={20} className={watchValues.theme_mode === "light" ? "text-primary" : "text-zinc-500"} />
                                        </div>
                                        <div>
                                            <span className={`font-bold text-sm ${watchValues.theme_mode === "light" ? "text-primary" : "text-zinc-300"}`}>Claro</span>
                                            <p className="text-xs text-zinc-500">Fondo blanco, ideal para delivery diurno</p>
                                        </div>
                                    </label>

                                    <label
                                        className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${watchValues.theme_mode === "dark"
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                            : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            value="dark"
                                            {...form.register("theme_mode")}
                                            className="sr-only"
                                        />
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${watchValues.theme_mode === "dark" ? "bg-primary/10" : "bg-zinc-800"}`}>
                                            <Moon size={20} className={watchValues.theme_mode === "dark" ? "text-primary" : "text-zinc-500"} />
                                        </div>
                                        <div>
                                            <span className={`font-bold text-sm ${watchValues.theme_mode === "dark" ? "text-primary" : "text-zinc-300"}`}>Oscuro</span>
                                            <p className="text-xs text-zinc-500">Fondo negro, premium y moderno</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Color de Marca */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-zinc-300">Color de Marca</label>
                                <p className="mb-3 text-xs text-zinc-500">Se aplica a botones, bordes del logo, precios y acentos visuales.</p>
                                <div className="flex items-center gap-4">
                                    <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-zinc-800 shadow-inner cursor-pointer">
                                        <input
                                            type="color"
                                            value={watchValues.color_hex}
                                            onChange={(e) => form.setValue("color_hex", e.target.value, { shouldValidate: true, shouldDirty: true })}
                                            className="absolute -inset-4 h-24 w-28 cursor-pointer opacity-0"
                                        />
                                        <div
                                            className="pointer-events-none h-full w-full transition-colors"
                                            style={{ backgroundColor: watchValues.color_hex || "#10b981" }}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={watchValues.color_hex}
                                        onChange={(e) => form.setValue("color_hex", e.target.value, { shouldValidate: true, shouldDirty: true })}
                                        placeholder="#10b981"
                                        className={`flex-1 rounded-xl border bg-zinc-950/50 px-4 py-3 text-sm font-mono uppercase tracking-widest text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${form.formState.errors.color_hex ? "border-red-500/50" : "border-zinc-800"}`}
                                    />
                                </div>
                                {form.formState.errors.color_hex && <p className="mt-1 text-xs text-red-500">{form.formState.errors.color_hex.message}</p>}
                            </div>

                            {/* Tipografía */}
                            <div>
                                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
                                    <Type size={16} className="text-zinc-500" /> Tipografía
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { id: "font-sans", name: "Moderna", desc: "Sistémica, limpia" },
                                        { id: "font-serif", name: "Clásica", desc: "Elegante, tradicional" },
                                        { id: "font-mono", name: "Divertida", desc: "Técnica, llamativa" },
                                        { id: "font-urbana", name: "Urbana", desc: "Alto impacto, condensada" },
                                        { id: "font-artesanal", name: "Artesanal", desc: "Rústica, cálida" },
                                        { id: "font-vanguardia", name: "Vanguardia", desc: "Trendy, geométrica" },
                                    ].map((font) => (
                                        <label
                                            key={font.id}
                                            className={`relative flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all hover:bg-zinc-800/50 ${watchValues.font_family === font.id
                                                ? "border-primary bg-primary/5"
                                                : "border-zinc-800 bg-zinc-900/30"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                value={font.id}
                                                {...form.register("font_family")}
                                                className="sr-only"
                                            />
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-bold ${watchValues.font_family === font.id ? 'text-primary' : 'text-zinc-300'} ${font.id} ${font.id === 'font-urbana' ? 'uppercase' : ''}`}>
                                                    {font.name}
                                                </span>
                                                <span className="text-xs text-zinc-500">{font.desc}</span>
                                            </div>
                                            <div className={`h-4 w-4 rounded-full border-2 ${watchValues.font_family === font.id ? 'border-primary bg-primary' : 'border-zinc-600'}`} />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="sticky bottom-0 z-10 -mx-6 flex items-center justify-between border-t border-zinc-800/80 bg-zinc-950/80 p-5 px-6 backdrop-blur-3xl xl:static xl:mx-0 xl:border-none xl:bg-transparent xl:p-0 xl:backdrop-blur-none">
                        <p className="hidden text-sm text-zinc-500 xl:block">Guardá para ver los cambios reflejados.</p>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex w-full xl:w-auto items-center justify-center gap-2 px-10 py-4 text-base font-bold tracking-wide rounded-xl shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                            style={{
                                backgroundColor: brandColor,
                                color: brandTextOnAccent,
                            }}
                        >
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Publicar Cambios
                        </button>
                    </div>

                </form>

                {/* ── Right Panel: Live Mobile Preview ── */}
                <div className="relative hidden w-full lg:block">
                    <div className="sticky top-10 flex flex-col items-center">
                        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
                            <Smartphone size={16} /> Vista Previa
                        </div>

                        {/* Phone Frame */}
                        <div
                            className={`relative h-[780px] w-[375px] overflow-hidden rounded-[2.5rem] border-[8px] shadow-2xl ring-1 ring-zinc-800/50
                            ${isDark ? 'border-zinc-900 shadow-black/80' : 'border-zinc-200 shadow-zinc-300/50'}
                            ${watchValues.font_family}`}
                            style={{ backgroundColor: previewBg }}
                        >
                            {/* Notch */}
                            <div className={`absolute left-1/2 top-0 z-50 h-6 w-32 -translate-x-1/2 rounded-b-3xl ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'}`} />

                            <div className="h-full w-full overflow-y-auto pb-20 no-scrollbar [&::-webkit-scrollbar]:hidden transition-colors duration-500"
                                style={{ color: previewText }}
                            >
                                {/* Hero Banner */}
                                <div
                                    className="relative h-48 w-full bg-cover bg-center"
                                    style={{
                                        backgroundImage: watchValues.banner_url
                                            ? `url(${watchValues.banner_url})`
                                            : `linear-gradient(135deg, ${brandColor}30, transparent)`
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 bg-gradient-to-t to-transparent"
                                        style={{ backgroundImage: `linear-gradient(to top, ${previewBg}, transparent)` }}
                                    />
                                </div>

                                {/* Logo & Title */}
                                <div className="relative z-10 flex flex-col items-center px-4 pb-6">
                                    <div
                                        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-lg -mt-10 border-2"
                                        style={{
                                            borderColor: brandColor,
                                            backgroundColor: previewSurface,
                                        }}
                                    >
                                        {watchValues.logo_url ? (
                                            <img src={watchValues.logo_url} alt="Logo" className="h-full w-full object-contain" />
                                        ) : (
                                            <Store size={32} style={{ color: previewMuted }} />
                                        )}
                                    </div>

                                    {/* Open Badge */}
                                    <div className="mt-3">
                                        <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                            Abierto
                                        </span>
                                    </div>

                                    <h3 className={`mt-3 text-xl font-bold tracking-tight text-center px-4 leading-tight ${watchValues.font_family === 'font-urbana' ? 'uppercase' : ''}`}>
                                        {watchValues.name || "Mi Local"}
                                    </h3>

                                    {/* Info pills */}
                                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                                        {["Envío $500", "Retiro gratis"].map((pill) => (
                                            <span
                                                key={pill}
                                                className="px-2.5 py-1 rounded-full text-[9px] font-medium"
                                                style={{ backgroundColor: previewSurface, border: `1px solid ${previewBorder}`, color: previewMuted }}
                                            >
                                                {pill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Category Nav */}
                                <div className="flex gap-1 px-4 py-2 mb-2">
                                    {["Populares", "Combos", "Bebidas"].map((cat, i) => (
                                        <span
                                            key={cat}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                            style={i === 0
                                                ? { backgroundColor: `${brandColor}18`, color: brandColor }
                                                : { color: previewMuted }
                                            }
                                        >
                                            {cat}
                                        </span>
                                    ))}
                                </div>

                                {/* Fake Product Cards */}
                                <div className="px-4 space-y-3">
                                    {["Classic Smash Burger", "Papas con Cheddar"].map((name, i) => (
                                        <div
                                            key={i}
                                            className="flex items-stretch rounded-2xl overflow-hidden border transition-all"
                                            style={{ backgroundColor: previewSurface, borderColor: previewBorder }}
                                        >
                                            <div className="w-24 shrink-0" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}>
                                                <div className="h-full w-full flex items-center justify-center" style={{ color: `${brandColor}60` }}>
                                                    <span className="text-lg font-bold">{name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 p-3 flex flex-col justify-between">
                                                <div>
                                                    <h5 className="font-bold text-sm leading-tight mb-1">{name}</h5>
                                                    <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: previewMuted }}>
                                                        Doble medallón, doble cheddar, pan de papa.
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm font-extrabold" style={{ color: brandColor }}>
                                                        ${(8500 + i * 3000).toLocaleString("es-AR")}
                                                    </span>
                                                    <div
                                                        className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold"
                                                        style={{ backgroundColor: brandColor, color: brandTextOnAccent }}
                                                    >
                                                        <Plus size={16} strokeWidth={2.5} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Fake CTA */}
                                <div className="absolute bottom-6 left-5 right-5">
                                    <button
                                        className="w-full py-4 text-sm font-bold tracking-wide rounded-2xl shadow-lg flex items-center justify-between px-6"
                                        style={{ backgroundColor: brandColor, color: brandTextOnAccent }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/15 text-xs font-bold text-white">2</div>
                                            <span className="uppercase">Ver Pedido</span>
                                        </div>
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
