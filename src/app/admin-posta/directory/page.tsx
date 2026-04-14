"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";
import {
    Plus, X, Save, Trash2, Eye, EyeOff, Clock, MapPin,
    Store, ArrowLeft, ExternalLink, MousePointerClick, Upload, Loader2,
} from "lucide-react";
import Link from "next/link";

import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
    monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
    thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
};

type OpeningHours = Record<string, { start: string; end: string }[]>;

interface FormData {
    name: string;
    description: string;
    categories: string[];
    city: string;
    type: "saas" | "directory";
    is_directory_active: boolean;
    external_url: string;
    logo_url: string;
    opening_hours: OpeningHours;
}

const emptyForm: FormData = {
    name: "",
    description: "",
    categories: [],
    city: "mercedes",
    type: "directory",
    is_directory_active: true,
    external_url: "",
    logo_url: "",
    opening_hours: {},
};

export default function DirectoryAdminPage() {
    const supabase = createClient();
    const [tenants, setTenants] = useState<any[]>([]);
    const [clicks, setClicks] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [cities, setCities] = useState<any[]>([]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { toast.error("Solo imágenes (JPG, PNG, WebP)"); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB"); return; }

        setUploadingLogo(true);
        const ext = file.name.split(".").pop() || "png";
        const fileName = `directory-logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage.from("tenant-assets").upload(fileName, file, { upsert: true });
        if (uploadError) { toast.error("Error al subir: " + uploadError.message); setUploadingLogo(false); return; }

        const { data: publicData } = supabase.storage.from("tenant-assets").getPublicUrl(fileName);
        setForm(p => ({ ...p, logo_url: publicData.publicUrl }));
        setUploadingLogo(false);
        toast.success("Logo subido");
    };

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: tenantsData } = await supabase
            .from("tenants")
            .select("*")
            .order("type", { ascending: true })
            .order("name", { ascending: true });
        if (tenantsData) setTenants(tenantsData);

        // Fetch cities
        const { data: citiesData } = await supabase.from("directory_cities").select("*").eq("is_active", true).order("name");
        if (citiesData) setCities(citiesData);

        // Aggregate clicks per tenant (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: clicksData } = await supabase
            .from("directory_clicks")
            .select("tenant_id")
            .gte("clicked_at", thirtyDaysAgo);

        if (clicksData) {
            const map: Record<string, number> = {};
            clicksData.forEach((c: any) => { map[c.tenant_id] = (map[c.tenant_id] || 0) + 1; });
            setClicks(map);
        }
        setLoading(false);
    };

    const openNew = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (tenant: any) => {
        const cats = tenant.categories?.length > 0 ? tenant.categories : (tenant.category ? [tenant.category] : []);
        setForm({
            name: tenant.name || "",
            description: tenant.description || "",
            categories: cats,
            city: tenant.city || "mercedes",
            type: tenant.type || "directory",
            is_directory_active: tenant.is_directory_active ?? true,
            external_url: tenant.external_url || "",
            logo_url: tenant.logo_url || "",
            opening_hours: tenant.opening_hours || {},
        });
        setEditingId(tenant.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
        setSaving(true);

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            categories: form.categories.length > 0 ? form.categories : null,
            category: form.categories[0] || "otros",  // backward compat
            city: form.city.toLowerCase().trim(),
            type: form.type,
            is_directory_active: form.is_directory_active,
            external_url: form.external_url.trim() || null,
            logo_url: form.logo_url.trim() || null,
            opening_hours: Object.keys(form.opening_hours).length > 0 ? form.opening_hours : null,
        };

        if (editingId) {
            const { error } = await supabase.from("tenants").update(payload).eq("id", editingId);
            if (error) { toast.error("Error: " + error.message); setSaving(false); return; }
            toast.success("Local actualizado");
        } else {
            // Crear nuevo tenant de directorio con slug auto-generado
            const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const { error } = await supabase.from("tenants").insert({ ...payload, slug });
            if (error) { toast.error("Error: " + error.message); setSaving(false); return; }
            toast.success("Local creado");
        }

        setSaving(false);
        setShowForm(false);
        fetchData();
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar "${name}" del directorio? Esta acción no se puede deshacer.`)) return;
        const { error } = await supabase.from("tenants").delete().eq("id", id);
        if (error) { toast.error("Error: " + error.message); return; }
        toast.success("Local eliminado");
        fetchData();
    };

    const updateHour = (day: string, field: "start" | "end", value: string) => {
        setForm(prev => {
            const hours = { ...prev.opening_hours };
            if (!hours[day]) hours[day] = [{ start: "", end: "" }];
            hours[day] = [{ ...hours[day][0], [field]: value }];
            return { ...prev, opening_hours: hours };
        });
    };

    const toggleDay = (day: string) => {
        setForm(prev => {
            const hours = { ...prev.opening_hours };
            if (hours[day]) { delete hours[day]; } else { hours[day] = [{ start: "19:00", end: "23:30" }]; }
            return { ...prev, opening_hours: hours };
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-primary" />
            </div>
        );
    }

    const directoryTenants = tenants.filter(t => t.type === "directory");
    const saasInDirectory = tenants.filter(t => t.type === "saas" && t.is_directory_active);

    return (
        <div className="space-y-6 animate-in fade-in">
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link href="/admin-posta" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white mb-2 transition">
                        <ArrowLeft size={12} /> Volver al panel
                    </Link>
                    <h1 className="text-2xl font-extrabold tracking-tight">Directorio Gastronómico</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {directoryTenants.length} locales de directorio · {saasInDirectory.length} clientes SaaS visibles
                    </p>
                </div>
                <button onClick={openNew} className="inline-flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl hover:brightness-110 transition shrink-0">
                    <Plus size={16} /> Agregar Local
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Total Locales</p>
                    <p className="text-2xl font-black text-white mt-1">{tenants.length}</p>
                </div>
                <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Directorio</p>
                    <p className="text-2xl font-black text-amber-400 mt-1">{directoryTenants.length}</p>
                </div>
                <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Clientes SaaS</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">{tenants.filter(t => t.type === "saas").length}</p>
                </div>
                <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Clics (30d)</p>
                    <p className="text-2xl font-black text-sky-400 mt-1">{Object.values(clicks).reduce((a, b) => a + b, 0)}</p>
                </div>
            </div>

            {/* Listing Table */}
            <div className="rounded-2xl border border-zinc-800 bg-[#09090b] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-900 text-[10px] uppercase font-extrabold tracking-widest text-zinc-500">
                            <tr>
                                <th className="px-4 py-3">Local</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3">Ciudad</th>
                                <th className="px-4 py-3">Clics 30d</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {tenants.map(t => (
                                <tr key={t.id} className="hover:bg-zinc-900/40 transition-colors">
                                    <td className="px-4 py-3 font-bold text-white flex items-center gap-2.5">
                                        {t.logo_url ? (
                                            <img src={t.logo_url} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500">{t.name?.charAt(0)}</div>
                                        )}
                                        <div>
                                            <p className="text-sm">{t.name}</p>
                                            {t.slug && <p className="text-[10px] text-zinc-600 font-mono">/{t.slug}</p>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                            t.type === "saas" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        }`}>
                                            {t.type === "saas" ? "SaaS" : "Directorio"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400 text-xs">{(t.categories?.length > 0 ? t.categories : [t.category]).map((c: string) => CATEGORY_MAP[c]?.label || c).join(", ") || "—"}</td>
                                    <td className="px-4 py-3 text-zinc-400 text-xs capitalize">{t.city || "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1 text-xs font-mono text-sky-400">
                                            <MousePointerClick size={11} /> {clicks[t.id] || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {t.is_directory_active ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400"><Eye size={11} /> Visible</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-600"><EyeOff size={11} /> Oculto</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-1">
                                        <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition" title="Editar">
                                            <Store size={13} />
                                        </button>
                                        {t.type === "directory" && (
                                            <button onClick={() => handleDelete(t.id, t.name)} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition" title="Eliminar">
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── FORM MODAL ── */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
                    <div className="w-full max-w-xl my-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                            <h3 className="font-extrabold text-lg">{editingId ? "Editar Local" : "Nuevo Local"}</h3>
                            <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Name */}
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Nombre del Local *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none"
                                    placeholder="Ej: Burger King Mercedes"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Descripción Corta</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none resize-none"
                                    rows={2}
                                    placeholder="Las mejores hamburguesas artesanales de Mercedes"
                                />
                            </div>

                            {/* Categories (multi-select) */}
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Categorías (seleccioná una o más)</label>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                    {CATEGORIES.map(c => {
                                        const selected = form.categories.includes(c.key);
                                        return (
                                            <button
                                                key={c.key}
                                                type="button"
                                                onClick={() => setForm(p => ({
                                                    ...p,
                                                    categories: selected
                                                        ? p.categories.filter(k => k !== c.key)
                                                        : [...p.categories, c.key],
                                                }))}
                                                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                                                    selected
                                                        ? "bg-primary/15 text-primary border border-primary/30"
                                                        : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                                                }`}
                                            >
                                                <span>{c.emoji}</span> {c.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* City */}
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ciudad</label>
                                <select
                                    value={form.city}
                                    onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                                    className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none"
                                >
                                    <option value="">Seleccionar ciudad</option>
                                    {cities.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Type + Active */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tipo</label>
                                    <div className="flex gap-2 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, type: "saas" }))}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${form.type === "saas" ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-zinc-900 text-zinc-500 border border-zinc-800"}`}
                                        >
                                            SaaS
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, type: "directory" }))}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${form.type === "directory" ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30" : "bg-zinc-900 text-zinc-500 border border-zinc-800"}`}
                                        >
                                            Directorio
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Visible en Directorio</label>
                                    <button
                                        type="button"
                                        onClick={() => setForm(p => ({ ...p, is_directory_active: !p.is_directory_active }))}
                                        className={`mt-1 w-full py-2 rounded-lg text-xs font-bold transition ${form.is_directory_active ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-zinc-900 text-zinc-500 border border-zinc-800"}`}
                                    >
                                        {form.is_directory_active ? "Activo" : "Oculto"}
                                    </button>
                                </div>
                            </div>

                            {/* External URL */}
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Link de Pedido (WhatsApp / Web / Instagram)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <ExternalLink size={14} className="text-zinc-600 shrink-0" />
                                    <input
                                        value={form.external_url}
                                        onChange={e => setForm(p => ({ ...p, external_url: e.target.value }))}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none"
                                        placeholder="https://wa.me/5491100000000"
                                    />
                                </div>
                                <p className="text-[9px] text-zinc-600 mt-1">Para locales SaaS se usa su menú en PedidosPosta. Este campo es para locales de directorio.</p>
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Logo del Local</label>
                                <div className="mt-2 flex items-center gap-4">
                                    {/* Preview */}
                                    {form.logo_url ? (
                                        <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-zinc-800" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">
                                            Sin logo
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed cursor-pointer transition ${
                                            uploadingLogo ? "border-zinc-700 bg-zinc-900 text-zinc-500" : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-primary hover:text-primary"
                                        }`}>
                                            {uploadingLogo ? (
                                                <><Loader2 size={14} className="animate-spin" /> Subiendo...</>
                                            ) : (
                                                <><Upload size={14} /> Subir imagen</>
                                            )}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                                        </label>
                                        <p className="text-[9px] text-zinc-600 mt-1">JPG, PNG o WebP · Máx 5MB</p>
                                    </div>
                                    {form.logo_url && (
                                        <button type="button" onClick={() => setForm(p => ({ ...p, logo_url: "" }))} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 transition" title="Quitar logo">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Opening Hours */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={14} className="text-zinc-500" />
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Horarios de Apertura</label>
                                </div>
                                <div className="space-y-2">
                                    {DAYS.map(day => {
                                        const active = !!form.opening_hours[day];
                                        const hours = form.opening_hours[day]?.[0];
                                        return (
                                            <div key={day} className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleDay(day)}
                                                    className={`w-20 text-left px-2 py-1.5 rounded-lg text-[10px] font-bold transition ${active ? "bg-primary/20 text-primary" : "bg-zinc-900 text-zinc-600 border border-zinc-800"}`}
                                                >
                                                    {DAY_LABELS[day]}
                                                </button>
                                                {active ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="time"
                                                            value={hours?.start || ""}
                                                            onChange={e => updateHour(day, "start", e.target.value)}
                                                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:border-primary outline-none"
                                                        />
                                                        <span className="text-zinc-600 text-xs">a</span>
                                                        <input
                                                            type="time"
                                                            value={hours?.end || ""}
                                                            onChange={e => updateHour(day, "end", e.target.value)}
                                                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:border-primary outline-none"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-700">Cerrado</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Save */}
                        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-sm font-bold hover:bg-zinc-700 transition">
                                Cancelar
                            </button>
                            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-black text-sm font-bold hover:brightness-110 transition disabled:opacity-50">
                                <Save size={14} /> {saving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
