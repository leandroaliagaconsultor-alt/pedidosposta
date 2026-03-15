"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Palette, Save, Store, Image as ImageIcon, Smartphone, Type, Upload, X } from "lucide-react";

// ─── Schema ──────────────────────────────────────────────────────────────────

const brandSchema = z.object({
    name: z.string().min(2, "El nombre comercial es obligatorio"),
    color_hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color Inválido"),
    bg_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color Inválido").optional().or(z.literal("")),
    whatsapp_number: z.string().optional().nullable(),
    logo_url: z.string().optional().or(z.literal("")),
    banner_url: z.string().optional().or(z.literal("")),
    font_family: z.enum(["font-sans", "font-serif", "font-mono", "font-urbana", "font-artesanal", "font-vanguardia"]).default("font-sans"),
    template: z.enum(["midnight", "minimal", "brutalism", "retro-pop", "elegant-dark", "neon-cyber", "organic-earth", "fast-food", "glass-frost", "boutique", "urban-flow", "sweet-pastel"]).default("midnight"),
});

type BrandForm = z.infer<typeof brandSchema>;

const TEMPLATES = [
    { id: "midnight", name: "Midnight", desc: "Oscuro, Glassmorphism" },
    { id: "minimal", name: "Minimal", desc: "Blanco Libre, Limpio, Serif" },
    { id: "brutalism", name: "Brutalism", desc: "Contraste, Bordes duros" },
    { id: "elegant-dark", name: "Elegant Dark", desc: "Lujo, Bordes finos" },
    { id: "retro-pop", name: "Retro Pop", desc: "Años 90s, Sombras duras" },
    { id: "neon-cyber", name: "Neon Cyber", desc: "Glow Brillante, Oscuro" },
    { id: "organic-earth", name: "Organic Earth", desc: "Natural, Asimétrico" },
    { id: "fast-food", name: "Fast Food", desc: "Dinámico, Inclinado" },
    { id: "glass-frost", name: "Glass Frost", desc: "Minimalismo Translúcido" },
    { id: "boutique", name: "Boutique", desc: "Diseño de lujo, Serif clásico" },
    { id: "urban-flow", name: "Urban Flow", desc: "Street style, sombra dura" },
    { id: "sweet-pastel", name: "Sweet Pastel", desc: "Suave, moderno, orgánico" },
];

