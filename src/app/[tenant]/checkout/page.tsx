"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    ArrowLeft,
    Banknote,
    CheckCircle2,
    ChevronDown,
    Clock,
    MapPin,
    Package,
    Smartphone,
    Truck,
    Upload,
    FileText,
    MessageCircle,
    Loader2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { useCartStore } from "@/lib/store/cartStore";
import { createClient } from "@/lib/supabase/client";
import { generateAvailableSlots } from "@/lib/utils/timeSlots";
import { calculateDistance } from "@/lib/utils/geo";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import { useJsApiLoader } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const checkoutSchema = z
    .object({
        firstName: z.string().min(2, "Ingresá tu nombre"),
        lastName: z.string().min(2, "Ingresá tu apellido"),
        email: z.string().email("Email inválido"),
        phone: z.string().min(8, "Teléfono inválido"),
        deliveryMethod: z.enum(["DELIVERY", "TAKEAWAY"]),
        address: z.string().optional(),
        betweenStreets: z.string().optional(),
        houseNumber: z.string().optional(),
        apartment: z.string().optional(),
        notes: z.string().optional(),
        deliveryTime: z.string().optional(),
        is_asap: z.boolean(),
        paymentMethod: z.enum(["CASH", "TRANSFER"]),
    })
    .refine((data) => data.deliveryMethod === "TAKEAWAY" || (data.address && data.address.length >= 3), {
        message: "Ingresá la calle de entrega",
        path: ["address"],
    })
    .refine((data) => data.deliveryMethod === "TAKEAWAY" || (data.betweenStreets && data.betweenStreets.length >= 3), {
        message: "Ingresá las entre calles o esquina",
        path: ["betweenStreets"],
    })
    .refine((data) => data.deliveryMethod === "TAKEAWAY" || (data.houseNumber && data.houseNumber.length >= 1), {
        message: "Ingresá el número/altura",
        path: ["houseNumber"],
    });

