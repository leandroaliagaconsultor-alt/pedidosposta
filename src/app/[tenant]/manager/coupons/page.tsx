"use client";

import React, { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";
import { Plus, X, Save, Trash2, Tag, Percent, DollarSign, Copy, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Coupon {
    id: string;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    min_order: number;
    max_uses: number | null;
    used_count: number;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
}

export default function CouponsPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = use(params);
    const supabase = createClient();

    const [tenantId, setTenantId] = useState<string | null>(null);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [code, setCode] = useState("");
    const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
    const [discountValue, setDiscountValue] = useState("");
    const [minOrder, setMinOrder] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [expiresAt, setExpiresAt] = useState("");

    useEffect(() => {
        supabase.from("tenants").select("id").eq("slug", tenant).single()
            .then(({ data }: { data: any }) => { if (data) { setTenantId(data.id); fetchCoupons(data.id); } });
    }, [supabase, tenant]);

    const fetchCoupons = async (tid: string) => {
        setLoading(true);
        const { data } = await supabase.from("coupons").select("*").eq("tenant_id", tid).order("created_at", { ascending: false });
        if (data) setCoupons(data as Coupon[]);
        setLoading(false);
    };

    const resetForm = () => {
        setCode(""); setDiscountType("percentage"); setDiscountValue(""); setMinOrder(""); setMaxUses(""); setExpiresAt(""); setShowForm(false);
    };

    const handleSave = async () => {
        if (!tenantId || !code.trim() || !discountValue) { toast.error("Código y descuento son obligatorios"); return; }
        setSaving(true);
        const { error } = await supabase.from("coupons").insert({
            tenant_id: tenantId,
            code: code.trim().toUpperCase().replace(/\s/g, ""),
            discount_type: discountType,
            discount_value: Number(discountValue),
            min_order: Number(minOrder) || 0,
            max_uses: maxUses ? Number(maxUses) : null,
            expires_at: expiresAt || null,
            is_active: true,
        });
        if (error) { toast.error(error.message.includes("duplicate") ? "Ya existe un cupón con ese código" : error.message); }
        else { toast.success("Cupón creado"); resetForm(); fetchCoupons(tenantId); }
        setSaving(false);
    };

    const toggleActive = async (id: string, current: boolean) => {
        await supabase.from("coupons").update({ is_active: !current }).eq("id", id);
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
        toast.success(!current ? "Cupón activado" : "Cupón desactivado");
    };

    const deleteCoupon = async (id: string) => {
        if (!confirm("¿Eliminar este cupón?")) return;
        await supabase.from("coupons").delete().eq("id", id);
        setCoupons(prev => prev.filter(c => c.id !== id));
        toast.success("Cupón eliminado");
    };

    const copyCode = (c: string) => { navigator.clipboard.writeText(c); toast.success("Código copiado"); };

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-t-2 border-primary" /></div>;

    return (
        <div>
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Cupones <span className="text-primary">& Descuentos</span></h1>
                    <p className="mt-1 text-sm text-zinc-400">Creá códigos de descuento para tus clientes.</p>
                </div>
                <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl hover:brightness-110 transition shrink-0">
                    <Plus size={16} /> Nuevo Cupón
                </button>
            </div>

            {/* Coupons list */}
            {coupons.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-zinc-800 bg-zinc-900/30">
                    <Tag size={40} className="mx-auto mb-3 text-zinc-700" />
                    <p className="text-zinc-500 text-sm font-medium">No tenés cupones creados todavía.</p>
                    <p className="text-zinc-600 text-xs mt-1">Creá tu primer código de descuento para atraer clientes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map(c => {
                        const expired = c.expires_at && new Date(c.expires_at) < new Date();
                        const exhausted = c.max_uses && c.used_count >= c.max_uses;
                        const active = c.is_active && !expired && !exhausted;

                        return (
                            <div key={c.id} className={`rounded-2xl border p-5 transition ${active ? "border-primary/30 bg-zinc-900/40" : "border-zinc-800 bg-zinc-900/20 opacity-60"}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => copyCode(c.code)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition" title="Copiar código">
                                            <Tag size={13} className="text-primary" />
                                            <span className="text-sm font-mono font-bold text-white tracking-wider">{c.code}</span>
                                            <Copy size={11} className="text-zinc-500" />
                                        </button>
                                    </div>
                                    <button onClick={() => deleteCoupon(c.id)} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition">
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex items-baseline gap-1 mb-2">
                                    {c.discount_type === "percentage" ? (
                                        <><span className="text-3xl font-black text-primary">{c.discount_value}</span><span className="text-lg font-bold text-primary">%</span><span className="text-xs text-zinc-500 ml-1">OFF</span></>
                                    ) : (
                                        <><span className="text-lg font-bold text-primary">$</span><span className="text-3xl font-black text-primary">{c.discount_value.toLocaleString("es-AR")}</span><span className="text-xs text-zinc-500 ml-1">OFF</span></>
                                    )}
                                </div>

                                <div className="space-y-1 text-xs text-zinc-500">
                                    {c.min_order > 0 && <p>Mínimo: ${c.min_order.toLocaleString("es-AR")}</p>}
                                    <p>Usos: {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : " (ilimitado)"}</p>
                                    {c.expires_at && <p>Vence: {format(new Date(c.expires_at), "dd/MM/yyyy")}</p>}
                                </div>

                                <button
                                    onClick={() => toggleActive(c.id, c.is_active)}
                                    className={`mt-3 w-full py-2 rounded-lg text-xs font-bold transition ${active ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"}`}
                                >
                                    {active ? "Activo — Desactivar" : "Inactivo — Activar"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Create modal ── */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => resetForm()}>
                    <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                            <h3 className="font-extrabold text-lg text-white">Nuevo Cupón</h3>
                            <button onClick={resetForm} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            {/* Code */}
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Código</label>
                                <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                                    className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white font-mono tracking-wider focus:border-primary outline-none uppercase"
                                    placeholder="PRIMERAVEZ" />
                            </div>

                            {/* Type + Value */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tipo</label>
                                    <div className="flex gap-2 mt-1">
                                        <button type="button" onClick={() => setDiscountType("percentage")}
                                            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold transition ${discountType === "percentage" ? "bg-primary/15 text-primary border border-primary/30" : "bg-zinc-900 text-zinc-500 border border-zinc-800"}`}>
                                            <Percent size={13} /> Porcentaje
                                        </button>
                                        <button type="button" onClick={() => setDiscountType("fixed")}
                                            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold transition ${discountType === "fixed" ? "bg-primary/15 text-primary border border-primary/30" : "bg-zinc-900 text-zinc-500 border border-zinc-800"}`}>
                                            <DollarSign size={13} /> Fijo
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                        {discountType === "percentage" ? "Descuento (%)" : "Descuento ($)"}
                                    </label>
                                    <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                                        className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none"
                                        placeholder={discountType === "percentage" ? "15" : "500"} />
                                </div>
                            </div>

                            {/* Min order + Max uses */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pedido mínimo ($)</label>
                                    <input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)}
                                        className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none"
                                        placeholder="0 (sin mínimo)" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Usos máximos</label>
                                    <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)}
                                        className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none"
                                        placeholder="Ilimitado" />
                                </div>
                            </div>

                            {/* Expiration */}
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Vencimiento (opcional)</label>
                                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                                    className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none [color-scheme:dark]" />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
                            <button onClick={resetForm} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-sm font-bold hover:bg-zinc-700 transition">Cancelar</button>
                            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-black text-sm font-bold hover:brightness-110 transition disabled:opacity-50">
                                <Save size={14} /> {saving ? "Creando..." : "Crear Cupón"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
