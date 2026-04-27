"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
    Loader2, Save, Store, MapPin, Clock, Bike, ShoppingCart,
    Calendar, Plus, Trash2, CreditCard, Key, Lock,
    ArrowRightLeft, User, Instagram, Facebook, Phone, Megaphone,
    Globe, Copy, CheckCircle2, ExternalLink, Eye, EyeOff, Map
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import { useJsApiLoader, GoogleMap, Circle, Marker } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

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
    transfer_account_name: z.string().optional().nullable(),
    delivery_pricing_type: z.enum(['fixed', 'distance']).default('fixed'),
    delivery_radius_km: z.coerce.number().min(0).default(5),
    fixed_delivery_price: z.coerce.number().min(0).default(1500),
    base_delivery_price: z.coerce.number().min(0).default(1500),
    base_delivery_km: z.coerce.number().min(0).default(2),
    extra_price_per_km: z.coerce.number().min(0).default(500),
    instagram_url: z.string().optional().nullable(),
    facebook_url: z.string().optional().nullable(),
    public_phone: z.string().optional().nullable(),
    announcement_text: z.string().optional().nullable(),
    show_whatsapp_checkout: z.boolean().default(false),
    enable_kitchen_tickets: z.boolean().default(false),
    enable_delivery_tickets: z.boolean().default(false),
    enable_delivery: z.boolean().default(true),
    enable_takeaway: z.boolean().default(true),
    store_address: z.string().optional().nullable(),
    custom_domain: z.string().optional().nullable(),
    // Directory fields
    city: z.string().optional().nullable(),
    categories: z.array(z.string()).default([]),
    is_directory_active: z.boolean().default(false),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsProPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = use(params);
    const router = useRouter();
    const supabase = createClient();

    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
    const [mapSessionToken, setMapSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);
    const [showMPPublicKey, setShowMPPublicKey] = useState(false);
    const [showMPAccessToken, setShowMPAccessToken] = useState(false);
    const [availableCities, setAvailableCities] = useState<any[]>([]);

    // Load Google Maps Script
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries,
    });

    const {
        ready,
        value: addressValue,
        suggestions: { status, data },
        setValue: setAddressValue,
        clearSuggestions,
        init,
    } = usePlacesAutocomplete({
        initOnMount: false,
        requestOptions: {
            componentRestrictions: { country: "ar" },
            sessionToken: mapSessionToken ?? undefined,
        },
        debounce: 300,
    });

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
            transfer_account_name: "",
            delivery_pricing_type: "fixed" as "fixed" | "distance",
            delivery_radius_km: 5,
            fixed_delivery_price: 1500,
            base_delivery_price: 1500,
            base_delivery_km: 2,
            extra_price_per_km: 500,
            instagram_url: "",
            facebook_url: "",
            public_phone: "",
            announcement_text: "",
            show_whatsapp_checkout: false,
            enable_kitchen_tickets: false,
            enable_delivery_tickets: false,
            enable_delivery: true,
            enable_takeaway: true,
            store_address: "",
            custom_domain: "",
            city: "",
            categories: [] as string[],
            is_directory_active: false,
        },
    });

    const watchValues = form.watch();

    const circleOptions = React.useMemo(() => ({
        fillColor: '#EF4444',
        fillOpacity: 0.15,
        strokeColor: '#EF4444',
        strokeOpacity: 0.8,
        strokeWeight: 2,
    }), []);

    useEffect(() => {
        if (isLoaded) {
            init();
            if (window.google?.maps?.places && !mapSessionToken) {
                setMapSessionToken(new window.google.maps.places.AutocompleteSessionToken());
            }
        }
    }, [isLoaded, init, mapSessionToken]);

    // Geocode store address to center map
    useEffect(() => {
        if (!isLoaded || !watchValues.store_address || watchValues.store_address.length < 5) {
            setMapCenter(null);
            return;
        }

        getGeocode({ address: watchValues.store_address })
            .then((results) => getLatLng(results[0]))
            .then(({ lat, lng }) => setMapCenter({ lat, lng }))
            .catch((err) => {
                console.warn("Dirección no encontrada por Google Maps o error de Geocoding:", err);
            });
    }, [isLoaded, watchValues.store_address]);

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
                    transfer_account_name: data.transfer_account_name || "",
                    delivery_pricing_type: data.delivery_pricing_type || "fixed",
                    delivery_radius_km: data.delivery_radius_km || 5,
                    fixed_delivery_price: data.fixed_delivery_price || 1500,
                    base_delivery_price: data.base_delivery_price || 1500,
                    base_delivery_km: data.base_delivery_km || 2,
                    extra_price_per_km: data.extra_price_per_km || 500,
                    instagram_url: data.instagram_url || "",
                    facebook_url: data.facebook_url || "",
                    public_phone: data.public_phone || "",
                    announcement_text: data.announcement_text || "",
                    show_whatsapp_checkout: !!data.show_whatsapp_checkout,
                    enable_kitchen_tickets: !!data.enable_kitchen_tickets,
                    enable_delivery_tickets: !!data.enable_delivery_tickets,
                    enable_delivery: data.enable_delivery ?? true,
                    enable_takeaway: data.enable_takeaway ?? true,
                    store_address: data.store_address || "",
                    custom_domain: data.custom_domain || "",
                    city: data.city || "",
                    categories: data.categories || [],
                    is_directory_active: data.is_directory_active ?? false,
                });

                if (data.store_address) {
                    setAddressValue(data.store_address, false);
                }
            }
            setLoading(false);
        };
        fetchTenant();
        // Fetch cities for directory dropdown (fallback if table doesn't exist)
        supabase.from("directory_cities").select("*").eq("is_active", true).order("name").then(({ data }: { data: any }) => {
            if (data && data.length > 0) {
                setAvailableCities(data);
            } else {
                // Fallback
                setAvailableCities([{ id: "mercedes", name: "Mercedes", slug: "mercedes" }]);
            }
        });
    }, [supabase, tenant, form, setAddressValue]);

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
                    transfer_account_name: data.transfer_account_name,
                    store_address: data.store_address,
                    store_lat: mapCenter?.lat ?? null,
                    store_lng: mapCenter?.lng ?? null,
                    delivery_pricing_type: data.delivery_pricing_type,
                    delivery_radius_km: data.delivery_radius_km,
                    fixed_delivery_price: data.fixed_delivery_price,
                    base_delivery_price: data.base_delivery_price,
                    base_delivery_km: data.base_delivery_km,
                    extra_price_per_km: data.extra_price_per_km,
                    instagram_url: data.instagram_url,
                    facebook_url: data.facebook_url,
                    public_phone: data.public_phone,
                    announcement_text: data.announcement_text,
                    show_whatsapp_checkout: data.show_whatsapp_checkout,
                    enable_kitchen_tickets: data.enable_kitchen_tickets,
                    enable_delivery_tickets: data.enable_delivery_tickets,
                    enable_delivery: data.enable_delivery,
                    enable_takeaway: data.enable_takeaway,
                    custom_domain: data.custom_domain,
                    city: data.city || null,
                    categories: data.categories?.length ? data.categories : null,
                    is_directory_active: data.is_directory_active,
                })
                .eq("id", tenantId);

            if (updateError) {
                console.error('Error Database Update:', updateError);
                throw new Error(updateError.message || "Error al actualizar la base de datos");
            }

            toast.success("¡Configuración Guardada Exitosamente!", { duration: 8000 });
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
        <div className="h-full w-full max-w-7xl mx-auto overflow-x-hidden">
            <header className="mb-6 sm:mb-10">
                <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#575757]">Configuración</p>
                    <h1 className="font-['Archivo_Black',sans-serif] text-3xl sm:text-4xl tracking-tight mt-1">Configuración del <span className="text-[#43926A]">Local</span></h1>
                    <p className="text-sm text-[#575757] mt-1.5">Gestiona horarios, zonas y detalles de operativa general.</p>
                </div>
            </header>

            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8 pb-28 max-w-4xl mx-auto">
                <div className="rounded-2xl sm:rounded-3xl border border-[rgba(15,18,16,.1)] bg-white p-4 sm:p-6 xl:p-8">
                    <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-[#0F1210]">
                        <MapPin className="text-primary" size={24} /> Información Operativa
                    </h2>

                    <div className="space-y-6">
                        {/* ── Motor de Horarios y Override ── */}
                        <div className="rounded-2xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] p-6 space-y-6">
                            <div className="border-b border-[rgba(15,18,16,.1)] pb-4">
                                <h3 className="font-bold text-lg text-[#0F1210] mb-1">Estado de la Tienda</h3>
                                <p className="text-sm text-[#575757] mb-4">Cierre de emergencia: Si lo desactivas, los clientes podran ver tu menu pero no podran realizar pedidos hasta que vuelvas a abrir.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {(['none', 'force_open', 'force_close'] as const).map(status => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => form.setValue('override_status', status, { shouldDirty: true })}
                                            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-widest uppercase transition-all flex flex-col items-center justify-center gap-1 ${watchValues.override_status === status
                                                ? (status === 'force_open' ? 'bg-[#43926A] text-white shadow-[0_6px_16px_-8px_rgba(67,146,106,.6)]'
                                                    : status === 'force_close' ? 'bg-[#E25A2B] text-white shadow-[0_6px_16px_-8px_rgba(226,90,43,.4)]'
                                                        : 'bg-[#0F1210] text-[#F6F2EA]')
                                                : 'bg-[#FBF8F1] text-[#575757] border border-[rgba(15,18,16,.12)] hover:bg-[#E9E7E2]'
                                                }`}
                                        >
                                            {status === 'none' && 'Automático'}
                                            {status === 'force_open' && 'Forzar Abierto'}
                                            {status === 'force_close' && 'Forzar Cerrado'}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-[#575757]/70 mt-2">
                                    {watchValues.override_status === 'none' && 'Usa los horarios semanales de abajo para abrir y cerrar automaticamente.'}
                                    {watchValues.override_status === 'force_open' && 'Tu tienda esta abierta ahora, sin importar los horarios de abajo.'}
                                    {watchValues.override_status === 'force_close' && 'Tu tienda esta cerrada. Los clientes ven el menu pero no pueden pedir.'}
                                </p>
                            </div>

                            <div className={watchValues.override_status !== 'none' ? 'opacity-40 pointer-events-none transition-opacity' : 'transition-opacity'}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="text-primary" size={20} />
                                    <h3 className="font-bold text-[#0F1210]">Horarios Semanales</h3>
                                </div>
                                <p className="text-sm text-[#575757] mb-4">Define tus franjas horarias. Fuera de estos horarios, el sistema se cerrara automaticamente.</p>
                                <div className="space-y-3">
                                    {DAYS.map(day => {
                                        const ranges = watchValues.schedule?.[day.id] || [];
                                        const isEnabled = ranges.length > 0;
                                        return (
                                            <div key={day.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-colors ${isEnabled ? 'bg-white border-[rgba(15,18,16,.15)]' : 'bg-transparent border-zinc-800/60'}`}>
                                                <div className="w-28 flex items-center justify-between">
                                                    <span className={`font-semibold ${isEnabled ? 'text-[#0F1210]' : 'text-[#575757]'}`}>{day.label}</span>
                                                    <label className="relative inline-flex cursor-pointer items-center sm:hidden">
                                                        <input type="checkbox" role="switch" aria-label={`Toggle horario ${day.label}`} checked={isEnabled} onChange={(e) => {
                                                            if (e.target.checked) addTimeRange(day.id);
                                                            else form.setValue(`schedule.${day.id}` as any, []);
                                                        }} className="sr-only peer" />
                                                        <div className="w-9 h-5 bg-[#E9E7E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                                    </label>
                                                </div>

                                                <div className="flex-1 flex flex-col gap-2">
                                                    {ranges.map((range: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <input
                                                                type="time"
                                                                value={range.start}
                                                                onChange={(e) => updateTimeRange(day.id, idx, 'start', e.target.value)}
                                                                className="bg-[#FBF8F1] border border-[rgba(15,18,16,.18)] text-[#0F1210] text-sm rounded-lg p-2 flex-1 focus:ring-1 focus:ring-[#43926A] focus:border-[#43926A] outline-none"
                                                            />
                                                            <span className="text-[#575757] font-bold">-</span>
                                                            <input
                                                                type="time"
                                                                value={range.end}
                                                                onChange={(e) => updateTimeRange(day.id, idx, 'end', e.target.value)}
                                                                className="bg-[#FBF8F1] border border-[rgba(15,18,16,.18)] text-[#0F1210] text-sm rounded-lg p-2 flex-1 focus:ring-1 focus:ring-[#43926A] focus:border-[#43926A] outline-none"
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
                                                        <p className="text-xs text-[#575757]/70 font-medium hidden sm:block">Cerrado este día</p>
                                                    )}
                                                </div>

                                                <div className="sm:ml-auto flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => addTimeRange(day.id)}
                                                        className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors ${isEnabled ? 'bg-[#E9E7E2] border-[rgba(15,18,16,.15)] text-[#0F1210] hover:text-[#0F1210] hover:bg-[#E9E7E2]' : 'bg-transparent border-zinc-800 text-primary hover:bg-primary/10 hover:border-primary/50'}`}
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
                                <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Direccion del Local</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                    <input
                                        {...form.register("address")}
                                        placeholder="Ej: Av. Siempreviva 742"
                                        className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-[rgba(67,146,106,.3)] focus:border-[#43926A]"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-[#575757]">Aparecera como etiqueta en el menu para que tus clientes sepan donde estas.</p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Texto de Horarios (Informativo)</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                    <input
                                        {...form.register("business_hours")}
                                        placeholder="Ej: Mar a Dom 19:00 a 24:00"
                                        className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-[rgba(67,146,106,.3)] focus:border-[#43926A]"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-amber-500/80">Solo decorativo: se muestra como etiqueta en tu tienda. La apertura/cierre real se controla en "Horarios Semanales" de arriba.</p>
                            </div>
                            {/* delivery_fee removed — use Zonas de Entrega section instead */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Compra Minima</label>
                                <div className="relative">
                                    <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                    <input
                                        type="number"
                                        min="0"
                                        {...form.register("min_order")}
                                        placeholder="Ej: 3000"
                                        className={`w-full rounded-xl border bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-[rgba(67,146,106,.3)] focus:border-[#43926A] ${form.formState.errors.min_order ? "border-red-500/50" : "border-zinc-800"}`}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-[#575757]">Monto minimo para aceptar un pedido. Si el cliente no llega, le avisamos antes de pagar.</p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Capacidad (Pedidos cada 30 min)</label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                    <input
                                        type="number"
                                        min="0"
                                        {...form.register("max_orders_per_slot")}
                                        placeholder="Ej: 15"
                                        className={`w-full rounded-xl border bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-[rgba(67,146,106,.3)] focus:border-[#43926A] ${form.formState.errors.max_orders_per_slot ? "border-red-500/50" : "border-zinc-800"}`}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-[#575757]">Evita la saturacion de tu cocina. Si se llena un horario, el cliente elige otro automaticamente.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Marketing & Contacto ── */}
                <div className="rounded-3xl border border-[rgba(15,18,16,.1)] bg-white p-6 xl:p-8 mt-6">
                    <div className="flex items-center justify-between mb-6 border-b border-[rgba(15,18,16,.1)] pb-4">
                        <h2 className="flex items-center gap-3 text-xl font-bold text-[#0F1210]">
                            <Megaphone className="text-pink-500" size={24} /> Contacto y Marketing
                        </h2>
                    </div>

                    <p className="text-sm text-[#575757] -mt-2 mb-6">Agrega tus redes sociales para que los clientes te encuentren y usa el banner para promociones activas.</p>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Instagram</label>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                <input
                                    type="text"
                                    {...form.register("instagram_url")}
                                    placeholder="Ej: https://instagram.com/mimark o @mimark"
                                    className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-pink-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Facebook</label>
                            <div className="relative">
                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                <input
                                    type="text"
                                    {...form.register("facebook_url")}
                                    placeholder="Ej: https://facebook.com/mimark"
                                    className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-pink-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-[#0F1210]">WhatsApp de Pedidos</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                <input
                                    type="text"
                                    {...form.register("public_phone")}
                                    placeholder="Ej: +54 9 11 1234-5678"
                                    className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-pink-500"
                                />
                            </div>
                            <p className="mt-1 text-xs text-[#575757]">El numero donde recibiras las notificaciones y donde tus clientes pueden escribirte ante dudas.</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Banner Promocional Superior</label>
                            <div className="relative">
                                <Megaphone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                <input
                                    type="text"
                                    {...form.register("announcement_text")}
                                    placeholder="Ej: ¡Hoy 15% OFF abonando en efectivo!"
                                    className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-pink-500"
                                />
                            </div>
                            <p className="mt-1 text-xs text-[#575757]">Aparecerá fijado en la parte más alta de tu tienda. Dejar en blanco para ocultar.</p>
                        </div>
                        <div className="md:col-span-2 mt-4 pt-4 border-t border-[rgba(15,18,16,.1)]/80">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    role="switch"
                                    aria-label="Mostrar boton de WhatsApp en el Checkout"
                                    className="sr-only peer"
                                    {...form.register('show_whatsapp_checkout')}
                                />
                                <div className="w-11 h-6 bg-[#E9E7E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                <span className="ml-3 text-sm font-semibold text-[#0F1210]">Mostrar boton de WhatsApp en el Checkout</span>
                            </label>
                            <p className="text-xs text-[#575757] mt-1 ml-14">Si lo activas, el cliente podra escribirte por WhatsApp mientras esta completando su pedido, ideal para resolver dudas antes de pagar.</p>
                        </div>
                    </div>
                </div>

                {/* ── MP Integration ── */}
                <div className="rounded-3xl border border-[rgba(15,18,16,.1)] bg-white p-6 xl:p-8 mt-6">
                    <div className="flex items-center justify-between mb-6 border-b border-[rgba(15,18,16,.1)] pb-4">
                        <h2 className="flex items-center gap-3 text-xl font-bold text-[#0F1210]">
                            <CreditCard className="text-sky-500" size={24} />
                            <span>Pasarela de Pagos <span className="text-sky-400">(Mercado Pago)</span></span>
                        </h2>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                role="switch"
                                aria-label="Activar MercadoPago"
                                className="sr-only peer"
                                {...form.register('is_mp_active')}
                            />
                            <div className="w-11 h-6 bg-[#E9E7E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            <span className="ml-3 text-sm font-bold text-[#0F1210] uppercase tracking-wider">Activar</span>
                        </label>
                    </div>

                    <div className={`space-y-6 transition-opacity duration-300 ${watchValues.is_mp_active ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        <p className="text-sm text-[#575757] -mt-2">Conecta tu cuenta de Mercado Pago y recibiras el dinero de cada venta directo en tu cuenta, al instante. Nosotros nunca tocamos tu plata.</p>

                        <div className="grid gap-8 lg:grid-cols-2">
                            {/* Left — Credentials form */}
                            <div className="space-y-5">
                                <h3 className="text-sm font-bold text-[#0F1210] uppercase tracking-wider">Tus credenciales</h3>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Public Key (Clave Publica)</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                        <input
                                            type={showMPPublicKey ? "text" : "password"}
                                            {...form.register("mp_public_key")}
                                            placeholder="APP_USR-..."
                                            className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-12 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                                        />
                                        <button type="button" onClick={() => setShowMPPublicKey(!showMPPublicKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#575757] hover:text-[#0F1210] transition-colors">
                                            {showMPPublicKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Access Token (Token de Acceso)</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                        <input
                                            type={showMPAccessToken ? "text" : "password"}
                                            {...form.register("mp_access_token")}
                                            placeholder="APP_USR-..."
                                            className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-12 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                                        />
                                        <button type="button" onClick={() => setShowMPAccessToken(!showMPAccessToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#575757] hover:text-[#0F1210] transition-colors">
                                            {showMPAccessToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right — Step by step guide */}
                            <div className="rounded-2xl border border-sky-500/10 bg-sky-50 p-5">
                                <h3 className="text-sm font-bold text-sky-400 mb-4">¿Como obtener mis credenciales?</h3>
                                <ol className="space-y-3.5">
                                    {[
                                        <>Ingresa a <span className="font-semibold text-[#0F1210]">Mercado Pago Developers</span> (Tus integraciones) con tu cuenta de siempre.</>,
                                        <>Hace clic en el boton azul <span className="font-semibold text-[#0F1210]">&quot;Crear aplicacion&quot;</span>.</>,
                                        <>Pone el nombre de tu local y selecciona que vas a usar el <span className="font-semibold text-[#0F1210]">&quot;Checkout Pro&quot;</span>.</>,
                                        <>Una vez creada, en el menu izquierdo anda a <span className="font-semibold text-[#0F1210]">&quot;Credenciales de Produccion&quot;</span>. <span className="text-amber-400 font-medium">¡Asegurate de que sean las de produccion y no las de prueba!</span></>,
                                        <>Copia la <span className="font-semibold text-[#0F1210]">Public Key</span> y el <span className="font-semibold text-[#0F1210]">Access Token</span> y pegalos en los campos de la izquierda.</>,
                                        <>¡Listo! La plata de tus ventas va directo a tu cuenta al instante.</>,
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="shrink-0 w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm text-[#575757] leading-relaxed">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Comandas y Operación ── */}
                <div className="rounded-3xl border border-[rgba(15,18,16,.1)] bg-white p-6 xl:p-8 mt-6">
                    <div className="flex items-center justify-between mb-6 border-b border-[rgba(15,18,16,.1)] pb-4">
                        <h2 className="flex items-center gap-3 text-xl font-bold text-[#0F1210]">
                            <ShoppingCart className="text-amber-500" size={24} /> Operación y Comandas
                        </h2>
                    </div>

                    <p className="text-sm text-[#575757] -mt-2 mb-6">Activa la impresion de tickets para que tu cocina y repartidores tengan toda la info del pedido en papel.</p>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-[rgba(15,18,16,.1)] bg-[#FBF8F1]">
                            <div>
                                <h3 className="text-sm font-bold text-[#0F1210]">Comandas de Cocina</h3>
                                <p className="text-xs text-[#575757]">Tickets sin precios para la preparación.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    role="switch"
                                    aria-label="Activar comandas de cocina"
                                    className="sr-only peer"
                                    {...form.register('enable_kitchen_tickets')}
                                />
                                <div className="w-11 h-6 bg-[#E9E7E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border border-[rgba(15,18,16,.1)] bg-[#FBF8F1]">
                            <div>
                                <h3 className="text-sm font-bold text-[#0F1210]">Tickets de Repartidor</h3>
                                <p className="text-xs text-[#575757]">Tickets con precios y datos de cliente.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    role="switch"
                                    aria-label="Activar tickets de repartidor"
                                    className="sr-only peer"
                                    {...form.register('enable_delivery_tickets')}
                                />
                                <div className="w-11 h-6 bg-[#E9E7E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* ── Visibilidad en el Directorio ── */}
                <div className="rounded-3xl border border-[rgba(67,146,106,.2)] bg-white p-6 xl:p-8 mt-6">
                    <div className="flex items-center justify-between mb-6 border-b border-[rgba(15,18,16,.1)] pb-4">
                        <h2 className="flex items-center gap-3 text-xl font-bold text-[#0F1210]">
                            <Map className="text-primary" size={24} /> Visibilidad en el Directorio Público
                        </h2>
                    </div>

                    <p className="text-sm text-[#575757] -mt-2 mb-6">
                        Aparecé en nuestro directorio gastronómico para que los clientes de tu ciudad te encuentren. Configurá tu ciudad y las categorías donde querés aparecer.
                    </p>

                    {/* City selection first */}
                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Tu ciudad</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                            <select
                                {...form.register("city", {
                                    onChange: (e) => {
                                        if (!e.target.value) form.setValue("is_directory_active", false);
                                    }
                                })}
                                className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-[rgba(67,146,106,.3)] focus:border-[#43926A] appearance-none"
                            >
                                <option value="">Seleccioná tu ciudad</option>
                                {availableCities.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                            </select>
                        </div>
                        {!watchValues.city && (
                            <p className="text-[11px] text-amber-500/80 mt-2 font-medium">
                                Si tu ciudad no aparece en la lista, estará disponible próximamente. Podés seguir usando tu tienda normalmente.
                            </p>
                        )}
                        {watchValues.city && (
                            <p className="text-[11px] text-[#575757]/70 mt-1.5">Los clientes te encontrarán en pedidosposta.com/directorio/{watchValues.city}</p>
                        )}
                    </div>

                    {/* Toggle only if city selected */}
                    {watchValues.city && (
                        <>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-[rgba(15,18,16,.1)] bg-[#FBF8F1] mb-5">
                                <div>
                                    <h3 className="text-sm font-bold text-[#0F1210]">Visible en el Directorio</h3>
                                    <p className="text-xs text-[#575757]">Si está activo, tu local aparecerá en el directorio de {availableCities.find(c => c.slug === watchValues.city)?.name || watchValues.city}.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        role="switch"
                                        aria-label="Visible en directorio"
                                        className="sr-only peer"
                                        checked={watchValues.is_directory_active}
                                        onChange={e => form.setValue("is_directory_active", e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-[#E9E7E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {watchValues.is_directory_active && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Categorías (elegí una o más)</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {CATEGORIES.map(cat => {
                                            const selected = (watchValues.categories || []).includes(cat.key);
                                            return (
                                                <button
                                                    key={cat.key}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = watchValues.categories || [];
                                                        form.setValue("categories", selected
                                                            ? current.filter((k: string) => k !== cat.key)
                                                            : [...current, cat.key]
                                                        );
                                                    }}
                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                                                        selected
                                                            ? "bg-primary/15 text-primary border border-primary/30"
                                                            : "bg-[#FBF8F1] text-[#575757] border border-[rgba(15,18,16,.12)] hover:border-[rgba(15,18,16,.15)]"
                                                    }`}
                                                >
                                                    <span className="text-lg">{cat.emoji}</span>
                                                    {cat.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[11px] text-[#575757]/70 mt-1.5">Seleccioná las categorías que mejor describan tu local.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Transfer Integration ── */}
                <div className="rounded-3xl border border-[rgba(15,18,16,.1)] bg-white p-6 xl:p-8 mt-6">
                    <div className="flex items-center justify-between mb-6 border-b border-[rgba(15,18,16,.1)] pb-4">
                        <h2 className="flex items-center gap-3 text-xl font-bold text-[#0F1210]">
                            <ArrowRightLeft className="text-amber-500" size={24} /> Transferencia Bancaria
                        </h2>
                    </div>

                    <p className="text-sm text-[#575757] -mt-2 mb-6">Configurá el Alias, CBU o CVU donde los clientes deben realizar las transferencias.</p>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Alias / CBU / CVU</label>
                            <div className="relative">
                                <ArrowRightLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                <input
                                    type="text"
                                    {...form.register("transfer_alias")}
                                    placeholder="Ej: PEDIDO.POSTA.MP o 00000031000..."
                                    className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Nombre del Titular de la Cuenta</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                <input
                                    type="text"
                                    {...form.register("transfer_account_name")}
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Logistics & Zones ── */}
                <div className="rounded-3xl border border-[rgba(15,18,16,.1)] bg-white p-6 xl:p-8 mt-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-6 border-b border-[rgba(15,18,16,.1)] pb-4">
                        <h2 className="flex items-center gap-3 text-xl font-bold text-[#0F1210]">
                            <Bike className="text-emerald-500" size={24} /> Logística y Zonas de Entrega
                        </h2>
                    </div>

                    {/* Delivery method toggles */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${watchValues.enable_delivery ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-[#FBF8F1]/30"}`}>
                            <div>
                                <h3 className="text-sm font-bold text-[#0F1210]">Delivery</h3>
                                <p className="text-[10px] text-[#575757]">Envío a domicilio</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={watchValues.enable_delivery} onChange={e => form.setValue("enable_delivery", e.target.checked)} />
                                <div className="w-11 h-6 bg-[#E9E7E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>
                        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${watchValues.enable_takeaway ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-[#FBF8F1]/30"}`}>
                            <div>
                                <h3 className="text-sm font-bold text-[#0F1210]">Takeaway</h3>
                                <p className="text-[10px] text-[#575757]">Retiro en el local (gratis)</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={watchValues.enable_takeaway} onChange={e => form.setValue("enable_takeaway", e.target.checked)} />
                                <div className="w-11 h-6 bg-[#E9E7E2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>
                    </div>
                    {!watchValues.enable_delivery && !watchValues.enable_takeaway && (
                        <p className="text-xs text-red-400 font-semibold mb-4">Necesitás al menos un método de entrega activo.</p>
                    )}

                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Configuración */}
                        <div className="space-y-6">
                            <div>
                                <label className="mb-3 block text-sm font-semibold text-[#0F1210]">Tipo de Cobro</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => form.setValue("delivery_pricing_type", "fixed", { shouldDirty: true })}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 text-sm font-bold transition-all ${watchValues.delivery_pricing_type === "fixed" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-zinc-800 bg-[#FBF8F1]/30 text-[#575757] hover:bg-white/50"}`}
                                    >
                                        Costo Fijo
                                        <span className="text-[10px] font-normal opacity-60">Precio único</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => form.setValue("delivery_pricing_type", "distance", { shouldDirty: true })}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 text-sm font-bold transition-all ${watchValues.delivery_pricing_type === "distance" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-zinc-800 bg-[#FBF8F1]/30 text-[#575757] hover:bg-white/50"}`}
                                    >
                                        Por Distancia
                                        <span className="text-[10px] font-normal opacity-60">Base + extra x KM</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Direccion del Local (Google Maps)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#575757]" size={18} />
                                    <input
                                        type="text"
                                        value={addressValue}
                                        onChange={(e) => {
                                            setAddressValue(e.target.value);
                                            form.setValue("store_address", e.target.value, { shouldDirty: true });
                                        }}
                                        disabled={!ready || !isLoaded}
                                        placeholder={!isLoaded ? "Cargando Google Maps..." : "Buscá la dirección del local..."}
                                        className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] pl-10 pr-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:text-[#575757]"
                                    />
                                    {status === "OK" && (
                                        <ul className="absolute z-50 w-full mt-2 bg-white border border-[rgba(15,18,16,.12)] rounded-xl overflow-hidden shadow-xl">
                                            {data.map(({ place_id, description }) => (
                                                <li
                                                    key={place_id}
                                                    onClick={() => {
                                                        setAddressValue(description, false);
                                                        clearSuggestions();
                                                        form.setValue("store_address", description, { shouldDirty: true });
                                                        // Reset session token after a selection to begin a new session
                                                        if (window.google?.maps?.places) {
                                                            setMapSessionToken(new window.google.maps.places.AutocompleteSessionToken());
                                                        }
                                                    }}
                                                    className="px-4 py-3 text-sm text-[#0F1210] hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer border-b border-[rgba(15,18,16,.1)]/50 last:border-0"
                                                >
                                                    {description}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Radio de Entrega (KM)</label>
                                    <input
                                        type="number"
                                        {...form.register("delivery_radius_km")}
                                        className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] px-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-[#575757] mt-1">Define el area de cobertura desde tu local. Los clientes fuera de este radio no podran pedir delivery.</p>
                                </div>

                                {watchValues.delivery_pricing_type === "fixed" ? (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Precio Fijo Envio ($)</label>
                                        <input
                                            type="number"
                                            {...form.register("fixed_delivery_price")}
                                            className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] px-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <p className="text-xs text-[#575757] mt-1">Este monto se suma automaticamente al total del pedido. Pone $0 para envios gratis.</p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Precio Base ($)</label>
                                        <input
                                            type="number"
                                            {...form.register("base_delivery_price")}
                                            className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] px-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <p className="text-xs text-[#575757] mt-1">El costo minimo del envio. Se cobra hasta los KMs base incluidos.</p>
                                    </div>
                                )}
                            </div>

                            {watchValues.delivery_pricing_type === "distance" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-[#0F1210]">KMs Base incluidos</label>
                                        <input
                                            type="number"
                                            {...form.register("base_delivery_km")}
                                            className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] px-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <p className="text-xs text-[#575757] mt-1">Ej: 2 (Hasta cuántos kilómetros se cobra solo el precio base. Debe ser MENOR al Radio de Entrega).</p>
                                        {Number(watchValues.base_delivery_km) > Number(watchValues.delivery_radius_km) && (
                                            <p className="text-xs text-red-500 mt-1 font-medium">Los KMs base no pueden ser mayores al Radio de Entrega máximo.</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-[#0F1210]">Precio Extra x KM ($)</label>
                                        <input
                                            type="number"
                                            {...form.register("extra_price_per_km")}
                                            className="w-full rounded-xl border border-[rgba(15,18,16,.18)] bg-[#FBF8F1] px-4 py-3 text-[#0F1210] outline-none transition focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <p className="text-xs text-[#575757] mt-1">Ej: 500 (Cuánto se suma por cada kilómetro adicional que supere los KMs Base).</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mapa Visual */}
                        <div className="h-[400px] w-full rounded-2xl border border-[rgba(15,18,16,.12)] overflow-hidden relative group">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '0.5rem' }}
                                    center={mapCenter || { lat: -34.6514, lng: -59.4322 }}
                                    zoom={13}
                                    options={{ disableDefaultUI: true, zoomControl: true }}
                                >
                                    {mapCenter ? (
                                        <>
                                            <Marker position={mapCenter} />
                                            {watchValues.delivery_radius_km && Number(watchValues.delivery_radius_km) > 0 ? (
                                                <Circle
                                                    center={mapCenter}
                                                    radius={Number(watchValues.delivery_radius_km) * 1000}
                                                    options={circleOptions}
                                                />
                                            ) : null}
                                        </>
                                    ) : null}
                                </GoogleMap>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-[#FBF8F1] text-[#575757] text-sm italic">
                                    Cargando mapa de cobertura...
                                </div>
                            )}
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-[rgba(15,18,16,.12)] text-[10px] font-bold text-[#575757] uppercase tracking-widest pointer-events-none">
                                Area de Delivery
                            </div>
                            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-[rgba(15,18,16,.12)] text-[10px] text-[#575757] pointer-events-none">
                                El circulo rojo marca hasta donde llegan tus envios
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dominio Propio removido — v2.0 */}

                <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center sm:justify-end border-t border-[rgba(15,18,16,.1)]/80 bg-[#FBF8F1]/80 px-4 sm:px-6 py-4 backdrop-blur-xl md:left-64">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-6 sm:px-8 py-3 font-extrabold text-[#09090b] transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50 shadow-[0_0_20px_var(--brand-color)]"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Guardar Configuración
                    </button>
                </div>
            </form>
        </div>
    );
}