type CheckoutForm = z.infer<typeof checkoutSchema>;

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CheckoutPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant: tenantSlug } = React.use(params);
    const router = useRouter();
    const { items, clearCart } = useCartStore();
    const supabase = createClient();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<"CASH" | "TRANSFER" | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [tenantAlias, setTenantAlias] = useState<string | null>(null);
    const [whatsappSettings, setWhatsappSettings] = useState<{ show: boolean; phone: string | null }>({ show: false, phone: null });

    const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(true);
    const [scheduleType, setScheduleType] = useState<"asap" | "scheduled">("asap");

    const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const [deliveryCost, setDeliveryCost] = useState(0);
    const [isOutOfBounds, setIsOutOfBounds] = useState(false);
    const [pricingRules, setPricingRules] = useState<any>(null);

    const [isLocating, setIsLocating] = useState(false);
    const [usedGPS, setUsedGPS] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [mapSessionToken, setMapSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);
    const betweenStreetsRef = React.useRef<HTMLInputElement>(null);
    const houseNumberRef = React.useRef<HTMLInputElement>(null);

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
        debounce: 600,
    });

    React.useEffect(() => {
        if (isLoaded) {
            init();
            if (window.google?.maps?.places && !mapSessionToken) {
                setMapSessionToken(new window.google.maps.places.AutocompleteSessionToken());
            }
        }
    }, [isLoaded, init, mapSessionToken]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CheckoutForm>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: { deliveryMethod: "DELIVERY", is_asap: true },
    });

    const deliveryMethod = watch("deliveryMethod");
    const total = subtotal + (deliveryMethod === "DELIVERY" ? deliveryCost : 0);

    const selectPayment = (m: "CASH" | "TRANSFER") => {
        setSelectedPayment(m);
        setValue("paymentMethod", m, { shouldValidate: true });
    };

    React.useEffect(() => {
        const fetchAvailability = async () => {
            setIsLoadingSlots(true);
            try {
                const { data: tenantData } = await supabase
                    .from("tenants")
                    .select("id, schedule, max_orders_per_slot, transfer_alias, show_whatsapp_checkout, public_phone, delivery_pricing_type, delivery_radius_km, fixed_delivery_price, base_delivery_price, base_delivery_km, extra_price_per_km")
                    .eq("slug", tenantSlug)
                    .single();
                if (!tenantData) return;

                setTenantAlias(tenantData.transfer_alias);
                setWhatsappSettings({ show: !!tenantData.show_whatsapp_checkout, phone: tenantData.public_phone });
                setPricingRules(tenantData);

                // Initial fallbacks based on pricing type
                if (tenantData.delivery_pricing_type === 'fixed') {
                    setDeliveryCost(tenantData.fixed_delivery_price || 0);
                } else {
                    setDeliveryCost(tenantData.base_delivery_price || 0);
                }

                // Cargar datos desde caché si existen
                const cached = localStorage.getItem('pedidosposta_user_location');
                if (cached) {
                    try {
                        const d = JSON.parse(cached);
                        if (d.client_name) {
                            const parts = d.client_name.split(' ');
                            setValue("firstName", parts[0] || "");
                            setValue("lastName", parts.slice(1).join(' ') || "");
                        }
                        if (d.email) setValue("email", d.email);
                        if (d.phone) setValue("phone", d.phone);
                        if (d.address) setValue("address", d.address);

                        // Si hay costo en caché, usarlo (es el calculado en el CartDrawer con Distance Matrix)
                        if (d.shipping_cost !== undefined) {
                            setDeliveryCost(d.shipping_cost);
                        }

                        // Validar radio desde el caché
                        if (d.distance_km && tenantData.delivery_radius_km && d.distance_km > tenantData.delivery_radius_km) {
                            setIsOutOfBounds(true);
                        }
                    } catch (e) { }
                }

                const today = new Date().toISOString().split('T')[0];
                const { data: orders } = await supabase
                    .from("orders")
                    .select("is_asap, scheduled_time")
                    .eq("tenant_id", tenantData.id)
                    .in("status", ["pending", "confirmed", "in_preparation", "ready", "delivered"])
                    .gte("created_at", today);

                const validated = generateAvailableSlots(tenantData.schedule, tenantData.max_orders_per_slot, orders || []);
                setTimeSlots(validated);
                if (scheduleType === "asap") {
                    setValue("is_asap", true);
                    setValue("deliveryTime", "");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchAvailability();
    }, [tenantSlug, supabase, scheduleType, setValue]);

    const handleAddressSelect = async (addressStr: string) => {
        setAddressValue(addressStr, false);
        clearSuggestions();
        setValue("address", addressStr, { shouldValidate: true });

        if (!pricingRules || pricingRules.delivery_pricing_type === "fixed") return;

        try {
            const results = await getGeocode({ address: addressStr });
            const { lat, lng } = await getLatLng(results[0]);
            setSelectedCoords({ lat, lng });

            if (pricingRules.store_address) {
                const originResults = await getGeocode({ address: pricingRules.store_address });
                const originLatLng = await getLatLng(originResults[0]);
                const rawDistance = calculateDistance(originLatLng.lat, originLatLng.lng, lat, lng);
                const finalDistance = Math.round(rawDistance * 10) / 10;

                if (finalDistance > pricingRules.delivery_radius_km) {
                    setIsOutOfBounds(true);
                    toast.error(`Fuera del radio de entrega (${pricingRules.delivery_radius_km}km)`);
                } else {
                    setIsOutOfBounds(false);
                    if (finalDistance <= pricingRules.base_delivery_km) {
                        setDeliveryCost(Math.round(pricingRules.base_delivery_price));
                    } else {
                        const extraKm = finalDistance - pricingRules.base_delivery_km;
                        const cost = pricingRules.base_delivery_price + (extraKm * pricingRules.extra_price_per_km);
                        setDeliveryCost(Math.round(cost));
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleGeolocation = () => {
        if (!navigator.geolocation) {
            toast.error("Tu navegador no soporta geolocalización.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                try {
                    const results = await getGeocode({ location: { lat, lng } });
                    
                    // Extraer solo la calle si es posible para que el usuario ponga el número manual
                    const streetName = results[0].address_components.find(c => c.types.includes("route"))?.long_name || results[0].formatted_address.split(',')[0];
                    
                    setAddressValue(streetName, false);
                    setValue("address", streetName, { shouldValidate: true });
                    setUsedGPS(true);
                    setSelectedCoords({ lat, lng });

                    // Auto-focus en entre calles y luego altura
                    setTimeout(() => betweenStreetsRef.current?.focus(), 100);

                    if (pricingRules?.store_address) {
                        const originResults = await getGeocode({ address: pricingRules.store_address });
                        const originLatLng = await getLatLng(originResults[0]);
                        const rawDistance = calculateDistance(originLatLng.lat, originLatLng.lng, lat, lng);
                        const finalDistance = Math.round(rawDistance * 10) / 10;

                        if (finalDistance > pricingRules.delivery_radius_km) {
                            setIsOutOfBounds(true);
                            toast.error(`Ubicación fuera de radio (${pricingRules.delivery_radius_km}km)`);
                        } else {
                            setIsOutOfBounds(false);
                            if (finalDistance <= pricingRules.base_delivery_km) {
                                setDeliveryCost(Math.round(pricingRules.base_delivery_price));
                            } else {
                                const extraKm = finalDistance - pricingRules.base_delivery_km;
                                const cost = pricingRules.base_delivery_price + (extraKm * pricingRules.extra_price_per_km);
                                setDeliveryCost(Math.round(cost));
                            }
                        }
                    }
                } catch (e) {
                    toast.error("No pudimos obtener tu dirección exacta.");
                } finally {
                    setIsLocating(false);
                }
            },
            () => {
                setIsLocating(false);
                toast.error("Error al obtener ubicación.");
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    // ─── Submit ──────────────────────────────────────────────────────────────────

    const onSubmit = async (data: CheckoutForm) => {
        if (items.length === 0) {
            toast.error("Tu carrito está vacío");
            return;
        }
        setIsSubmitting(true);

        try {
            // 1. Resolve tenant_id from slug
            const { data: tenant, error: tenantErr } = await supabase
                .from("tenants")
                .select("id")
                .eq("slug", tenantSlug)
                .single();

            if (tenantErr || !tenant) throw new Error("Local no encontrado");

            // Preparar scheduled_time si no es ASAP
            let scheduledTime = null;
            if (!data.is_asap && data.deliveryTime) {
                // Formatear la hora ("HH:mm") a un TIMESTAMPTZ representativo del día de hoy
                const [hours, mins] = data.deliveryTime.split(':').map(Number);
                const scheduledDate = new Date();
                scheduledDate.setHours(hours, mins, 0, 0);
                scheduledTime = scheduledDate.toISOString();
            }

            // Upload receipt if transfer
            let receiptUrl: string | null = null;
            if (data.paymentMethod === "TRANSFER" && receiptFile) {
                const fileExt = receiptFile.name.split(".").pop();
                const filePath = `${tenant.id}/${Date.now()}.${fileExt}`;
                const { error: uploadErr } = await supabase.storage
                    .from("receipts")
                    .upload(filePath, receiptFile);
                if (uploadErr) console.error("Upload error:", uploadErr);
                else {
                    const { data: publicUrl } = supabase.storage
                        .from("receipts")
                        .getPublicUrl(filePath);
                    receiptUrl = publicUrl.publicUrl;
                }
            }

            // 2. Insert the order
            const finalAddress = data.deliveryMethod === "DELIVERY"
                ? `${data.address} ${data.houseNumber} (Entre: ${data.betweenStreets})${data.apartment ? `, Piso/Depto: ${data.apartment}` : ""}`
                : null;

            const { data: order, error: orderErr } = await supabase
                .from("orders")
                .insert({
                    tenant_id: tenant.id,
                    first_name: data.firstName,
                    last_name: data.lastName,
                    email: data.email,
                    customer_phone: data.phone,
                    customer_address: finalAddress,
                    customer_notes: data.notes || null,
                    delivery_method: data.deliveryMethod,
                    is_asap: data.is_asap,
                    scheduled_time: scheduledTime,
                    payment_method: data.paymentMethod,
                    status: "pending",
                    total_amount: total,
                    customer_name: `${data.firstName} ${data.lastName}`,
                    receipt_url: receiptUrl,
                })
                .select("id, order_number")
                .single();

            if (orderErr || !order) throw orderErr;

            // 3. Insert order_items
            const orderItems = items.map((item) => ({
                order_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity,
                notes: item.modifiersText || null,
            }));

            const { error: itemsErr } = await supabase
                .from("order_items")
                .insert(orderItems);

            if (itemsErr) {
                throw new Error(
                    "DB Error -> Mensaje: " + (itemsErr.message || 'N/A') +
                    " | Detalles: " + (itemsErr.details || 'N/A') +
                    " | Hint: " + (itemsErr.hint || 'N/A')
                );
            }

            // 4. Done! Save to localStorage for recovery banner
            // OPTIMIZACIÓN: Guardar datos en caché
            const cacheData = {
                address: data.deliveryMethod === "DELIVERY" ? data.address : null,
                lat: selectedCoords?.lat || null,
                lng: selectedCoords?.lng || null,
                distance_km: 0, // Could be recalculated if needed
                shipping_cost: deliveryCost,
                client_name: `${data.firstName} ${data.lastName}`,
                email: data.email,
                phone: data.phone
            };
            localStorage.setItem('pedidosposta_user_location', JSON.stringify(cacheData));

            try { localStorage.setItem(`active_order_${tenantSlug}`, order.id); } catch { }
            clearCart();
            router.push(`/${tenantSlug}/order/${order.id}`);
        } catch (err: any) {
            console.error(err);
            toast.error("Error al confirmar el pedido", {
                description: err?.message ?? "Intentá de nuevo en un momento.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-zinc-950 pb-32 pt-6">
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            <div className="mx-auto max-w-lg px-4">
                {/* Back */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-100"
                >
                    <ArrowLeft size={16} /> Volver al menú
                </button>

                <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-white">
                    Checkout <span className="text-primary">Pulse</span>
                </h1>
                <p className="mb-8 text-sm text-zinc-400">
                    Completá tus datos para confirmar el pedido.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                    {/* ── 1. Datos del Cliente ── */}
                    <Section title="Datos del Cliente">
                        <div className="flex flex-col gap-4">
                            <Field label="Nombre" error={errors.firstName?.message}>
                                <input {...register("firstName")} placeholder="Juan" className={inputCls(!!errors.firstName)} />
                            </Field>
                            <Field label="Apellido" error={errors.lastName?.message}>
                                <input {...register("lastName")} placeholder="Pérez" className={inputCls(!!errors.lastName)} />
                            </Field>
                            <Field label="Email" error={errors.email?.message}>
                                <input {...register("email")} type="email" placeholder="juan@email.com" className={inputCls(!!errors.email)} />
                            </Field>
                            <Field label="Teléfono / WhatsApp" error={errors.phone?.message}>
                                <input {...register("phone")} type="tel" placeholder="+54 9 11 0000 0000" className={inputCls(!!errors.phone)} />
                            </Field>
                        </div>
                    </Section>

                    {/* ── 2. Método de Entrega ── */}
                    <Section title="Método de Entrega">
                        <div className="grid grid-cols-2 gap-3">
                            {(["DELIVERY", "TAKEAWAY"] as const).map((m) => {
                                const isActive = deliveryMethod === m;
                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setValue("deliveryMethod", m, { shouldValidate: true })}
                                        className={`flex flex-col items-center gap-2 rounded-xl border py-4 text-sm font-semibold transition-all ${isActive
                                            ? "border-primary bg-primary/10 text-primary shadow-[0_0_14px_var(--brand-color)] shadow-primary/20"
                                            : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600"
                                            }`}
                                    >
                                        {m === "DELIVERY" ? <Truck size={22} /> : <Package size={22} />}
                                        {m === "DELIVERY" ? "Delivery" : "Retiro en Local"}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dirección — solo si Delivery */}
                        <div
                            className={`overflow-hidden transition-all duration-300 ${deliveryMethod === "DELIVERY" ? "max-h-[1000px] opacity-100 mt-6" : "max-h-0 opacity-0"
                                }`}
                        >
                            <div className="flex flex-col gap-5">
                                <Field label="Calle de entrega" error={errors.address?.message}>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                                        <input
                                            value={addressValue}
                                            onChange={(e) => {
                                                setAddressValue(e.target.value);
                                                setValue("address", e.target.value);
                                            }}
                                            disabled={!ready || !isLoaded}
                                            placeholder="Ej: Calle San Martín"
                                            className={`${inputCls(!!errors.address)} pl-9`}
                                        />
                                    </div>
                                    {usedGPS && (
                                        <p className="mt-1 ml-1 text-[10px] font-bold text-amber-500 animate-pulse">
                                            ⚠️ Verificá la calle. A veces el GPS marca la esquina. Podés editarla.
                                        </p>
                                    )}

                                    {status === "OK" && (
                                        <ul className="mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl relative z-20">
                                            {data.map(({ place_id, description }) => (
                                                <li
                                                    key={place_id}
                                                    onClick={() => handleAddressSelect(description)}
                                                    className="px-4 py-3 text-sm text-zinc-300 hover:bg-primary/20 hover:text-primary cursor-pointer border-b border-zinc-800/50 last:border-0 transition-colors"
                                                >
                                                    {description}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </Field>

                                <Field label="Entre Calles 🚦 (o esquina) *" error={errors.betweenStreets?.message}>
                                    <input
                                        {...register("betweenStreets")}
                                        ref={(e) => {
                                            register("betweenStreets").ref(e);
                                            // @ts-ignore
                                            betweenStreetsRef.current = e;
                                        }}
                                        placeholder="Entre calles o esquina / Ej: Calle 16 y 18"
                                        className={inputCls(!!errors.betweenStreets)}
                                    />
                                </Field>

                                <Field label="Altura / Nº *" error={errors.houseNumber?.message}>
                                    <input
                                        {...register("houseNumber")}
                                        ref={(e) => {
                                            register("houseNumber").ref(e);
                                            // @ts-ignore
                                            houseNumberRef.current = e;
                                        }}
                                        placeholder="Ej: 1226"
                                        className={inputCls(!!errors.houseNumber)}
                                    />
                                </Field>

                                <Field label="Piso / Depto" error={errors.apartment?.message}>
                                    <input
                                        {...register("apartment")}
                                        placeholder="Ej: 3B"
                                        className={inputCls(!!errors.apartment)}
                                    />
                                </Field>

                                <button
                                    type="button"
                                    onClick={handleGeolocation}
                                    disabled={isLocating}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-4 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                                >
                                    {isLocating ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    ) : (
                                        <MapPin size={14} className="text-primary" />
                                    )}
                                    📍 Usar mi ubicación actual (GPS)
                                </button>
                            </div>
                            <Field label="Notas de envío (opcional)" error={undefined}>
                                <textarea
                                    {...register("notes")}
                                    placeholder="Timbre no funciona, piso 3, etc."
                                    rows={2}
                                    className={`${inputCls(false)} resize-none`}
                                />
                            </Field>
                        </div>
                    </Section>

                    {/* ── 3. Horario ── */}
                    <Section title="Cuándo querés tu pedido">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => { setScheduleType("asap"); setValue("is_asap", true, { shouldValidate: true }); setValue("deliveryTime", "") }}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-semibold transition ${scheduleType === "asap" ? "border-primary bg-primary/10 text-primary" : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                                    }`}
                            >
                                Lo antes posible (ASAP)
                            </button>
                            <button
                                type="button"
                                onClick={() => { setScheduleType("scheduled"); setValue("is_asap", false); setValue("deliveryTime", "", { shouldValidate: true }) }}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-semibold transition ${scheduleType === "scheduled" ? "border-primary bg-primary/10 text-primary" : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                                    }`}
                            >
                                Programar horario
                            </button>
                        </div>

                        {scheduleType === "scheduled" && (
                            <Field label="Elegí tu horario" error={errors.deliveryTime?.message}>
                                <div className="relative">
                                    <Clock size={16} className="pointer-events-none absolute left-3 top-3.5 text-zinc-500" />
                                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5 text-zinc-500" />
                                    <select
                                        {...register("deliveryTime")}
                                        className={`${inputCls(!!errors.deliveryTime)} appearance-none pl-9 pr-8 bg-zinc-950`}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            {isLoadingSlots ? "Cargando horarios..." : "Seleccioná una hora..."}
                                        </option>
                                        {timeSlots.map((slot) => (
                                            <option key={slot.time} value={slot.time} disabled={!slot.available}>
                                                {slot.time} hs {!slot.available && "(Agotado)"}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </Field>
                        )}
                    </Section>

                    {/* ── 4. Método de Pago ── */}
                    <Section title="Método de Pago">
                        <div className="grid grid-cols-2 gap-3">
                            <PaymentCard icon={<Banknote size={22} />} label="Efectivo" selected={selectedPayment === "CASH"} onClick={() => { selectPayment("CASH"); setReceiptFile(null); }} />
                            <PaymentCard icon={<Smartphone size={22} />} label="Transferencia" selected={selectedPayment === "TRANSFER"} onClick={() => selectPayment("TRANSFER")} />
                        </div>
                        {errors.paymentMethod && (
                            <p className="mt-2 text-xs text-red-400">{errors.paymentMethod.message}</p>
                        )}
                        <input type="hidden" {...register("paymentMethod")} />

                        {/* Receipt upload — only for TRANSFER */}
                        {selectedPayment === "TRANSFER" && tenantAlias && (
                            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 animate-in fade-in slide-in-from-top-4">
                                <h4 className="mb-2 text-sm font-extrabold text-amber-400">Datos para la Transferencia</h4>
                                <p className="mb-4 text-xs text-zinc-400 leading-relaxed">
                                    Para completar tu pedido, transferí el total de <strong className="text-white">${total.toLocaleString("es-AR")}</strong> al siguiente alias/CBU:
                                </p>

                                <div className="mb-5 flex items-center justify-between rounded-lg bg-zinc-950/50 p-3 ring-1 ring-zinc-800">
                                    <span className="font-mono text-sm font-bold text-white tracking-wider">{tenantAlias}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(tenantAlias);
                                            toast.success("Alias copiado al portapapeles");
                                        }}
                                        className="text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400"
                                    >
                                        Copiar
                                    </button>
                                </div>

                                <div className="rounded-xl border border-dashed border-amber-500/30 p-4">
                                    <p className="mb-2 text-xs font-bold text-zinc-300">Comprobante de transferencia <span className="text-red-400">*</span></p>
                                    <p className="mb-3 text-[11px] text-zinc-500">Es obligatorio adjuntar una foto o PDF del comprobante para verificar el pago.</p>
                                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white">
                                        <Upload size={16} />
                                        {receiptFile ? receiptFile.name : "Subir comprobante"}
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="sr-only"
                                            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                    {receiptFile && (
                                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                                            <FileText size={14} />
                                            <span className="truncate">{receiptFile.name}</span>
                                            <span className="shrink-0 text-amber-500/50">({(receiptFile.size / 1024).toFixed(0)} KB)</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedPayment === "TRANSFER" && !tenantAlias && (
                            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 animate-in fade-in">
                                <p className="text-xs text-red-400 text-center font-medium">
                                    El local no ha configurado un alias para transferencias. Por favor, elegí Efectivo o contactá al local.
                                </p>
                            </div>
                        )}
                    </Section>

                    {/* ── 5. Resumen ── */}
                    <Section title="Resumen del Pedido">
                        <div className="space-y-2 text-sm">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between">
                                    <span className="text-zinc-300">
                                        {item.quantity}× {item.name}
                                        {item.modifiersText && (
                                            <span className="ml-1 text-zinc-500">({item.modifiersText})</span>
                                        )}
                                    </span>
                                    <span className="font-medium text-zinc-200">
                                        ${(item.price * item.quantity).toLocaleString("es-AR")}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 space-y-1 border-t border-zinc-800 pt-4">
                            <Row label="Subtotal" value={`$${subtotal.toLocaleString("es-AR")}`} />
                            {deliveryMethod === "DELIVERY" && (
                                <Row label="Envío" value={`$${deliveryCost.toLocaleString("es-AR")}`} />
                            )}
                            <div className="flex justify-between pt-2 text-base font-bold text-white">
                                <span>Total</span>
                                <span className="text-primary">${total.toLocaleString("es-AR")}</span>
                            </div>
                        </div>
                    </Section>

                    {/* ── BOTÓN FINAL (NO STICKY) ── */}
                    <div className="mt-8 mb-12">
                        {whatsappSettings.show && whatsappSettings.phone && (
                            <div className="mb-4">
                                <a href={`https://wa.me/${whatsappSettings.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 text-sm font-semibold text-emerald-500 transition hover:bg-zinc-800 hover:text-emerald-400 w-full">
                                    <MessageCircle size={18} />
                                    ¿Alguna consulta? Escribinos por WhatsApp
                                </a>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={
                                items.length === 0 ||
                                isSubmitting ||
                                (isOutOfBounds && deliveryMethod === "DELIVERY") ||
                                (selectedPayment === "TRANSFER" && (!tenantAlias || !receiptFile))
                            }
                            className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-extrabold shadow-[0_0_20px_var(--brand-color)] shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 uppercase tracking-wide ${(isOutOfBounds && deliveryMethod === "DELIVERY") ? "bg-red-500 text-white shadow-red-500/20" : "bg-primary text-[#09090b]"}`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="h-5 w-5 animate-spin text-black" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    CONFIRMANDO...
                                </span>
                            ) : (isOutOfBounds && deliveryMethod === "DELIVERY") ? (
                                "FUERA DE RADIO DE ENTREGA"
                            ) : (
                                <>
                                    Confirmar Pedido • ${total.toLocaleString("es-AR")}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

// ─── Micro-components ──────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
    return `w-full rounded-xl border bg-[#0a0a0a] px-5 py-5 text-base text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/40 focus:border-primary ${hasError ? "border-red-500/50 focus:ring-red-500/30" : "border-zinc-800 focus:bg-[#111111]"
        }`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
            {children}
        </section>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="mb-4 last:mb-0">
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm text-zinc-400">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

function PaymentCard({ icon, label, selected, onClick }: {
    icon: React.ReactNode; label: string; selected: boolean; onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border py-4 text-sm font-semibold transition-all ${selected
                ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_var(--brand-color)] shadow-primary/20"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
