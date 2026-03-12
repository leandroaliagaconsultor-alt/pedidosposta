"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";
import {
    Store, CheckCircle2, DollarSign, Wallet,
    Pencil, Play, Pause, Trash2, ShieldAlert, X
} from "lucide-react";

export default function AdminDashboardPage() {
    const supabase = createClient();
    const [tenants, setTenants] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [editModal, setEditModal] = useState<any>(null); // tenant being edited
    const [newCommission, setNewCommission] = useState("");

    const [deleteModal, setDeleteModal] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Load tenants
        const { data: tenantsData, error: tErr } = await supabase
            .from("tenants")
            .select("*")
            .order("created_at", { ascending: false });

        if (tErr) console.error(tErr);
        if (tenantsData) setTenants(tenantsData);

        // Load all delivered orders to calculate GMV
        const { data: ordersData, error: oErr } = await supabase
            .from("orders")
            .select("id, total_amount, tenant_id, status")
            .eq("status", "delivered");

        if (oErr) console.error(oErr);
        if (ordersData) setOrders(ordersData);

        setLoading(false);
    };

    // Calculate Metrics
    const activeStores = tenants.filter(t => !t.is_suspended).length;
    const totalOrders = orders.length;

    let gmvTotal = 0;
    let estimatedProfit = 0;

    orders.forEach(order => {
        gmvTotal += Number(order.total_amount || 0);
        // Find tenant to get commission rate
        const tenant = tenants.find(t => t.id === order.tenant_id);
        const commissionRate = Number(tenant?.commission_rate || 0);
        estimatedProfit += (Number(order.total_amount || 0) * (commissionRate / 100));
    });

    // Actions
    const handleSuspendToggle = async (tenantId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        const { data, error, status } = await supabase
            .from("tenants")
            .update({ is_suspended: newStatus })
            .eq("id", tenantId)
            .select();

        if (error) {
            toast.error("Error al actualizar la tienda: " + error.message);
        } else if (!data || data.length === 0) {
            toast.error("No se pudo actualizar. Posible error de permisos RLS.");
        } else {
            toast.success(newStatus ? "Tienda Suspendida" : "Tienda Reactivada");
            setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, is_suspended: newStatus } : t));
        }
    };

    const handleSaveCommission = async () => {
        if (!editModal) return;
        const val = parseFloat(newCommission);
        if (isNaN(val) || val < 0 || val > 100) {
            toast.error("Ingresá un % de comisión válido (0-100)");
            return;
        }

        const { data, error } = await supabase
            .from("tenants")
            .update({ commission_rate: val })
            .eq("id", editModal.id)
            .select();

        if (error) {
            toast.error("Error al actualizar comisión: " + error.message);
        } else if (!data || data.length === 0) {
            toast.error("No se pudo actualizar la comisión (RLS).");
        } else {
            toast.success(`Comisión actualizada a ${val}%`);
            setTenants(prev => prev.map(t => t.id === editModal.id ? { ...t, commission_rate: val } : t));
            setEditModal(null);
            fetchData(); // reload metrics
        }
    };

    const handleDeleteTenant = async () => {
        if (!deleteModal) return;
        if (deleteConfirm !== "ELIMINAR") {
            toast.error("Escribí ELIMINAR para confirmar.");
            return;
        }

        toast.info("Ejecutando la purga, puede tardar...");
        const { error, status } = await supabase
            .from("tenants")
            .delete()
            .eq("id", deleteModal.id);

        if (error) {
            toast.error("Error al borrar: " + error.message);
            console.error(error);
        } else {
            toast.success(`La tienda ${deleteModal.name} fue purgada.`);
            setDeleteModal(null);
            setDeleteConfirm("");
            fetchData();
        }
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
                <p className="text-sm text-zinc-400 mt-1 font-medium tracking-wide">Métricas globales y gestión de tiendas in-house.</p>
            </div>

            {/* ── METRICS DASHBOARD ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-6 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-500">Tiendas Activas</p>
                        <h3 className="text-4xl font-extrabold text-white mt-1 leading-none">{activeStores}</h3>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Store className="text-emerald-500" size={26} />
                    </div>
                </div>
                <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-6 flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-500">Órdenes Full</p>
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
                        <Wallet className="text-amber-500" size={26} />
                    </div>
                </div>
                <div className="rounded-2xl bg-zinc-900/40 border border-primary/30 p-6 flex items-center justify-between shadow-[0_0_20px_var(--brand-color)] shadow-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="relative z-10">
                        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-primary">Ganancia Est.</p>
                        <h3 className="text-3xl font-extrabold text-white mt-2 leading-none font-mono drop-shadow-sm">
                            ${estimatedProfit.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="relative z-10 h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
                        <DollarSign className="text-primary" size={26} />
                    </div>
                </div>
            </div>

            {/* ── TENANTS TABLE ── */}
            <div className="rounded-2xl border border-zinc-800 bg-[#09090b] shadow-2xl overflow-hidden mt-8">
                <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/30 flex justify-between items-center">
                    <h2 className="text-xl font-bold tracking-tight">Gestión de Locales</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-900 text-xs uppercase font-extrabold tracking-widest text-zinc-500">
                            <tr>
                                <th className="px-6 py-4">Local</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">% Comisión</th>
                                <th className="px-6 py-4">Órdenes</th>
                                <th className="px-6 py-4 text-right">Acciones God</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {tenants.map(t => {
                                const tOrders = orders.filter(o => o.tenant_id === t.id).length;
                                return (
                                    <tr key={t.id} className="hover:bg-zinc-900/40 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                                            {t.logo_url ? (
                                                <img src={t.logo_url} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs">{t.name.charAt(0)}</div>
                                            )}
                                            {t.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.is_suspended ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-500/20">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                    Suspendido
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    Activo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-amber-400 bg-amber-500/5 px-4 rounded-xl">
                                            {Number(t.commission_rate || 0)}%
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 font-mono">
                                            {tOrders} finalizadas
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setEditModal(t); setNewCommission(t.commission_rate?.toString() || "0"); }}
                                                className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition tooltip"
                                                title="Editar Comisión"
                                            >
                                                <Pencil size={15} />
                                            </button>

                                            <button
                                                onClick={() => handleSuspendToggle(t.id, t.is_suspended)}
                                                className={`p-2 rounded-xl transition ${t.is_suspended ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}`}
                                                title={t.is_suspended ? "Reactivar Tienda" : "Pausar/Suspender Tienda"}
                                            >
                                                {t.is_suspended ? <Play size={15} /> : <Pause size={15} />}
                                            </button>

                                            <button
                                                onClick={() => setDeleteModal(t)}
                                                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 transition"
                                                title="Hard Delete"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── MODALS ── */}
            {/* Edit Commission Modal */}
            {editModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-extrabold uppercase tracking-wide text-sm">Comisión: {editModal.name}</h3>
                            <button onClick={() => setEditModal(null)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                        </div>
                        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                            Ajustá el porcentaje que la plataforma le cobra a este local por cada orden confirmada y finalizada.
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newCommission}
                                    onChange={e => setNewCommission(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-lg font-mono focus:border-primary outline-none focus:ring-1 focus:ring-primary/50 text-white"
                                />
                                <span className="absolute right-4 top-3.5 text-zinc-500 font-mono">%</span>
                            </div>
                            <button
                                onClick={handleSaveCommission}
                                className="bg-primary text-black font-extrabold px-6 py-3 rounded-xl hover:brightness-110 transition shrink-0"
                            >
                                GUARDAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confimation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in slide-in-from-bottom-4">
                    <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-red-500/30 p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] text-center">
                        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="font-black text-2xl text-white mb-2">Peligro Crítico</h3>
                        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                            Estás a punto de eliminar <span className="text-white font-bold">{deleteModal.name}</span>.<br />
                            Esto borrará en cascada <strong>TODOS</strong> sus productos, menús, órdenes y usuarios.
                            <br /><br />
                            Escribí <code className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded">ELIMINAR</code> abajo:
                        </p>

                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            placeholder="ELIMINAR"
                            className="w-full text-center bg-zinc-900 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-white font-mono uppercase focus:border-red-500 outline-none placeholder:text-zinc-700"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeleteModal(null); setDeleteConfirm(""); }}
                                className="flex-1 bg-zinc-800 text-white font-bold px-4 py-3 rounded-xl hover:bg-zinc-700 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteTenant}
                                disabled={deleteConfirm !== "ELIMINAR"}
                                className="flex-1 bg-red-500 text-white font-bold px-4 py-3 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-400 transition"
                            >
                                Purga Total
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
