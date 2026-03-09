"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Save, Store, MapPin, Clock, Bike, ShoppingCart, Calendar, Plus, Trash2, CreditCard, Key, Lock, ArrowRightLeft } from "lucide-react";

// ─── Schema ──────────────────────────────────────────────────────────────────

const settingsSchema = z.object({
    address: z.string().optional().nullable(),
    business_hours: z.string().optional().nullable(),
    delivery_fee: z.coerce.number().min(0, "Monto inválido").optional().nullable(),
    min_order: z.coerce.number().min(0, "Monto inválido").optional().nullable(),
    override_status: z.enum(['none', 'force_open', 'force_close']).default('none'),
    max_orders_per_slot: z.coerce.number().min(0).optional().nullable(),
    schedule: z.record(z.string(), z.array(z.object({ start: z.string(), end: z.string() }))).optional(),
    is_mp_active: z.boolean().default(false),
    mp_access_token: z.string().optional().nullable(),
    mp_public_key: z.string().optional().nullable(),
    transfer_alias: z.string().optional().nullable(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsProPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = use(params);
    const router = useRouter();
    const supabase = createClient();

    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const form = useForm({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            address: "",
            business_hours: "",
            delivery_fee: 0,
            min_order: 0,
            max_orders_per_slot: 10,
            override_status: "none" as "none" | "force_open" | "force_close",
            schedule: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] } as Record<string, { start: string, end: string }[]>,
            is_mp_active: false,
            mp_access_token: "",
            mp_public_key: "",
            transfer_alias: "",
        },
    });

    const watchValues = form.watch();

    // Fetch initial profile
    useEffect(() => {
        const fetchTenant = async () => {
            const { data, error } = await supabase.from("tenants").select("*").eq("slug", tenant).single();
            if (!error && data) {
                setTenantId(data.id);
                form.reset({
                    address: data.address || "",
                    business_hours: data.business_hours || "",
                    delivery_fee: data.delivery_fee || 0,
                    min_order: data.min_order || 0,
                    max_orders_per_slot: data.max_orders_per_slot || 10,
                    override_status: data.override_status || "none",
                    schedule: data.schedule || { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
                    is_mp_active: !!data.is_mp_active,
                    mp_access_token: data.mp_access_token || "",
                    mp_public_key: data.mp_public_key || "",
                    transfer_alias: data.transfer_alias || "",
                });
            }
            setLoading(false);
        };
        fetchTenant();
    }, [supabase, tenant, form]);

    const onSubmit = async (data: SettingsForm) => {
        if (!tenantId) return;
        setSaving(true);

        try {
            const { error: updateError } = await supabase
                .from("tenants")
                .update({
                    address: data.address,
                    business_hours: data.business_hours,
                    delivery_fee: data.delivery_fee,
                    min_order: data.min_order,
                    max_orders_per_slot: data.max_orders_per_slot,
                    override_status: data.override_status,
                    schedule: data.schedule,
                    is_mp_active: data.is_mp_active,
                    mp_access_token: data.mp_access_token,
                    mp_public_key: data.mp_public_key,
                    transfer_alias: data.transfer_alias,
                })
                .eq("id", tenantId);

            if (updateError) {
                console.error('Error Database Update:', updateError);
                throw new Error(updateError.message || "Error al actualizar la base de datos");
            }

            toast.success("¡Configuración Guardada Exitosamente!");
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

    const DAYS = [
        { id: 'monday', label: 'Lunes' },
        { id: 'tuesday', label: 'Martes' },
        { id: 'wednesday', label: 'Miércoles' },
        { id: 'thursday', label: 'Jueves' },
        { id: 'friday', label: 'Viernes' },
        { id: 'saturday', label: 'Sábado' },
        { id: 'sunday', label: 'Domingo' }
    ];

    const addTimeRange = (dayId: string) => {
        const current = form.getValues(`schedule.${dayId}` as any) || [];
        form.setValue(`schedule.${dayId}` as any, [...current, { start: "19:00", end: "23:59" }], { shouldDirty: true });
    };

    const removeTimeRange = (dayId: string, index: number) => {
        const current = [...(form.getValues(`schedule.${dayId}` as any) || [])];
        current.splice(index, 1);
        form.setValue(`schedule.${dayId}` as any, current, { shouldDirty: true });
    };

    const updateTimeRange = (dayId: string, index: number, field: 'start' | 'end', value: string) => {
        const current = [...(form.getValues(`schedule.${dayId}` as any) || [])];
        current[index] = { ...current[index], [field]: value };
        form.setValue(`schedule.${dayId}` as any, current, { shouldDirty: true });
    };

    return (
        <div className="h-full w-full max-w-7xl mx-auto">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Configuración del <span className="text-primary italic">Local</span></h1>
                    <p className="text-zinc-400">Gestiona horarios, zonas y detalles de operativa general.</p>
                </div>
            </header>

            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8 pb-24 max-w-4xl mx-auto">
                <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/20 p-6 backdrop-blur-xl xl:p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-white">
                        <MapPin className="text-primary" size={24} /> Información Operativa
                    </h2>

                    <div className="space-y-6">
                        {/* ── Motor de Horarios y Override ── */}
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 space-y-6">
                            <div className="border-b border-zinc-800 pb-4">
                                <h3 className="font-bold text-lg text-white mb-1">Estado de la Tienda (Override)</h3>
                                <p className="text-sm text-zinc-500 mb-4">Fuerza el local a estar abierto o cerrado, ignorando los horarios.</p>

                                <div className="grid grid-cols-3 gap-3">
                                    {(['none', 'force_open', 'force_close'] as const).map(status => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => form.setValue('override_status', status, { shouldDirty: true })}
                                            className={`py-3 px-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all flex flex-col items-center justify-center gap-1 ${watchValues.override_status === status
                                                ? (status === 'force_open' ? 'bg-primary text-primary-foreground shadow-[0_0_15px_var(--brand-color)] shadow-primary/30'
                                                    : status === 'force_close' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                                        : 'bg-zinc-700 text-white ring-2 ring-zinc-500')
                                                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
                                                }`}
                                        >
                                            {status === 'none' && 'Automático'}
                                            {status === 'force_open' && 'Forzar Abierto'}
                                            {status === 'force_close' && 'Forzar Cerrado'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={watchValues.override_status !== 'none' ? 'opacity-40 pointer-events-none transition-opacity' : 'transition-opacity'}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="text-primary" size={20} />
                                    <h3 className="font-bold text-white">Horarios Semanales</h3>
                                </div>
                                <div className="space-y-3">
                                    {DAYS.map(day => {
                                        const ranges = watchValues.schedule?.[day.id] || [];
                                        const isEnabled = ranges.length > 0;
                                        return (
                                            <div key={day.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-colors ${isEnabled ? 'bg-zinc-900 border-zinc-700' : 'bg-transparent border-zinc-800/60'}`}>
                                                <div className="w-28 flex items-center justify-between">
                                                    <span className={`font-semibold ${isEnabled ? 'text-white' : 'text-zinc-500'}`}>{day.label}</span>
                                                    <label className="relative inline-flex cursor-pointer items-center sm:hidden">
                                                        <input type="checkbox" checked={isEnabled} onChange={(e) => {
                                                            if (e.target.checked) addTimeRange(day.id);
                                                            else form.setValue(`schedule.${day.id}` as any, []);
                                                        }} className="sr-only peer" />
                                                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                                    </label>
                                                </div>

                                                <div className="flex-1 flex flex-col gap-2">
                                                    {ranges.map((range: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <input
                                                                type="time"
                                                                value={range.start}
                                                                onChange={(e) => updateTimeRange(day.id, idx, 'start', e.target.value)}
                                                                className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg p-2 flex-1 focus:ring-1 focus:ring-primary outline-none"
                                                            />
                                                            <span className="text-zinc-500 font-bold">-</span>
                                                            <input
                                                                type="time"
                                                                value={range.end}
                                                                onChange={(e) => updateTimeRange(day.id, idx, 'end', e.target.value)}
                                                                className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg p-2 flex-1 focus:ring-1 focus:ring-primary outline-none"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTimeRange(day.id, idx)}
                                                                className="p-2 text-red-500/70 hover:bg-red-500/10 rounded-lg hover:text-red-400"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {ranges.length === 0 && (
                                                        <p className="text-xs text-zinc-600 font-medium hidden sm:block">Cerrado este día</p>
                                                    )}
                                                </div>

                                                <div className="sm:ml-auto flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => addTimeRange(day.id)}
                                                        className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors ${isEnabled ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700' : 'bg-transparent border-zinc-800 text-primary hover:bg-primary/10 hover:border-primary/50'}`}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-300">Dirección Múltiple/Física</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        {...form.register("address")}
                                        placeholder="Ej: Av. Siempreviva 742"
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 pl-10 pr-4 py-3 text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-zinc-500">Aparecerá como etiqueta en el menú.</p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-300">Horarios de Atención</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        {...form.register("business_hours")}
                                        placeholder="Ej: Mar a Dom 19:00 a 24:00"
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 pl-10 pr-4 py-3 text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-300">Costo de Envío</label>
                                <div className="relative">
                                    <Bike className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="number"
                                        min="0"
                                        {...form.register("delivery_fee")}
                                        placeholder="Ej: 500"
                                        className={`w-full rounded-xl border bg-zinc-950/50 pl-10 pr-4 py-3 text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${form.formState.errors.delivery_fee ? "border-red-500/50" : "border-zinc-800"}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-300">Compra Mínima</label>
                                <div className="relative">
                                    <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="number"
                                        min="0"
                                        {...form.register("min_order")}
                                        placeholder="Ej: 3000"
                                        className={`w-full rounded-xl border bg-zinc-950/50 pl-10 pr-4 py-3 text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${form.formState.errors.min_order ? "border-red-500/50" : "border-zinc-800"}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-300">Capacidad (Pedidos cada 30 min)</label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="number"
                                        min="0"
                                        {...form.register("max_orders_per_slot")}
                                        placeholder="Ej: 15"
                                        className={`w-full rounded-xl border bg-zinc-950/50 pl-10 pr-4 py-3 text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${form.formState.errors.max_orders_per_slot ? "border-red-500/50" : "border-zinc-800"}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── MP Integration ── */}
                <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/20 p-6 backdrop-blur-xl xl:p-8 mt-6">
                    <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                        <h2 className="flex items-center gap-3 text-xl font-bold text-white">
                            <CreditCard className="text-sky-500" size={24} /> Pasarela de Pagos (MercadoPago)
                        </h2>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                {...form.register('is_mp_active')}
                            />
                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            <span className="ml-3 text-sm font-bold text-zinc-300 uppercase tracking-wider">Activar</span>
                        </label>
                    </div>

                    <div className={`space-y-6 transition-opacity duration-300 ${watchValues.is_mp_active ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        <p className="text-sm text-zinc-500 -mt-2">Completa tus credenciales BYOK (Bring Your Own Key) para recibir el dinero directo en tu cuenta.</p>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-300">Public Key (Client ID)</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="password"
                                        {...form.register("mp_public_key")}
                                        placeholder="APP_USR-..."
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 pl-10 pr-4 py-3 text-zinc-100 outline-none transition focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-300">Access Token (Secret)</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="password"
                                        {...form.register("mp_access_token")}
                                        placeholder="APP_USR-..."
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 pl-10 pr-4 py-3 text-zinc-100 outline-none transition focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Transfer Integration ── */}
                <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/20 p-6 backdrop-blur-xl xl:p-8 mt-6">
                    <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                        <h2 className="flex items-center gap-3 text-xl font-bold text-white">
                            <ArrowRightLeft className="text-amber-500" size={24} /> Transferencia Bancaria
                        </h2>
                    </div>

                    <p className="text-sm text-zinc-500 -mt-2 mb-6">Configurá el Alias, CBU o CVU donde los clientes deben realizar las transferencias.</p>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-300">Alias / CBU / CVU para Transferencias</label>
                        <div className="relative">
                            <ArrowRightLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="text"
                                {...form.register("transfer_alias")}
                                placeholder="Ej: PEDIDO.POSTA.MP o 00000031000..."
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 pl-10 pr-4 py-3 text-zinc-100 outline-none transition focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-end border-t border-zinc-800/80 bg-zinc-950/80 px-6 py-4 backdrop-blur-xl md:left-64">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-extrabold text-[#09090b] transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50 shadow-[0_0_20px_var(--brand-color)]"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Guardar Configuración
                    </button>
                </div>
            </form>
        </div>
    );
}
