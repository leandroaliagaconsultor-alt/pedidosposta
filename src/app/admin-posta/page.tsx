"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";
import {
    Store, CheckCircle2, DollarSign, Wallet,
    Play, Pause, Trash2, ShieldAlert, X, Clock, CreditCard, MapPin
} from "lucide-react";

function getSubscriptionBadge(t: any) {
    const status = t.subscription_status;
    const trialEnd = t.trial_ends_at ? new Date(t.trial_ends_at) : null;
    const now = new Date();

    if (status === "active") {
        return { label: "Activa", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500" };
    }

    if (trialEnd && trialEnd > now) {
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { label: `Trial (${daysLeft}d)`, color: "bg-sky-500/10 text-sky-400 border-sky-500/20", dot: "bg-sky-500" };
    }

    if (status === "expired" || (trialEnd && trialEnd <= now && status !== "active")) {
        return { label: "Vencida", color: "bg-red-500/10 text-red-500 border-red-500/20", dot: "bg-red-500" };
    }

    // Default: trial sin fecha
    return { label: "Sin suscripción", color: "bg-zinc-800 text-zinc-500 border-zinc-700/50", dot: "bg-zinc-600" };
}

export default function AdminDashboardPage() {
    const supabase = createClient();
    const [tenants, setTenants] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [deleteModal, setDeleteModal] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState("");

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: tenantsData } = await supabase
            .from("tenants")
            .select("*")
            .or("type.eq.saas,type.is.null")
            .order("created_at", { ascending: false });
        if (tenantsData) setTenants(tenantsData);

        const { data: ordersData } = await supabase
            .from("orders")
            .select("id, total_amount, tenant_id, status")
            .eq("status", "delivered");
        if (ordersData) setOrders(ordersData);

        setLoading(false);
    };

    // Only SaaS tenants
    const saasTenants = tenants.filter(t => !t.type || t.type === "saas");
    const activeStores = saasTenants.filter(t => !t.is_suspended).length;
    const totalOrders = orders.length;

    let gmvTotal = 0;
    orders.forEach(order => { gmvTotal += Number(order.total_amount || 0); });

    const handleSuspendToggle = async (tenantId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        const { data, error } = await supabase.from("tenants").update({ is_suspended: newStatus }).eq("id", tenantId).select();
        if (error) { toast.error("Error: " + error.message); }
        else if (!data || data.length === 0) { toast.error("Error de permisos RLS."); }
        else {
            toast.success(newStatus ? "Tienda Suspendida" : "Tienda Reactivada");
            setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, is_suspended: newStatus } : t));
        }
    };

    const handleDeleteTenant = async () => {
        if (!deleteModal || deleteConfirm !== "ELIMINAR") { toast.error("Escribí ELIMINAR para confirmar."); return; }
        toast.info("Ejecutando la purga...");
        const { error } = await supabase.from("tenants").delete().eq("id", deleteModal.id);
        if (error) { toast.error("Error: " + error.message); }
        else { toast.success(`${deleteModal.name} eliminado.`); setDeleteModal(null); setDeleteConfirm(""); fetchData(); }
    };

    if (loading) {
        return (
            <div className="flex w-full min-h-[50vh] items-center justify-center">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-primary" />
                    <span className="font-mono text-zinc-500 text-sm tracking-widest uppercase">Cargando God Mode...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            <div>
                <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-md">Panel SuperAdmin</h1>
                <p className="text-sm text-zinc-400 mt-1 font-medium tracking-wide">Métricas globales y gestión de clientes SaaS.</p>
            </div>

            {/* ── METRICS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-6 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-500">Clientes SaaS</p>
                        <h3 className="text-4xl font-extrabold text-white mt-1 leading-none">{activeStores}</h3>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Store className="text-emerald-500" size={26} />
                    </div>
                </div>
                <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-6 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-500">Órdenes Entregadas</p>
                        <h3 className="text-4xl font-extrabold text-white mt-1 leading-none">{totalOrders}</h3>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-sky-500/10 flex items-center justify-center">
                        <CheckCircle2 className="text-sky-500" size={26} />
                    </div>
                </div>
                <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-6 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-500">GMV Global</p>
                        <h3 className="text-3xl font-extrabold text-white mt-2 leading-none font-mono">
                            ${gmvTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <DollarSign className="text-amber-500" size={26} />
                    </div>
                </div>
            </div>

            {/* ── Quick Links ── */}
            <div className="flex flex-wrap gap-3">
                <a href="/admin-posta/directory" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-sm font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition">
                    <Store size={16} className="text-primary" /> Directorio
                </a>
                <a href="/admin-posta/cities" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-sm font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition">
                    <MapPin size={16} className="text-sky-400" /> Ciudades
                </a>
            </div>

            {/* ── SAAS TENANTS TABLE ── */}
            <div className="rounded-2xl border border-zinc-800 bg-[#09090b] shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/30 flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight">Clientes SaaS</h2>
                    <span className="text-xs text-zinc-500">{saasTenants.length} locales</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-900 text-xs uppercase font-extrabold tracking-widest text-zinc-500">
                            <tr>
                                <th className="px-6 py-4">Local</th>
                                <th className="px-6 py-4">Suscripción</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Órdenes</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {saasTenants.map(t => {
                                const tOrders = orders.filter(o => o.tenant_id === t.id).length;
                                const sub = getSubscriptionBadge(t);
                                return (
                                    <tr key={t.id} className="hover:bg-zinc-900/40 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                            {t.logo_url ? (
                                                <Image src={t.logo_url} width={32} height={32} className="w-8 h-8 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">{t.name?.charAt(0)}</div>
                                            )}
                                            <div>
                                                <p>{t.name}</p>
                                                <p className="text-[10px] text-zinc-600 font-mono font-normal">/{t.slug}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border ${sub.color}`}>
                                                <div className={`h-1.5 w-1.5 rounded-full ${sub.dot}`} />
                                                {sub.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.is_suspended ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-500/20">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" /> Suspendido
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 font-mono">
                                            {tOrders}
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleSuspendToggle(t.id, t.is_suspended)}
                                                className={`p-2 rounded-xl transition ${t.is_suspended ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}`}
                                                title={t.is_suspended ? "Reactivar" : "Suspender"}
                                            >
                                                {t.is_suspended ? <Play size={15} /> : <Pause size={15} />}
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal(t)}
                                                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 transition"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {saasTenants.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-600">No hay clientes SaaS registrados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Delete Modal ── */}
            {deleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-red-500/30 p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] text-center">
                        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="font-black text-2xl text-white mb-2">Peligro Crítico</h3>
                        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                            Estás a punto de eliminar <span className="text-white font-bold">{deleteModal.name}</span>.<br />
                            Esto borrará <strong>TODOS</strong> sus productos, menús, órdenes y usuarios.
                            <br /><br />
                            Escribí <code className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded">ELIMINAR</code>:
                        </p>
                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            placeholder="ELIMINAR"
                            className="w-full text-center bg-zinc-900 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-white font-mono uppercase focus:border-red-500 outline-none placeholder:text-zinc-700"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => { setDeleteModal(null); setDeleteConfirm(""); }} className="flex-1 bg-zinc-800 text-white font-bold px-4 py-3 rounded-xl hover:bg-zinc-700 transition">
                                Cancelar
                            </button>
                            <button onClick={handleDeleteTenant} disabled={deleteConfirm !== "ELIMINAR"} className="flex-1 bg-red-500 text-white font-bold px-4 py-3 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-400 transition">
                                Purga Total
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
