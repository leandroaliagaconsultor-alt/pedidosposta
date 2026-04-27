"use client";

import React, { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, X, Save, Trash2, Tag, Percent, DollarSign, Copy } from "lucide-react";
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
            .then(({ data, error }: { data: any; error: any }) => {
                if (data) { setTenantId(data.id); fetchCoupons(data.id); }
                if (error || !data) setLoading(false);
            });
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

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-t-2 border-[#43926A]" /></div>;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
                <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#575757]">Gestión</p>
                    <h1 className="font-['Archivo_Black',sans-serif] text-4xl tracking-tight mt-1">
                        Cupones <span className="text-[#43926A]">& Descuentos</span>
                    </h1>
                    <p className="mt-1.5 text-sm text-[#575757]">Creá códigos de descuento para tus clientes.</p>
                </div>
                <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-full bg-[#43926A] px-5 py-2.5 font-['Archivo_Black',sans-serif] text-xs uppercase tracking-[.04em] text-white shadow-[0_6px_16px_-8px_rgba(67,146,106,.6)] transition-all hover:-translate-y-px hover:bg-[#2F6E4F] shrink-0">
                    <Plus size={14} /> Nuevo Cupón
                </button>
            </div>

            {/* Empty state */}
            {coupons.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[rgba(15,18,16,.18)] bg-white py-16 text-center">
                    <div className="mx-auto mb-4 flex h-[54px] w-[54px] items-center justify-center rounded-[14px] bg-[#EFE8D8]">
                        <Tag size={24} className="text-[#575757]" />
                    </div>
                    <h3 className="font-['Archivo_Black',sans-serif] text-lg tracking-tight">No tenés cupones</h3>
                    <p className="text-[13px] text-[#575757] mt-1 max-w-[380px] mx-auto">Creá tu primer código de descuento para atraer clientes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {coupons.map(c => {
                        const expired = c.expires_at && new Date(c.expires_at) < new Date();
                        const exhausted = c.max_uses && c.used_count >= c.max_uses;
                        const active = c.is_active && !expired && !exhausted;

                        return (
                            <div key={c.id} className={`rounded-[14px] border bg-white p-5 transition ${active ? "border-[rgba(67,146,106,.25)]" : "border-[rgba(15,18,16,.1)] opacity-60"}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <button onClick={() => copyCode(c.code)} className="flex items-center gap-1.5 rounded-lg bg-[#0F1210] px-3 py-1.5 transition hover:opacity-80" title="Copiar código">
                                        <Tag size={12} className="text-[#43926A]" />
                                        <span className="font-['Archivo_Black',sans-serif] text-sm tracking-wider text-[#F6F2EA]">{c.code}</span>
                                        <Copy size={10} className="text-[#F6F2EA]/50" />
                                    </button>
                                    <button onClick={() => deleteCoupon(c.id)} className="p-1.5 rounded-lg text-[#575757] hover:text-[#E25A2B] hover:bg-[#E25A2B]/10 transition">
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex items-baseline gap-1 mb-2">
                                    {c.discount_type === "percentage" ? (
                                        <><span className="font-['Archivo_Black',sans-serif] text-3xl text-[#43926A]">{c.discount_value}</span><span className="font-['Archivo_Black',sans-serif] text-lg text-[#43926A]">%</span><span className="ml-1 text-xs font-bold text-[#575757]">OFF</span></>
                                    ) : (
                                        <><span className="font-['Archivo_Black',sans-serif] text-lg text-[#43926A]">$</span><span className="font-['Archivo_Black',sans-serif] text-3xl text-[#43926A]">{c.discount_value.toLocaleString("es-AR")}</span><span className="ml-1 text-xs font-bold text-[#575757]">OFF</span></>
                                    )}
                                </div>

                                <div className="space-y-1 text-xs text-[#575757]">
                                    {c.min_order > 0 && <p>Mínimo: ${c.min_order.toLocaleString("es-AR")}</p>}
                                    <p>Usos: {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : " (ilimitado)"}</p>
                                    {c.expires_at && <p>Vence: {format(new Date(c.expires_at), "dd/MM/yyyy")}</p>}
                                </div>

                                <button
                                    onClick={() => toggleActive(c.id, c.is_active)}
                                    className={`mt-3 w-full rounded-[10px] py-2 text-xs font-bold transition ${active ? "bg-[#D7E9DE] text-[#2F6E4F] hover:bg-[#c5dcd0]" : "bg-[#E9E7E2] text-[#575757] hover:bg-[#ddd9d0]"}`}
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => resetForm()}>
                    <div className="w-full max-w-md rounded-[18px] bg-white border border-[rgba(15,18,16,.1)] shadow-[0_30px_60px_-30px_rgba(0,0,0,.2)]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(15,18,16,.1)]">
                            <h3 className="font-['Archivo_Black',sans-serif] text-lg uppercase tracking-tight">Nuevo Cupón</h3>
                            <button onClick={resetForm} className="text-[#575757] hover:text-[#0F1210]"><X size={18} /></button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            {/* Code */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-1.5">Código</label>
                                <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                                    className="w-full rounded-[10px] border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] px-3.5 py-2.5 text-sm font-mono tracking-wider text-[#0F1210] outline-none transition focus:border-[#43926A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(67,146,106,.15)] uppercase"
                                    placeholder="PRIMERAVEZ" />
                            </div>

                            {/* Type + Value */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-1.5">Tipo</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setDiscountType("percentage")}
                                            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-[10px] text-xs font-bold transition border ${discountType === "percentage" ? "border-[#43926A] bg-[rgba(67,146,106,.06)] text-[#2F6E4F]" : "border-[rgba(15,18,16,.18)] bg-[#FBF8F1] text-[#575757]"}`}>
                                            <Percent size={12} /> %
                                        </button>
                                        <button type="button" onClick={() => setDiscountType("fixed")}
                                            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-[10px] text-xs font-bold transition border ${discountType === "fixed" ? "border-[#43926A] bg-[rgba(67,146,106,.06)] text-[#2F6E4F]" : "border-[rgba(15,18,16,.18)] bg-[#FBF8F1] text-[#575757]"}`}>
                                            <DollarSign size={12} /> $
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-1.5">
                                        {discountType === "percentage" ? "Descuento (%)" : "Descuento ($)"}
                                    </label>
                                    <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                                        className="w-full rounded-[10px] border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] px-3.5 py-2.5 text-sm text-[#0F1210] outline-none transition focus:border-[#43926A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(67,146,106,.15)]"
                                        placeholder={discountType === "percentage" ? "15" : "500"} />
                                </div>
                            </div>

                            {/* Min order + Max uses */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-1.5">Pedido mínimo ($)</label>
                                    <input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)}
                                        className="w-full rounded-[10px] border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] px-3.5 py-2.5 text-sm text-[#0F1210] outline-none transition focus:border-[#43926A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(67,146,106,.15)]"
                                        placeholder="0 (sin mínimo)" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-1.5">Usos máximos</label>
                                    <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)}
                                        className="w-full rounded-[10px] border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] px-3.5 py-2.5 text-sm text-[#0F1210] outline-none transition focus:border-[#43926A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(67,146,106,.15)]"
                                        placeholder="Ilimitado" />
                                </div>
                            </div>

                            {/* Expiration */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[.06em] text-[#575757] mb-1.5">Vencimiento (opcional)</label>
                                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                                    className="w-full rounded-[10px] border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] px-3.5 py-2.5 text-sm text-[#0F1210] outline-none transition focus:border-[#43926A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(67,146,106,.15)]" />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-[rgba(15,18,16,.1)] flex justify-end gap-3">
                            <button onClick={resetForm} className="rounded-full border border-[rgba(15,18,16,.18)] bg-white px-4 py-2 text-sm font-bold text-[#575757] hover:border-[#0F1210] transition">Cancelar</button>
                            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[#43926A] px-5 py-2 font-['Archivo_Black',sans-serif] text-xs uppercase tracking-[.04em] text-white shadow-[0_6px_16px_-8px_rgba(67,146,106,.6)] hover:-translate-y-px hover:bg-[#2F6E4F] transition disabled:opacity-50">
                                <Save size={13} /> {saving ? "Creando..." : "Crear Cupón"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