export default function BrandStudioProPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = use(params);
    const router = useRouter();
    const supabase = createClient();

    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Upload state (Deferred)
    const logoFileRef = useRef<File | null>(null);
    const bannerFileRef = useRef<File | null>(null);

    const form = useForm({
        resolver: zodResolver(brandSchema),
        defaultValues: {
            name: "",
            color_hex: "#10b981",
            bg_color: "",
            whatsapp_number: "",
            logo_url: "",
            banner_url: "",
            font_family: "font-sans",
            template: "midnight",
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
                    bg_color: themeData.bg_color || "",
                    whatsapp_number: data.whatsapp_number || "",
                    logo_url: data.logo_url || "",
                    banner_url: data.banner_url || "",
                    font_family: themeData.font_family || "font-sans",
                    template: themeData.template || "midnight",
                });
            }
            setLoading(false);
        };
        fetchTenant();
    }, [supabase, tenant, form]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "logo_url" | "banner_url") => {
        const file = e.target.files?.[0];
        if (!file || !tenantId) return;

        // Guardar archivo en referencia para subida diferida
        if (fieldName === "logo_url") {
            logoFileRef.current = file;
        } else {
            bannerFileRef.current = file;
        }

        // Preview local instantánea
        const objectUrl = URL.createObjectURL(file);
        form.setValue(fieldName, objectUrl, { shouldValidate: true, shouldDirty: true });
    };

    const onSubmit = async (data: BrandForm) => {
        if (!tenantId) return;
        setSaving(true);
        console.log('Iniciando guardado...', { logoFileRef: logoFileRef.current, bannerFileRef: bannerFileRef.current });

        try {
            let finalLogoUrl = data.logo_url;
            let finalBannerUrl = data.banner_url;

            // 1. Fase de subida estricta si hay archivos nuevos
            if (logoFileRef.current) {
                const fileExt = logoFileRef.current.name.split('.').pop() || 'tmp';
                const fileName = `${tenantId}/logo-${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('tenant-assets')
                    .upload(fileName, logoFileRef.current, { upsert: true });

                console.log('Resultado Storage (Logo):', { data: uploadData, error: uploadError });

                if (uploadError) {
                    console.error('Error Storage Logo:', uploadError);
                    toast.error(uploadError.message || 'Error desconocido subiendo logo');
                    setSaving(false);
                    return; // 2. Detener ejecución
                }

                // 3. Obtener URL pública
                const { data: publicData } = supabase.storage
                    .from('tenant-assets')
                    .getPublicUrl(fileName);
                console.log('URL Pública obtenida (Logo):', publicData.publicUrl);
                finalLogoUrl = publicData.publicUrl;
            }

            if (bannerFileRef.current) {
                const fileExt = bannerFileRef.current.name.split('.').pop() || 'tmp';
                const fileName = `${tenantId}/banner-${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('tenant-assets')
                    .upload(fileName, bannerFileRef.current, { upsert: true });

                console.log('Resultado Storage (Banner):', { data: uploadData, error: uploadError });

                if (uploadError) {
                    console.error('Error Storage Banner:', uploadError);
                    toast.error(uploadError.message || 'Error desconocido subiendo banner');
                    setSaving(false);
                    return; // 2. Detener ejecución
                }

                // 3. Obtener URL pública
                const { data: publicData } = supabase.storage
                    .from('tenant-assets')
                    .getPublicUrl(fileName);
                console.log('URL Pública obtenida (Banner):', publicData.publicUrl);
                finalBannerUrl = publicData.publicUrl;
            }

            const themeJson = {
                font_family: data.font_family,
                template: data.template,
                bg_color: data.bg_color,
            };

            // 4. Hacer UPDATE a base de datos (último paso)
            const { data: updateData, error: updateError } = await supabase
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
                console.error('Error Database Update:', updateError);
                throw new Error(updateError.message || "Error al actualizar la base de datos");
            }

            console.log('Resultado Update Tenant:', { updateData });

            // Limpieza de referencias
            logoFileRef.current = null;
            bannerFileRef.current = null;
            form.setValue("logo_url", finalLogoUrl || "");
            form.setValue("banner_url", finalBannerUrl || "");

            toast.success("¡Diseño Guardado Exitosamente!");
            router.refresh();
        } catch (err: any) {
            console.error('Error fatal catch:', err);
            toast.error("Error inesperado en el guardado", { description: err.message });
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

    // ─── Helpers rendering ───────────────────────────────────────────────────

    const getAppBackground = (template: string, customBg?: string) => {
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

    const isLightBg = (template: string) => {
        const lightTemplates = ['brutalism', 'minimal', 'glass-frost', 'organic-earth', 'retro-pop', 'fast-food', 'urban-flow', 'sweet-pastel'];
        return lightTemplates.includes(template);
    };

    const currentBg = getAppBackground(watchValues.template || "midnight", watchValues.bg_color);
    const lightTextMode = !isLightBg(watchValues.template || "midnight");

    const getCardClasses = (t: string) => {
        let base = "flex gap-4 p-4 transition-all duration-300 relative overflow-hidden ";
        switch (t) {
            case 'midnight': return base + "rounded-2xl bg-zinc-900/50 border border-zinc-800/50 text-white";
            case 'minimal': return base + "rounded-2xl bg-white border border-zinc-200 shadow-sm text-zinc-900";
            case 'brutalism': return base + "rounded-none bg-white border-4 border-black shadow-[4px_4px_0px_black] text-black";
            case 'retro-pop': return base + "rounded-3xl bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)] text-black";
            case 'elegant-dark': return base + "rounded-none bg-black/40 border border-white/10 text-white backdrop-blur-md";
            case 'neon-cyber': return base + "rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100";
            case 'organic-earth': return base + "rounded-tl-2xl rounded-br-2xl rounded-tr-md rounded-bl-md bg-[#fefcf8] shadow-[0_4px_20px_rgb(0,0,0,0.05)] text-amber-950";
            case 'fast-food': return base + "rounded-2xl bg-white shadow-xl text-black border border-zinc-100";
            case 'glass-frost': return base + "rounded-3xl bg-white/40 backdrop-blur-md border border-white/80 text-zinc-900 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]";
            case 'boutique': return base + "border-[0.5px] border-zinc-700/50 rounded-lg bg-zinc-900/80 text-white font-serif";
            case 'urban-flow': return base + "border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white text-zinc-900 uppercase font-sans";
            case 'sweet-pastel': return base + "rounded-3xl shadow-xl shadow-zinc-900/5 bg-white text-zinc-800";
            default: return base + "rounded-xl";
        }
    };

    const getButtonStyles = (t: string, primaryColor: string) => {
        if (t === 'elegant-dark') return { borderColor: primaryColor, color: primaryColor };
        if (t === 'neon-cyber') return { backgroundColor: primaryColor, boxShadow: `0 0 15px ${primaryColor}80`, color: '#000' };
        if (t === 'brutalism' || t === 'retro-pop' || t === 'urban-flow') return { backgroundColor: primaryColor, color: '#000' };
        return { backgroundColor: primaryColor, color: '#fff' };
    };

    const getButtonClasses = (t: string) => {
        let base = "flex h-8 w-8 items-center justify-center font-bold transition-all duration-300 ";

        switch (t) {
            case 'brutalism': return base + "rounded-none border-2 border-black shadow-[2px_2px_0px_black]";
            case 'retro-pop': return base + "rounded-full border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none";
            case 'elegant-dark': return base + "rounded-none border backdrop-blur-sm bg-transparent";
            case 'neon-cyber': return base + "rounded-xl";
            case 'boutique': return base + "rounded-md border border-current bg-transparent";
            case 'urban-flow': return base + "rounded-none border-2 border-zinc-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase";
            case 'sweet-pastel': return base + "rounded-3xl shadow-md";
            case 'organic-earth': return base + `rounded-tl-[10px] rounded-br-[10px] rounded-tr-[4px] rounded-bl-[4px] shadow-sm`;
            case 'fast-food': return base + "rounded-xl -skew-x-6 shadow-md";
            case 'glass-frost': return base + `rounded-full backdrop-blur-xl bg-white/50 border border-white shadow-sm font-semibold !text-zinc-900`;
            case 'minimal': return base + "rounded-xl shadow-sm";
            case 'midnight':
            default: return base + "rounded-full shadow-lg";
        }
    };

    const getCTAClasses = (t: string) => {
        let base = "w-full py-4 text-sm font-black tracking-widest transition-all duration-300 ";

        switch (t) {
            case 'brutalism': return base + "rounded-none border-4 border-black shadow-[4px_4px_0px_black]";
            case 'retro-pop': return base + "rounded-full border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]";
            case 'elegant-dark': return base + "rounded-none border backdrop-blur-md bg-black/40";
            case 'neon-cyber': return base + "rounded-xl font-mono";
            case 'boutique': return base + "rounded-none border-[0.5px] border-current bg-transparent font-serif hover:bg-zinc-900";
            case 'urban-flow': return base + "rounded-none border-2 border-zinc-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase font-sans tracking-widest";
            case 'sweet-pastel': return base + "rounded-full shadow-lg hover:shadow-xl font-bold";
            case 'organic-earth': return base + `rounded-tl-2xl rounded-br-2xl rounded-tr-md rounded-bl-md shadow-lg`;
            case 'fast-food': return base + "rounded-xl -skew-x-6 italic shadow-xl border-b-4 border-black/20";
            case 'glass-frost': return base + `rounded-full backdrop-blur-xl bg-white/40 border border-white shadow-xl !text-zinc-900`;
            case 'minimal': return base + "rounded-xl shadow-sm";
            case 'midnight':
            default: return base + "rounded-full shadow-lg";
        }
    };

    return (
        <div className="h-full w-full max-w-7xl mx-auto">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Brand <span className="text-primary italic">Studio Pro</span> V2</h1>
                    <p className="text-zinc-400">Personaliza la experiencia visual completa de tu tienda en línea.</p>
                </div>
            </header>

            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">

                {/* ── Left Panel: Controles ── */}
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8 pb-24">

                    {/* Sección Identidad */}
                    <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/20 p-6 backdrop-blur-xl xl:p-8">
                        <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-white">
                            <Store className="text-primary" size={24} /> Identidad Básica
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-300">Nombre Comercial</label>
                                <input
                                    {...form.register("name")}
                                    className={`w-full rounded-xl border bg-zinc-950/50 px-4 py-3 text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${form.formState.errors.name ? "border-red-500/50 focus:ring-red-500" : "border-zinc-800"}`}
                                />
                                {form.formState.errors.name && <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>}
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Logo Upload */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-zinc-300">Logotipo</label>
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
                                    <label className="mb-2 block text-sm font-semibold text-zinc-300">Banner de Portada</label>
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
                    <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/20 p-6 backdrop-blur-xl xl:p-8">
                        <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-white">
                            <Palette className="text-primary" size={24} /> Estilismo & Temas V2
                        </h2>

                        <div className="space-y-8">

                            {/* Plantilla Selector */}
                            <div>
                                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                                    <Store size={16} className="text-zinc-500" /> Plantilla Visual Pro (Layout Theme)
                                </label>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {TEMPLATES.map((tpl) => (
                                        <label
                                            key={tpl.id}
                                            className={`relative flex cursor-pointer flex-col p-4 rounded-xl border transition-all hover:bg-zinc-800/50 ${watchValues.template === tpl.id
                                                ? "border-primary bg-primary/5"
                                                : "border-zinc-800 bg-zinc-900/30"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                value={tpl.id}
                                                {...form.register("template")}
                                                className="sr-only"
                                            />
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`font-bold ${watchValues.template === tpl.id ? 'text-primary' : 'text-zinc-300'}`}>
                                                    {tpl.name}
                                                </span>
                                                <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${watchValues.template === tpl.id ? 'border-primary bg-primary' : 'border-zinc-600'}`} />
                                            </div>
                                            <span className="text-xs text-zinc-500">{tpl.desc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Color Selector Primario */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-zinc-300">Color Primario (Acentos)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-zinc-800 shadow-inner group cursor-pointer">
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

                                {/* Color Selector Fondo Personalizado */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-zinc-300">Fondo Custom (Opcional)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-zinc-800 shadow-inner group cursor-pointer">
                                            <input
                                                type="color"
                                                value={watchValues.bg_color || "#09090b"}
                                                onChange={(e) => form.setValue("bg_color", e.target.value, { shouldValidate: true, shouldDirty: true })}
                                                className="absolute -inset-4 h-24 w-28 cursor-pointer opacity-0"
                                            />
                                            <div
                                                className="pointer-events-none h-full w-full transition-colors"
                                                style={{ backgroundColor: watchValues.bg_color || "#09090b" }}
                                            />
                                        </div>
                                        <div className="flex flex-1 relative">
                                            <input
                                                type="text"
                                                value={watchValues.bg_color ?? ""}
                                                onChange={(e) => form.setValue("bg_color", e.target.value, { shouldValidate: true, shouldDirty: true })}
                                                placeholder="Por defecto"
                                                className={`w-full rounded-xl border bg-zinc-950/50 px-4 py-3 text-sm font-mono uppercase tracking-widest text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${form.formState.errors.bg_color ? "border-red-500/50" : "border-zinc-800"}`}
                                            />
                                            {watchValues.bg_color && (
                                                <button
                                                    type="button"
                                                    onClick={() => form.setValue("bg_color", "", { shouldDirty: true })}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-red-400"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {form.formState.errors.bg_color && <p className="mt-1 text-xs text-red-500">{form.formState.errors.bg_color.message}</p>}
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Tipografía */}
                                <div>
                                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                                        <Type size={16} className="text-zinc-500" /> Tipografía del Local
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: "font-sans", name: "Moderna", desc: "Sistémica, limpia" },
                                            { id: "font-serif", name: "Clásica", desc: "Elegante, tradicional" },
                                            { id: "font-mono", name: "Divertida", desc: "Técnica, llamativa" },
                                            { id: "font-urbana", name: "Urbana", desc: "Alto impacto, condensada. Ideal burgers y birra." },
                                            { id: "font-artesanal", name: "Artesanal", desc: "Rústica, cálida. Ideal horno de barro y masa madre." },
                                            { id: "font-vanguardia", name: "Vanguardia", desc: "Trendy, geométrica. Ideal café de especialidad." },
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
                    </div>

                    {/* Fixed Save Button for Mobile / Standard Save */}
                    <div className="sticky bottom-0 z-10 -mx-6 flex items-center justify-between border-t border-zinc-800/80 bg-zinc-950/80 p-5 px-6 backdrop-blur-3xl xl:static xl:mx-0 xl:border-none xl:bg-transparent xl:p-0 xl:backdrop-blur-none">
                        <p className="hidden text-sm text-zinc-500 xl:block">Guardá para ver los cambios reflejados públicamente.</p>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex w-full xl:w-auto items-center justify-center gap-2 px-10 py-4 text-base font-black tracking-widest text-black shadow-[0_0_30px_var(--btn-glow)] transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 theme-btn-style`}
                            style={{
                                backgroundColor: watchValues.color_hex || "#10b981",
                                '--btn-glow': `${watchValues.color_hex || "#10b981"}50`
                            } as React.CSSProperties}
                        >
                            {saving ? <Loader2 size={20} className="animate-spin text-black" /> : <Save size={20} className="text-black" />}
                            PUBLICAR STOREFRONT
                        </button>
                    </div>

                </form>

                {/* ── Right Panel: Live Mobile Preview ── */}
                <div className="relative hidden w-full lg:block">
                    <div className="sticky top-10 flex flex-col items-center">
                        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest">
                            <Smartphone size={16} /> Beta Preview Engine V2
                        </div>

                        {/* Celular Fake */}
                        <div
                            className={`relative h-[780px] w-[375px] overflow-hidden rounded-[2.5rem] border-[8px] shadow-2xl ring-1 ring-zinc-800/50 
                            ${lightTextMode ? 'border-zinc-900 shadow-black/80' : 'border-zinc-200 shadow-zinc-300/50'}
                            ${watchValues.font_family}`}
                            style={{ backgroundColor: currentBg }}
                        >
                            {/* Notch Fake */}
                            <div className={`absolute left-1/2 top-0 z-50 h-6 w-32 -translate-x-1/2 rounded-b-3xl ${lightTextMode ? 'bg-zinc-900' : 'bg-zinc-200'}`} />

                            <div className={`h-full w-full overflow-y-auto pb-20 no-scrollbar [&::-webkit-scrollbar]:hidden transition-colors duration-500
                                ${lightTextMode ? 'text-zinc-50' : 'text-zinc-900'}
                            `}>

                                {/* Hero Banner */}
                                <div
                                    className="relative h-48 w-full bg-cover bg-center transition-all duration-300 mix-blend-luminosity opacity-80"
                                    style={{
                                        backgroundImage: watchValues.banner_url ? `url(${watchValues.banner_url})` : `linear-gradient(to bottom, ${watchValues.color_hex}90, transparent)`
                                    }}
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-t to-transparent`}
                                        style={{ backgroundImage: `linear-gradient(to top, ${currentBg}, transparent)` }}
                                    />
                                </div>

                                {/* Logo & Título */}
                                <div className="relative z-10 flex flex-col items-center px-4 pb-6">
                                    <div className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-full shadow-2xl outline outline-4 outline-offset-0 -mt-10 ${lightTextMode ? 'bg-zinc-900 outline-zinc-950 text-white' : 'bg-white outline-white text-black'}`}>
                                        {watchValues.logo_url ? (
                                            <img src={watchValues.logo_url} alt="Logo" className="h-full w-full object-contain" />
                                        ) : (
                                            <Store size={32} className="opacity-50" />
                                        )}
                                    </div>
                                    <h3 className={`mt-3 text-xl font-extrabold tracking-tight drop-shadow-md text-center px-4 leading-tight ${watchValues.font_family === 'font-urbana' ? 'uppercase' : ''}`}>
                                        {watchValues.name || "Mi Local"}
                                    </h3>
                                </div>

                                {/* Menu Fake */}
                                <div className="mt-2 px-5 space-y-4">
                                    <h4 className="text-lg font-bold mb-4 drop-shadow-sm">Populares</h4>

                                    {[1, 2].map(i => {
                                        let titleClasses = "font-bold text-base leading-tight mb-1 ";
                                        if (watchValues.template === 'fast-food') titleClasses += "italic font-black text-lg";

                                        return (
                                            <div key={i} className={getCardClasses(watchValues.template || "midnight")}>
                                                <div className={`h-20 w-20 shrink-0 rounded-xl overflow-hidden animate-pulse ${lightTextMode ? 'bg-zinc-800/80' : 'bg-zinc-200'}`}>
                                                    <div className="w-full h-full bg-black/10 mix-blend-overlay" />
                                                </div>
                                                <div className="flex flex-1 flex-col justify-between py-1">
                                                    <div>
                                                        <h5 className={titleClasses}>Classic Smash Burger</h5>
                                                        <p className={`line-clamp-2 text-xs leading-relaxed ${lightTextMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                                            Doble medallón, doble cheddar, pan de papa y salsa secreta.
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-sm font-bold font-mono">$ 8500</span>
                                                        <button
                                                            className={getButtonClasses(watchValues.template || "midnight")}
                                                            style={getButtonStyles(watchValues.template || "midnight", watchValues.color_hex || "#10b981")}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Fake CTA Final */}
                                <div className="absolute bottom-6 left-5 right-5">
                                    <button
                                        className={getCTAClasses(watchValues.template || "midnight")}
                                        style={getButtonStyles(watchValues.template || "midnight", watchValues.color_hex || "#10b981")}
                                    >
                                        VER MI PEDIDO ($ 17.000)
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Fin Celular */}
                    </div>
                </div>

            </div>
        </div >
    );
}
