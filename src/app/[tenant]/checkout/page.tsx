"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    ArrowLeft,
    Banknote,
    Clock,
    MapPin,
    Package,
    Smartphone,
    Truck,
    Upload,
    FileText,
    Loader2,
    CreditCard,
    ChevronDown,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { useCartStore } from "@/lib/store/cartStore";
import { useAddressStore } from "@/lib/store/addressStore";
import { createClient } from "@/lib/supabase/client";
import { generateAvailableSlots } from "@/lib/utils/timeSlots";
import { calculateDistance } from "@/lib/utils/geo";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import { useJsApiLoader } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

// ─── ESQUEMA DE VALIDACIÓN ──────────────────────────────────────────────

const checkoutSchema = z
    .object({
        firstName: z.string().min(2, "Ingresá tu nombre"),
        lastName: z.string().min(2, "Ingresá tu apellido"),
        phone: z.string().min(8, "Teléfono inválido"),
        deliveryMethod: z.enum(["DELIVERY", "TAKEAWAY"]),
        street: z.string().optional(),
        streetNumber: z.string().optional(),
        apartment: z.string().optional(),
        betweenStreets: z.string().optional(),
        delivery_notes: z.string().optional(),
        deliveryTime: z.string().optional(),
        is_asap: z.boolean(),
        paymentMethod: z.enum(["CASH", "TRANSFER", "MERCADOPAGO"]),
    })
    .refine((data) => data.deliveryMethod === "TAKEAWAY" || (data.street && data.street.trim().length >= 3), {
        message: "Ingresá la calle de entrega",
        path: ["street"],
    })
    .refine((data) => data.deliveryMethod === "TAKEAWAY" || (data.betweenStreets && data.betweenStreets.trim().length >= 3), {
        message: "Obligatorio (Ej: Entre Calle 1 y 2)",
        path: ["betweenStreets"],
    })
    .refine((data) => data.deliveryMethod === "TAKEAWAY" || (data.streetNumber && data.streetNumber.trim().length >= 1), {
        message: "Ingresá el número/altura",
        path: ["streetNumber"],
    });

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant: tenantSlug } = React.use(params);
    const router = useRouter();
    const { items, clearCart } = useCartStore();
    const { getAddress, saveAddress } = useAddressStore();
    const savedAddress = getAddress(tenantSlug);
    const supabase = createClient();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSavedAddress, setShowSavedAddress] = useState(!!savedAddress);
    
    // Config states
    const [isMPActive, setIsMPActive] = useState(false);
    const [tenantAlias, setTenantAlias] = useState<string | null>(null);
    const [tenantAccountName, setTenantAccountName] = useState<string | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    
    // Logistics states
    const [tenantStoreAddress, setTenantStoreAddress] = useState<string | null>(null);
    const [storeCoords, setStoreCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [tenantDeliveryType, setTenantDeliveryType] = useState<"fixed" | "distance">("fixed");
    const [tenantDeliveryRadius, setTenantDeliveryRadius] = useState(5);
    const [tenantFixedPrice, setTenantFixedPrice] = useState(0);
    const [tenantBasePrice, setTenantBasePrice] = useState(0);
    const [tenantBaseKm, setTenantBaseKm] = useState(0);
    const [tenantExtraKmPrice, setTenantExtraKmPrice] = useState(0);

    // Calculated states
    const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
    const [calculatedDeliveryCost, setCalculatedDeliveryCost] = useState<number>(0);
    const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
    const [isOutOfBounds, setIsOutOfBounds] = useState(false);

    const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(true);
    const [scheduleType, setScheduleType] = useState<"asap" | "scheduled">("asap");

    const [isLocating, setIsLocating] = useState(false);
    const [usedGPS, setUsedGPS] = useState(false);
    const [gpsNeedsNumber, setGpsNeedsNumber] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [mapSessionToken, setMapSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);

    const betweenStreetsRef = React.useRef<HTMLInputElement>(null);
    const streetNumberRef = React.useRef<HTMLInputElement>(null);

    // Helper: calcula costo de envío y actualiza estado (DRY)
    const computeDeliveryCost = React.useCallback((customerLat: number, customerLng: number) => {
        if (!storeCoords) return;
        const rawDistance = calculateDistance(storeCoords.lat, storeCoords.lng, customerLat, customerLng);
        const finalDistance = Math.round(rawDistance * 10) / 10;
        setCalculatedDistance(finalDistance);

        if (finalDistance > tenantDeliveryRadius) {
            setIsOutOfBounds(true);
            toast.error(`Lo sentimos, el local solo entrega hasta ${tenantDeliveryRadius}km de distancia.`);
        } else {
            setIsOutOfBounds(false);
            if (finalDistance <= tenantBaseKm) {
                setCalculatedDeliveryCost(Math.round(tenantBasePrice));
            } else {
                const extraKm = finalDistance - tenantBaseKm;
                setCalculatedDeliveryCost(Math.round(tenantBasePrice + extraKm * tenantExtraKmPrice));
            }
        }
    }, [storeCoords, tenantDeliveryRadius, tenantBaseKm, tenantBasePrice, tenantExtraKmPrice]);

    const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries,
    });

    const {
        ready,
        value: addressValue,
        suggestions: { status, data: suggestions },
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
        defaultValues: { deliveryMethod: "DELIVERY", is_asap: true, paymentMethod: "CASH" },
    });

    const deliveryMethod = watch("deliveryMethod");
    const selectedPayment = watch("paymentMethod");
    const streetVal = watch("street");
    const streetNumVal = watch("streetNumber");
    
    // Validamos estricto que no esté vacío para desactivar botón
    const isAddressIncomplete = deliveryMethod === "DELIVERY" && (!streetVal || streetVal.trim().length === 0 || !streetNumVal || streetNumVal.trim().length === 0);

    const total = subtotal + (deliveryMethod === "DELIVERY" ? calculatedDeliveryCost : 0);

    // Aplicar dirección guardada (0 API calls)
    const applySavedAddress = React.useCallback(() => {
        if (!savedAddress) return;
        setAddressValue(savedAddress.street, false);
        setValue("street", savedAddress.street, { shouldValidate: true });
        setValue("streetNumber", savedAddress.streetNumber, { shouldValidate: true });
        if (savedAddress.apartment) setValue("apartment", savedAddress.apartment);
        setValue("betweenStreets", savedAddress.betweenStreets, { shouldValidate: true });
        if (savedAddress.deliveryNotes) setValue("delivery_notes", savedAddress.deliveryNotes);
        setShowSavedAddress(false);

        if (savedAddress.coords) {
            setSelectedCoords(savedAddress.coords);
            if (tenantDeliveryType === "distance") {
                computeDeliveryCost(savedAddress.coords.lat, savedAddress.coords.lng);
            }
        }
    }, [savedAddress, setValue, setAddressValue, tenantDeliveryType, computeDeliveryCost]);

    // Fetch initial configuration
    React.useEffect(() => {
        const fetchConfig = async () => {
            setIsLoadingSlots(true);
            const { data: tenantData } = await supabase
                .from("tenants")
                .select("id, schedule, max_orders_per_slot, is_mp_active, transfer_alias, transfer_account_name, store_address, store_lat, store_lng, delivery_pricing_type, delivery_radius_km, fixed_delivery_price, base_delivery_price, base_delivery_km, extra_price_per_km")
                .eq("slug", tenantSlug)
                .single();

            if (tenantData) {
                setIsMPActive(!!tenantData.is_mp_active);
                setTenantAlias(tenantData.transfer_alias || null);
                setTenantAccountName(tenantData.transfer_account_name || null);
                setTenantStoreAddress(tenantData.store_address || null);

                // Cache store coords: use DB columns if available, fallback to single geocode
                if (tenantData.store_lat && tenantData.store_lng) {
                    setStoreCoords({ lat: tenantData.store_lat, lng: tenantData.store_lng });
                } else if (tenantData.store_address) {
                    try {
                        const results = await getGeocode({ address: tenantData.store_address });
                        const coords = getLatLng(results[0]);
                        setStoreCoords(coords);
                    } catch { /* store coords unavailable — distance pricing won't work */ }
                }

                const pricingType = tenantData.delivery_pricing_type || "fixed";
                setTenantDeliveryType(pricingType);
                setTenantDeliveryRadius(tenantData.delivery_radius_km || 5);
                setTenantFixedPrice(tenantData.fixed_delivery_price || 0);
                setTenantBasePrice(tenantData.base_delivery_price || 0);
                setTenantBaseKm(tenantData.base_delivery_km || 0);
                setTenantExtraKmPrice(tenantData.extra_price_per_km || 0);

                setCalculatedDeliveryCost(pricingType === 'fixed' ? (tenantData.fixed_delivery_price || 0) : (tenantData.base_delivery_price || 0));

                const today = new Date().toISOString().split('T')[0];
                const { data: orders } = await supabase.from("orders").select("scheduled_time").eq("tenant_id", tenantData.id).gte("created_at", today);
                setTimeSlots(generateAvailableSlots(tenantData.schedule, tenantData.max_orders_per_slot, orders || []));
            }
            setIsLoadingSlots(false);
        };
        fetchConfig();
    }, [tenantSlug, supabase]);

    const handleAddressSelect = async (addressStr: string) => {
        setAddressValue(addressStr, false);
        clearSuggestions();
        setValue("street", addressStr, { shouldValidate: true });

        if (tenantDeliveryType === "fixed") {
            setCalculatedDeliveryCost(tenantFixedPrice);
            return;
        }

        if (!storeCoords) {
            toast.error("El local no tiene configurada su dirección de envío.");
            return;
        }

        setIsCalculatingDistance(true);
        try {
            const results = await getGeocode({ address: addressStr });
            const { lat, lng } = getLatLng(results[0]);
            setSelectedCoords({ lat, lng });

            const route = results[0].address_components.find(c => c.types.includes("route"))?.long_name || "";
            const streetNum = results[0].address_components.find(c => c.types.includes("street_number"))?.long_name || "";

            const finalStreet = route || addressStr.split(',')[0].replace(/[0-9]/g, '').trim();
            setAddressValue(finalStreet, false);
            setValue("street", finalStreet, { shouldValidate: true });

            if (streetNum) {
                setValue("streetNumber", streetNum, { shouldValidate: true });
                setGpsNeedsNumber(false);
                setTimeout(() => betweenStreetsRef.current?.focus(), 200);
            } else {
                setGpsNeedsNumber(true);
                setTimeout(() => streetNumberRef.current?.focus(), 200);
            }

            computeDeliveryCost(lat, lng);
        } catch (error) {
            setCalculatedDeliveryCost(tenantBasePrice);
            console.error("Geocoding Error: ", error);
        } finally {
            setIsCalculatingDistance(false);
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
                    // 1 API call: reverse geocode GPS coords
                    const results = await getGeocode({ location: { lat, lng } });

                    const route = results[0].address_components.find(c => c.types.includes("route"))?.long_name || "";
                    const streetNum = results[0].address_components.find(c => c.types.includes("street_number"))?.long_name || "";

                    const streetName = route || results[0].formatted_address.split(',')[0].replace(/[0-9]/g, '').trim();

                    setAddressValue(streetName, false);
                    setValue("street", streetName, { shouldValidate: true });
                    setUsedGPS(true);
                    setSelectedCoords({ lat, lng });

                    if (streetNum) {
                        setValue("streetNumber", streetNum, { shouldValidate: true });
                        setGpsNeedsNumber(false);
                        setTimeout(() => betweenStreetsRef.current?.focus(), 200);
                    } else {
                        setGpsNeedsNumber(true);
                        setTimeout(() => streetNumberRef.current?.focus(), 200);
                    }

                    // Distance uses cached store coords — 0 extra API calls
                    if (storeCoords && tenantDeliveryType === "distance") {
                        computeDeliveryCost(lat, lng);
                    }
                } catch {
                    toast.error("No pudimos obtener tu dirección exacta.");
                } finally {
                    setIsLocating(false);
                }
            },
            () => {
                setIsLocating(false);
                toast.error("No pudimos obtener tu ubicación.");
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const onSubmit = async (data: CheckoutForm) => {
        if (items.length === 0) {
            toast.error("Tu carrito está vacío");
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: tenantData, error: tenantErr } = await supabase
                .from("tenants")
                .select("id")
                .eq("slug", tenantSlug)
                .single();

            if (tenantErr || !tenantData) throw new Error("Local no encontrado.");

            let scheduledTime = null;
            if (!data.is_asap && data.deliveryTime) {
                const [hours, mins] = data.deliveryTime.split(':').map(Number);
                const scheduledDate = new Date();
                scheduledDate.setHours(hours, mins, 0, 0);
                scheduledTime = scheduledDate.toISOString();
            }

            // Manejo de Comprobante
            let receiptUrl: string | null = null;
            if (data.paymentMethod === "TRANSFER" && receiptFile) {
                const fileExt = receiptFile.name.split(".").pop();
                const filePath = `${tenantData.id}/${Date.now()}.${fileExt}`;
                const { error: uploadErr } = await supabase.storage
                    .from("receipts")
                    .upload(filePath, receiptFile);
                if (uploadErr) {
                    console.error("Upload error:", uploadErr);
                } else {
                    const { data: publicUrl } = supabase.storage
                        .from("receipts")
                        .getPublicUrl(filePath);
                    receiptUrl = publicUrl.publicUrl;
                }
            }

            const finalAddress = data.deliveryMethod === "DELIVERY"
                ? `${data.street} ${data.streetNumber} (Entre: ${data.betweenStreets})${data.apartment ? `, Piso/Depto: ${data.apartment}` : ""}`
                : null;

            // Construir el payload para la transacción atómica
            const checkoutPayload = {
                tenant_id: tenantData.id,
                customer_name: `${data.firstName} ${data.lastName}`,
                first_name: data.firstName,
                last_name: data.lastName,
                customer_phone: data.phone,
                customer_address: finalAddress,
                delivery_notes: data.deliveryMethod === "DELIVERY" ? data.delivery_notes : null,
                delivery_method: data.deliveryMethod,
                payment_method: data.paymentMethod,
                is_asap: data.is_asap,
                scheduled_time: scheduledTime,
                scheduled_slot: !data.is_asap && data.deliveryTime ? data.deliveryTime : null,
                total_amount: total,
                status: data.paymentMethod === "MERCADOPAGO" ? "awaiting_payment" : "pending",
                receipt_url: receiptUrl,
                items: items.map((item) => ({
                    product_id: item.productId,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity,
                    notes: item.modifiersText || null,
                })),
            };

            // Transacción atómica: order + items en un solo RPC
            const { data: rpcResult, error: rpcError } = await supabase.rpc("process_checkout", {
                payload: checkoutPayload,
            });

            if (rpcError) {
                // Errores específicos del RPC para UX amigable
                if (rpcError.message.includes("SLOT_FULL")) {
                    const friendlyMsg = rpcError.message.replace(/^.*SLOT_FULL:\s*/, "");
                    toast.error(friendlyMsg);
                    setIsSubmitting(false);
                    return;
                }
                throw new Error(rpcError.message);
            }

            const order = { id: rpcResult.order_id };

            // Guardar dirección para futuros pedidos (0 API calls en el próximo checkout)
            if (data.deliveryMethod === "DELIVERY" && data.street && data.streetNumber && data.betweenStreets) {
                saveAddress(tenantSlug, {
                    street: data.street,
                    streetNumber: data.streetNumber,
                    apartment: data.apartment || undefined,
                    betweenStreets: data.betweenStreets,
                    deliveryNotes: data.delivery_notes || undefined,
                    coords: selectedCoords || undefined,
                    savedAt: Date.now(),
                });
            }

            // Integración MP
            if (data.paymentMethod === "MERCADOPAGO") {
                const resMP = await fetch("/api/checkout/mercadopago", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items,
                        deliveryFee: data.deliveryMethod === "DELIVERY" ? calculatedDeliveryCost : 0,
                        tenantId: tenantData.id,
                        orderId: order.id,
                        tenantSlug: tenantSlug
                    })
                });

                const mpData = await resMP.json();

                if (mpData.init_point) {
                    clearCart();
                    window.location.href = mpData.init_point;
                    return;
                } else {
                    toast.error("Error al generar pago en MercadoPago. Tu pedido quedó pendiente.");
                }
            }

            try { localStorage.setItem(`active_order_${tenantSlug}`, order.id); } catch { }
            clearCart();
            router.push(`/${tenantSlug}/order/${order.id}`);

        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Error al confirmar el pedido. Reintente por favor.";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-zinc-100 pb-20 pt-8">
            <Toaster position="top-center" richColors />
            <div className="mx-auto max-w-xl px-4">

                <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                    <ArrowLeft size={18} /> <span className="text-sm font-medium">Volver al menú</span>
                </button>

                <header className="mb-10">
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2">Finalizar Pedido</h1>
                    <p className="text-zinc-500">Completá los detalles para que empecemos a cocinar.</p>
                </header>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">

                    {/* SECCIÓN 1: IDENTIDAD */}
                    <section className="space-y-6">
                        <SectionHeader number="1" title="Tus Datos" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Nombre" error={errors.firstName?.message}>
                                <input {...register("firstName")} placeholder="Ej: Juan" className={inputStyle(!!errors.firstName)} />
                            </Field>
                            <Field label="Apellido" error={errors.lastName?.message}>
                                <input {...register("lastName")} placeholder="Ej: Pérez" className={inputStyle(!!errors.lastName)} />
                            </Field>
                        </div>
                        <Field label="WhatsApp / Teléfono" error={errors.phone?.message}>
                            <input {...register("phone")} type="tel" placeholder="Ej: 11 1234 5678" className={inputStyle(!!errors.phone)} />
                        </Field>
                    </section>

                    {/* SECCIÓN 2: ENTREGA */}
                    <section className="space-y-6">
                        <SectionHeader number="2" title="Entrega" />
                        <div className="grid grid-cols-2 gap-4">
                            <MethodButton
                                active={deliveryMethod === "DELIVERY"}
                                onClick={() => setValue("deliveryMethod", "DELIVERY")}
                                icon={<Truck size={24} />}
                                label="Delivery"
                            />
                            <MethodButton
                                active={deliveryMethod === "TAKEAWAY"}
                                onClick={() => setValue("deliveryMethod", "TAKEAWAY")}
                                icon={<Package size={24} />}
                                label="Takeaway"
                            />
                        </div>

                        {deliveryMethod === "DELIVERY" && (
                            <div className="space-y-5 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">

                                {showSavedAddress && savedAddress && (
                                    <button
                                        type="button"
                                        onClick={applySavedAddress}
                                        className="w-full py-4 px-5 rounded-2xl border border-primary/30 bg-primary/5 flex items-start gap-3 text-left transition-all hover:border-primary/60 hover:bg-primary/10"
                                    >
                                        <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Usar mi dirección anterior</p>
                                            <p className="text-sm text-zinc-300 font-medium truncate">
                                                {savedAddress.street} {savedAddress.streetNumber}
                                                {savedAddress.apartment ? `, ${savedAddress.apartment}` : ""}
                                            </p>
                                            <p className="text-xs text-zinc-500 truncate">Entre: {savedAddress.betweenStreets}</p>
                                        </div>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleGeolocation}
                                    disabled={isLocating}
                                    className="w-full py-5 rounded-2xl border border-zinc-800 bg-[#0a0a0a] flex items-center justify-center gap-3 text-sm font-bold text-primary hover:border-primary/50 transition-all shadow-[0_0_15px_rgba(34,197,94,0.05)]"
                                >
                                    {isLocating ? <Loader2 className="animate-spin" /> : <MapPin size={18} />}
                                    USAR MI UBICACIÓN ACTUAL (GPS)
                                </button>

                                <Field label="Calle de entrega *" error={errors.street?.message}>
                                    <div className="relative">
                                        <MapPin size={16} className={`absolute left-5 top-1/2 -translate-y-1/2 ${isCalculatingDistance ? "text-primary animate-bounce" : "text-zinc-500"}`} />
                                        <input
                                            value={addressValue}
                                            onChange={(e) => { setAddressValue(e.target.value); setValue("street", e.target.value); }}
                                            disabled={!ready || !isLoaded}
                                            placeholder="Ej: Rivadavia"
                                            className={`${inputStyle(!!errors.street)} pl-12`}
                                        />
                                    </div>
                                    
                                    {usedGPS && !gpsNeedsNumber && (
                                        <p className="mt-2 ml-1 text-xs font-bold text-amber-500 animate-pulse">
                                            Verificá la calle y la altura. A veces el GPS marca la esquina.
                                        </p>
                                    )}

                                    {status === "OK" && (
                                        <ul className="mt-2 bg-[#0a0a0a] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative z-20">
                                            {suggestions.map((s) => (
                                                <button key={s.place_id} type="button" onClick={() => handleAddressSelect(s.description)} className="w-full text-left px-5 py-4 text-sm text-zinc-300 hover:bg-zinc-900 transition-colors border-b border-zinc-800/50 last:border-0">
                                                    {s.description}
                                                </button>
                                            ))}
                                        </ul>
                                    )}
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label={gpsNeedsNumber ? "Altura / N° * (verificar)" : "Altura / N° *"} error={errors.streetNumber?.message}>
                                        <input
                                            {...register("streetNumber")}
                                            ref={(e) => { register("streetNumber").ref(e); (streetNumberRef as React.MutableRefObject<HTMLInputElement | null>).current = e; }}
                                            placeholder="Ej: 1226"
                                            onChange={(e) => { register("streetNumber").onChange(e); if (e.target.value) setGpsNeedsNumber(false); }}
                                            className={gpsNeedsNumber ? inputStyle(true).replace('border-red-900', 'border-amber-500').replace('border-red-500', 'border-amber-400') : inputStyle(!!errors.streetNumber)}
                                        />
                                        {gpsNeedsNumber && (
                                            <p className="mt-1 ml-1 text-xs font-bold text-amber-500 animate-pulse">
                                                El GPS no detectó el número. Ingresalo manualmente.
                                            </p>
                                        )}
                                    </Field>
                                    <Field label="Piso / Depto" error={errors.apartment?.message}>
                                        <input {...register("apartment")} placeholder="Ej: 3B" className={inputStyle(!!errors.apartment)} />
                                    </Field>
                                </div>

                                <Field label="Entre Calles 🚦 (o esquina) *" error={errors.betweenStreets?.message}>
                                    <input
                                        {...register("betweenStreets")}
                                        ref={(e) => { register("betweenStreets").ref(e); (betweenStreetsRef.current as any) = e; }}
                                        placeholder="Ej: Sur y Guemes"
                                        className={inputStyle(!!errors.betweenStreets)}
                                    />
                                </Field>
                                
                                <Field label="Notas de envío (Opcional)" error={errors.delivery_notes?.message}>
                                    <input {...register("delivery_notes")} placeholder="Ej: Portón negro, timbre no funciona..." className={inputStyle(!!errors.delivery_notes)} />
                                </Field>

                                {/* Cartel de Distancia Calculada */}
                                {calculatedDistance !== null && (
                                    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-5 shadow-inner mt-2">
                                        <span className="text-sm text-zinc-400 font-medium">Distancia a recorrer:</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black tracking-widest text-zinc-200 bg-black px-2 py-1 rounded-md">
                                                {calculatedDistance.toFixed(1)} km
                                            </span>
                                            <span className="text-sm font-black text-primary">
                                                ${calculatedDeliveryCost.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* SECCIÓN 3: PAGO */}
                    <section className="space-y-6">
                        <SectionHeader number="3" title="Pago" />
                        <div className="grid grid-cols-2 gap-4">
                            <MethodButton
                                active={selectedPayment === "CASH"}
                                onClick={() => { setValue("paymentMethod", "CASH", { shouldValidate: true }); setReceiptFile(null); }}
                                icon={<Banknote size={24} />}
                                label="Efectivo"
                            />
                            <MethodButton
                                active={selectedPayment === "TRANSFER"}
                                onClick={() => { setValue("paymentMethod", "TRANSFER", { shouldValidate: true }); }}
                                icon={<Smartphone size={24} />}
                                label="Transferencia"
                            />
                        </div>
                        {isMPActive && (
                            <button
                                type="button"
                                onClick={() => { setValue("paymentMethod", "MERCADOPAGO", { shouldValidate: true }); setReceiptFile(null); }}
                                className={`w-full flex items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${selectedPayment === "MERCADOPAGO" ? "border-sky-500 bg-sky-500/10 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.15)]" : "border-zinc-900 bg-zinc-900/20 text-zinc-600 hover:border-zinc-800"}`}
                            >
                                <CreditCard size={24} /> <span className="font-black uppercase tracking-widest">MercadoPago</span>
                            </button>
                        )}
                        {errors.paymentMethod && <p className="text-red-500 text-xs ml-1 font-bold">{errors.paymentMethod.message}</p>}

                        {/* INFO PARA TRANSFERENCIA */}
                        {selectedPayment === "TRANSFER" && tenantAlias && (
                            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 animate-in fade-in slide-in-from-top-4">
                                <h4 className="mb-2 text-base font-extrabold text-amber-400">Datos para la Transferencia</h4>
                                <p className="mb-5 text-sm text-zinc-400 leading-relaxed">
                                    Para completar tu pedido, transferí el total de <strong className="text-white">${total.toLocaleString("es-AR")}</strong> al siguiente alias/CBU
                                    {tenantAccountName ? <> a nombre de <strong className="text-white">{tenantAccountName}</strong>:</> : <>:</>}
                                </p>

                                <div className="mb-6 flex items-center justify-between rounded-xl bg-black p-4 ring-1 ring-zinc-800">
                                    <span className="font-mono text-base font-bold text-white tracking-wider">{tenantAlias}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(tenantAlias);
                                            toast.success("Alias copiado al portapapeles");
                                        }}
                                        className="text-[11px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors"
                                    >
                                        Copiar
                                    </button>
                                </div>

                                <div className="rounded-xl border-2 border-dashed border-amber-500/30 p-5 bg-black/50">
                                    <p className="mb-2 text-sm font-bold text-zinc-200">Comprobante de transferencia <span className="text-red-500">*</span></p>
                                    <p className="mb-4 text-xs text-zinc-500">Obligatorio adjuntar una foto o PDF para verificar el pago.</p>
                                    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 py-6 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-all">
                                        <Upload size={24} className={receiptFile ? "text-primary" : "text-zinc-600"} />
                                        {receiptFile ? <span className="text-primary truncate px-4">{receiptFile.name}</span> : <span>Toca para subir comprobante</span>}
                                        <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                            </div>
                        )}
                        {selectedPayment === "TRANSFER" && !tenantAlias && (
                            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-5 animate-in fade-in text-center">
                                <p className="text-sm font-bold text-red-500">Este local aún no ha configurado su Alias. Por favor elegí otro medio de pago.</p>
                            </div>
                        )}
                    </section>

                    {/* RESUMEN FINAL */}
                    <section className="pt-8 border-t-2 border-dashed border-zinc-900">
                        <SectionHeader number="4" title="Resumen del Pedido" />
                        
                        <div className="mt-6 mb-8 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 shadow-inner">
                            {/* Lista de Productos */}
                            <ul className="space-y-4 mb-6 pb-6 border-b border-zinc-800/80">
                                {items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between text-sm">
                                        <div className="pr-4">
                                            <p className="font-bold text-zinc-200 tracking-wide">
                                                <span className="text-primary mr-2">{item.quantity}x</span>
                                                {item.name}
                                            </p>
                                            {item.modifiersText && (
                                                <p className="mt-1 text-xs text-zinc-500 font-medium leading-relaxed">
                                                    {item.modifiersText}
                                                </p>
                                            )}
                                        </div>
                                        <div className="font-mono text-zinc-300 font-medium shrink-0">
                                            ${(item.price * item.quantity).toLocaleString("es-AR")}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Totales */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-zinc-400 font-medium text-sm">
                                    <span>Subtotal</span>
                                    <span className="text-white">${subtotal.toLocaleString("es-AR")}</span>
                                </div>
                                {deliveryMethod === "DELIVERY" && (
                                    <div className="flex justify-between text-zinc-400 font-medium text-sm">
                                        <span>Envío</span>
                                        <span className="text-white">+ ${calculatedDeliveryCost.toLocaleString("es-AR")}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-end text-2xl font-black text-white pt-4 border-t border-zinc-800 mt-2">
                                    <span className="text-base uppercase tracking-widest text-zinc-500">Total</span>
                                    <span className="text-primary tracking-tight">${total.toLocaleString("es-AR")}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={
                                isSubmitting || 
                                (isOutOfBounds && deliveryMethod === "DELIVERY") ||
                                isAddressIncomplete ||
                                (selectedPayment === "TRANSFER" && (!tenantAlias || !receiptFile))
                            }
                            className={`w-full py-5 rounded-2xl font-black text-lg shadow-[0_10px_40px_-10px_rgba(34,197,94,0.5)] transition-all uppercase tracking-tighter flex items-center justify-center gap-3 ${
                                (isOutOfBounds && deliveryMethod === "DELIVERY") || isAddressIncomplete
                                ? "bg-red-500/10 border border-red-500/30 text-red-500 shadow-none grayscale-0 opacity-100 disabled:cursor-not-allowed"
                                : "bg-primary text-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                            }`}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="animate-spin" /> PROCESANDO PEDIDO...</>
                            ) : (isOutOfBounds && deliveryMethod === "DELIVERY") ? (
                                "FUERA DE RADIO DE ENTREGA"
                            ) : (
                                "Confirmar Pedido"
                            )}
                        </button>
                    </section>

                </form>
            </div>
        </main>
    );
}

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────────────────

function SectionHeader({ number, title }: { number: string; title: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-black border border-primary/20">
                {number}
            </span>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">{title}</h2>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <label className="text-xs font-black tracking-widest text-zinc-500 uppercase ml-2">{label}</label>
            {children}
            {error && <p className="text-[11px] text-red-500 font-bold ml-2">× {error}</p>}
        </div>
    );
}

function inputStyle(hasError: boolean) {
    return `w-full bg-[#0a0a0a] border ${hasError ? 'border-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary'} rounded-2xl py-5 px-6 text-white text-base md:text-sm font-medium outline-none transition-all placeholder:text-zinc-600 shadow-inner`;
}

function MethodButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${active ? 'border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-zinc-900 bg-zinc-900/20 text-zinc-600 hover:border-zinc-800'
                }`}
        >
            {icon}
            <span className="text-sm font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}