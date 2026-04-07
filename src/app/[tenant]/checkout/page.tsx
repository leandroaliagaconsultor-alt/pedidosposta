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
    Navigation,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { useCartStore } from "@/lib/store/cartStore";
import { useAddressStore } from "@/lib/store/addressStore";
import { createClient } from "@/lib/supabase/client";
import { generateAvailableSlots } from "@/lib/utils/timeSlots";
import { calculateDistance } from "@/lib/utils/geo";
import { useTenantThemeEngine } from "@/hooks/useTenantThemeEngine";
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
    });

type CheckoutForm = z.infer<typeof checkoutSchema>;

// ─── HISTORIAL DE DIRECCIONES (localStorage) ─────────────────────────────

interface SavedHistoryAddress {
    street: string;
    streetNumber?: string; // legacy — merged into street for new saves
    apartment?: string;
    betweenStreets: string;
    deliveryNotes?: string;
    coords?: { lat: number; lng: number };
}

const HISTORY_MAX = 3;

function getAddressHistory(tenantSlug: string): SavedHistoryAddress[] {
    try {
        const raw = localStorage.getItem(`pedidosposta_addresses_${tenantSlug}`);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveAddressToHistory(tenantSlug: string, addr: SavedHistoryAddress) {
    try {
        const history = getAddressHistory(tenantSlug);
        // Dedup: si ya existe la misma calle+número, la removemos primero
        const filtered = history.filter(
            (h) => !(h.street === addr.street)
        );
        const updated = [addr, ...filtered].slice(0, HISTORY_MAX);
        localStorage.setItem(`pedidosposta_addresses_${tenantSlug}`, JSON.stringify(updated));
    } catch { /* localStorage lleno o bloqueado */ }
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────

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
    const [minOrder, setMinOrder] = useState(0);
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

    // Theme state
    const [tenantColorHex, setTenantColorHex] = useState<string>("#10b981");
    const [tenantThemeMode, setTenantThemeMode] = useState<string>("");
    const [tenantFontFamily, setTenantFontFamily] = useState<string>("");
    const [tenantTemplate, setTenantTemplate] = useState<string>("");

    const [isLocating, setIsLocating] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [isManualAddressMode, setIsManualAddressMode] = useState(false);
    const [mapSessionToken, setMapSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);
    const [addressHistory, setAddressHistory] = useState<SavedHistoryAddress[]>([]);

    const betweenStreetsRef = React.useRef<HTMLInputElement>(null);
    // streetNumberRef removed — merged into single street field

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

    // Location bias: priorizar resultados cerca del local (radio 20km)
    const locationBias = React.useMemo(() => {
        if (!storeCoords || typeof window === "undefined" || !window.google?.maps) return undefined;
        return new window.google.maps.Circle({
            center: { lat: storeCoords.lat, lng: storeCoords.lng },
            radius: 20000,
        });
    }, [storeCoords]);

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
            ...(locationBias ? { locationBias } : {}),
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

    // Cargar historial de direcciones al montar
    React.useEffect(() => {
        setAddressHistory(getAddressHistory(tenantSlug));
    }, [tenantSlug]);

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

    // Validamos estricto que no esté vacío para desactivar botón
    const isAddressIncomplete = deliveryMethod === "DELIVERY" && (!streetVal || streetVal.trim().length === 0);

    const total = subtotal + (deliveryMethod === "DELIVERY" ? calculatedDeliveryCost : 0);
    const isBelowMinOrder = minOrder > 0 && subtotal < minOrder;

    // Aplicar una dirección del historial
    const applyHistoryAddress = React.useCallback((addr: SavedHistoryAddress) => {
        setIsManualAddressMode(true);
        // Legacy compat: merge street+streetNumber if saved separately
        const fullStreet = addr.streetNumber ? `${addr.street} ${addr.streetNumber}` : addr.street;
        setValue("street", fullStreet, { shouldValidate: true });
        if (addr.apartment) setValue("apartment", addr.apartment);
        setValue("betweenStreets", addr.betweenStreets, { shouldValidate: true });
        if (addr.deliveryNotes) setValue("delivery_notes", addr.deliveryNotes);

        if (addr.coords) {
            setSelectedCoords(addr.coords);
            if (tenantDeliveryType === "distance") {
                computeDeliveryCost(addr.coords.lat, addr.coords.lng);
            }
        }
    }, [setValue, tenantDeliveryType, computeDeliveryCost]);

    // Aplicar dirección guardada (0 API calls)
    const applySavedAddress = React.useCallback(() => {
        if (!savedAddress) return;
        const fullStreet = savedAddress.streetNumber ? `${savedAddress.street} ${savedAddress.streetNumber}` : savedAddress.street;
        setAddressValue(fullStreet, false);
        setValue("street", fullStreet, { shouldValidate: true });
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
                .select("id, schedule, max_orders_per_slot, is_mp_active, transfer_alias, transfer_account_name, store_address, store_lat, store_lng, delivery_pricing_type, delivery_radius_km, fixed_delivery_price, base_delivery_price, base_delivery_km, extra_price_per_km, color_hex, theme, min_order")
                .eq("slug", tenantSlug)
                .single();

            if (tenantData) {
                setIsMPActive(!!tenantData.is_mp_active);
                setMinOrder(tenantData.min_order || 0);
                setTenantAlias(tenantData.transfer_alias || null);
                setTenantAccountName(tenantData.transfer_account_name || null);
                setTenantStoreAddress(tenantData.store_address || null);

                // Theme data
                if (tenantData.color_hex) setTenantColorHex(tenantData.color_hex);
                if (tenantData.theme) {
                    const thObj = typeof tenantData.theme === 'string' ? JSON.parse(tenantData.theme) : tenantData.theme;
                    if (thObj?.mode) setTenantThemeMode(thObj.mode);
                    if (thObj?.font_family) setTenantFontFamily(thObj.font_family);
                    if (thObj?.template) setTenantTemplate(thObj.template);
                }

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

            const finalStreet = route && streetNum ? `${route} ${streetNum}` : addressStr.split(',')[0].trim();
            setAddressValue(finalStreet, false);
            setValue("street", finalStreet, { shouldValidate: true });
            setTimeout(() => betweenStreetsRef.current?.focus(), 200);

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
            (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                // Guardar coords silenciosamente para cálculo de distancia/envío
                setSelectedCoords({ lat, lng });

                // Calcular distancia y costo con las coords del GPS (0 API calls)
                if (storeCoords && tenantDeliveryType === "distance") {
                    computeDeliveryCost(lat, lng);
                }

                // Cambiar a modo manual: el usuario escribe su dirección libremente
                setIsManualAddressMode(true);
                setIsLocating(false);
                toast.success("Ubicación detectada. Escribí tu dirección.");
            },
            () => {
                setIsLocating(false);
                toast.error("No pudimos obtener tu ubicación.");
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
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
                ? `${data.street} (Entre: ${data.betweenStreets})${data.apartment ? `, Piso/Depto: ${data.apartment}` : ""}`
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
            if (data.deliveryMethod === "DELIVERY" && data.street && data.betweenStreets) {
                const addrPayload = {
                    street: data.street,
                    apartment: data.apartment || undefined,
                    betweenStreets: data.betweenStreets,
                    deliveryNotes: data.delivery_notes || undefined,
                    coords: selectedCoords || undefined,
                };
                saveAddress(tenantSlug, { ...addrPayload, savedAt: Date.now() });
                saveAddressToHistory(tenantSlug, addrPayload);
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

    const themeEngine = useTenantThemeEngine({
        template: tenantTemplate || undefined,
        theme_mode: (tenantThemeMode === "light" || tenantThemeMode === "dark") ? tenantThemeMode : undefined,
        color_hex: tenantColorHex,
        font_family: tenantFontFamily || undefined,
    });

    const t = themeEngine.tokens;
    const accentColor = themeEngine.primaryColor;
    const accentTextColor = themeEngine.accentIsLight ? '#18181b' : '#ffffff';
    const isLight = t.mode === "light";

    if (items.length === 0) {
        return (
            <main className={`min-h-screen flex items-center justify-center ${t.bg} ${t.text}`} style={themeEngine.cssVars}>
                <div className="text-center px-6">
                    <Package size={48} className={`mx-auto mb-4 ${t.textMuted}`} />
                    <h2 className={`text-xl font-black mb-2 ${t.text}`}>Tu carrito esta vacio</h2>
                    <p className={`text-sm mb-6 ${t.textMuted}`}>Agrega productos desde el menu para hacer tu pedido.</p>
                    <button onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-sm transition-all hover:brightness-110" style={{ backgroundColor: accentColor, color: accentTextColor }}>
                        <ArrowLeft size={16} /> Volver al menu
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className={`min-h-screen pb-20 pt-8 ${t.bg} ${t.text} transition-colors duration-300`} style={themeEngine.cssVars}>
            <Toaster position="top-center" richColors />
            <div className="mx-auto max-w-xl px-4">

                <button onClick={() => router.back()} className={`mb-5 flex items-center gap-2 ${t.textMuted} transition-colors`} style={{ ['--hover-color' as string]: accentColor }}>
                    <ArrowLeft size={16} /> <span className="text-sm font-medium">Volver al menú</span>
                </button>

                <header className="mb-6">
                    <h1 className={`text-2xl font-black tracking-tight mb-1 ${t.text}`}>Finalizar Pedido</h1>
                    <p className={`text-sm ${t.textMuted}`}>Completá los detalles para que empecemos a cocinar.</p>
                </header>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">

                    {/* SECCIÓN 1: IDENTIDAD */}
                    <section className="space-y-3">
                        <SectionHeader number="1" title="Tus Datos" accentColor={accentColor} isLight={isLight} />
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Nombre" error={errors.firstName?.message}>
                                <input {...register("firstName")} placeholder="Juan" className={inputStyle(!!errors.firstName, isLight)} />
                            </Field>
                            <Field label="Apellido" error={errors.lastName?.message}>
                                <input {...register("lastName")} placeholder="Pérez" className={inputStyle(!!errors.lastName, isLight)} />
                            </Field>
                        </div>
                        <Field label="WhatsApp / Teléfono" error={errors.phone?.message}>
                            <input {...register("phone")} type="tel" placeholder="11 1234 5678" className={inputStyle(!!errors.phone, isLight)} />
                        </Field>
                    </section>

                    {/* SECCIÓN 2: ENTREGA */}
                    <section className="space-y-3">
                        <SectionHeader number="2" title="Entrega" accentColor={accentColor} isLight={isLight} />
                        <div className="grid grid-cols-2 gap-3">
                            <MethodButton
                                active={deliveryMethod === "DELIVERY"}
                                onClick={() => setValue("deliveryMethod", "DELIVERY")}
                                icon={<Truck size={18} />}
                                label="Delivery"
                                accentColor={accentColor}
                                isLight={isLight}
                            />
                            <MethodButton
                                active={deliveryMethod === "TAKEAWAY"}
                                onClick={() => setValue("deliveryMethod", "TAKEAWAY")}
                                icon={<Package size={18} />}
                                label="Takeaway"
                                accentColor={accentColor}
                                isLight={isLight}
                            />
                        </div>

                        {deliveryMethod === "DELIVERY" && (
                            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">

                                {/* Direcciones rápidas: saved address + historial */}
                                {(showSavedAddress && savedAddress) || addressHistory.length > 0 ? (
                                    <div className="space-y-2">
                                        {showSavedAddress && savedAddress && (
                                            <button
                                                type="button"
                                                onClick={applySavedAddress}
                                                className="w-full py-2.5 px-3 rounded-xl border flex items-center gap-2.5 text-left transition-all hover:opacity-80"
                                                style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}08` }}
                                            >
                                                <MapPin size={14} className="shrink-0" style={{ color: accentColor }} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>Última dirección</p>
                                                    <p className={`text-xs font-medium truncate ${t.text}`}>
                                                        {savedAddress.streetNumber ? `${savedAddress.street} ${savedAddress.streetNumber}` : savedAddress.street}
                                                    </p>
                                                </div>
                                            </button>
                                        )}
                                        {addressHistory.length > 0 && (
                                            <div>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 ${t.textMuted}`}>Direcciones recientes</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {addressHistory.map((addr, i) => (
                                                        <button
                                                            key={`${addr.street}-${i}`}
                                                            type="button"
                                                            onClick={() => applyHistoryAddress(addr)}
                                                            className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-[11px] font-semibold transition-all hover:opacity-80 max-w-[200px] ${isLight ? "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}`}
                                                        >
                                                            <MapPin size={10} className="shrink-0" />
                                                            <span className="truncate">{addr.streetNumber ? `${addr.street} ${addr.streetNumber}` : addr.street}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                {/* Calle y Altura — Autocompletado o Manual */}
                                {!isManualAddressMode ? (
                                    <>
                                        <Field label="Calle y Altura exactas *" error={errors.street?.message}>
                                            <div className="relative">
                                                <MapPin size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isCalculatingDistance ? "text-primary animate-bounce" : "text-zinc-500"}`} />
                                                <input
                                                    value={addressValue}
                                                    onChange={(e) => { setAddressValue(e.target.value); setValue("street", e.target.value); }}
                                                    disabled={!ready || !isLoaded}
                                                    placeholder="Ej: Calle 22 N° 1207"
                                                    className={`${inputStyle(!!errors.street, isLight)} pl-10 pr-12`}
                                                />
                                                {/* GPS inline button */}
                                                <button
                                                    type="button"
                                                    onClick={handleGeolocation}
                                                    disabled={isLocating}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors hover:bg-zinc-800/50"
                                                    aria-label="Usar mi ubicacion"
                                                >
                                                    {isLocating
                                                        ? <Loader2 size={16} className="animate-spin" style={{ color: accentColor }} />
                                                        : <Navigation size={16} className="text-zinc-500 hover:text-zinc-300" />
                                                    }
                                                </button>
                                            </div>

                                            {status === "OK" && (
                                                <ul className={`mt-1.5 border rounded-xl overflow-hidden shadow-2xl relative z-20 ${isLight ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"}`}>
                                                    {suggestions.map((s) => (
                                                        <button key={s.place_id} type="button" onClick={() => handleAddressSelect(s.description)} className={`w-full text-left px-4 py-3 text-sm transition-colors border-b last:border-0 ${isLight ? "text-zinc-700 hover:bg-zinc-50 border-zinc-100" : "text-zinc-300 hover:bg-zinc-800 border-zinc-800/50"}`}>
                                                            {s.description}
                                                        </button>
                                                    ))}
                                                </ul>
                                            )}
                                        </Field>
                                    </>
                                ) : (
                                    <>
                                        <Field label="Calle y Altura exactas *" error={errors.street?.message}>
                                            <div className="relative">
                                                <input
                                                    {...register("street")}
                                                    placeholder="Ej: Calle 22 N° 1207"
                                                    className={`${inputStyle(!!errors.street, isLight)} pr-12`}
                                                />
                                                {/* Back to autocomplete */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsManualAddressMode(false);
                                                        setSelectedCoords(null);
                                                        setCalculatedDistance(null);
                                                        setCalculatedDeliveryCost(tenantDeliveryType === "fixed" ? tenantFixedPrice : tenantBasePrice);
                                                        setValue("street", "", { shouldValidate: false });
                                                        setAddressValue("", false);
                                                    }}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors hover:bg-zinc-800/50"
                                                    aria-label="Buscar en el mapa"
                                                >
                                                    <MapPin size={16} className="text-zinc-500 hover:text-zinc-300" />
                                                </button>
                                            </div>
                                        </Field>
                                    </>
                                )}

                                {/* Piso/Depto + Entre calles (2 cols) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Piso / Depto (Opcional)" error={errors.apartment?.message}>
                                        <input {...register("apartment")} placeholder="Ej: 3B, PB 1" className={inputStyle(!!errors.apartment, isLight)} />
                                    </Field>
                                    <Field label="Entre calles *" error={errors.betweenStreets?.message}>
                                        <input
                                            {...register("betweenStreets")}
                                            ref={(e) => { register("betweenStreets").ref(e); (betweenStreetsRef.current as any) = e; }}
                                            placeholder="Ej: Entre 24 y 26"
                                            className={inputStyle(!!errors.betweenStreets, isLight)}
                                        />
                                    </Field>
                                </div>

                                {/* Indicaciones para el repartidor */}
                                <Field label="Indicaciones para el repartidor (Opcional)" error={errors.delivery_notes?.message}>
                                    <textarea
                                        {...register("delivery_notes")}
                                        placeholder="Ej: Timbre roto, golpear la puerta de rejas negras"
                                        rows={2}
                                        className={`${inputStyle(!!errors.delivery_notes, isLight)} resize-none`}
                                    />
                                </Field>

                                {/* Distancia Calculada */}
                                {calculatedDistance !== null && (
                                    <div className={`flex items-center justify-between border rounded-xl py-2.5 px-4 mt-1 ${isLight ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900 border-zinc-800"}`}>
                                        <span className={`text-xs font-medium ${t.textMuted}`}>Distancia:</span>
                                        <div className="flex items-center gap-2.5">
                                            <span className={`text-[11px] font-black tracking-widest px-2 py-0.5 rounded-md ${isLight ? "text-zinc-700 bg-zinc-200" : "text-zinc-200 bg-black"}`}>
                                                {calculatedDistance.toFixed(1)} km
                                            </span>
                                            <span className="text-sm font-black" style={{ color: accentColor }}>
                                                ${calculatedDeliveryCost.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* SECCIÓN 3: PAGO */}
                    <section className="space-y-3">
                        <SectionHeader number="3" title="Pago" accentColor={accentColor} isLight={isLight} />
                        <div className={`grid gap-3 ${tenantAlias ? "grid-cols-2" : "grid-cols-1"}`}>
                            <MethodButton
                                active={selectedPayment === "CASH"}
                                onClick={() => { setValue("paymentMethod", "CASH", { shouldValidate: true }); setReceiptFile(null); }}
                                icon={<Banknote size={18} />}
                                label="Efectivo"
                                accentColor={accentColor}
                                isLight={isLight}
                            />
                            {tenantAlias && (
                                <MethodButton
                                    active={selectedPayment === "TRANSFER"}
                                    onClick={() => { setValue("paymentMethod", "TRANSFER", { shouldValidate: true }); }}
                                    icon={<Smartphone size={18} />}
                                    label="Transferencia"
                                    accentColor={accentColor}
                                    isLight={isLight}
                                />
                            )}
                        </div>
                        {isMPActive && (
                            <button
                                type="button"
                                onClick={() => { setValue("paymentMethod", "MERCADOPAGO", { shouldValidate: true }); setReceiptFile(null); }}
                                className={`w-full flex items-center justify-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${selectedPayment === "MERCADOPAGO" ? "border-sky-500 bg-sky-500/10 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.15)]" : isLight ? "border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-zinc-300" : "border-zinc-900 bg-zinc-900/20 text-zinc-600 hover:border-zinc-800"}`}
                            >
                                <CreditCard size={18} /> <span className="text-xs font-black uppercase tracking-widest">MercadoPago</span>
                            </button>
                        )}
                        {errors.paymentMethod && <p className="text-red-500 text-xs ml-1 font-bold">{errors.paymentMethod.message}</p>}

                        {/* INFO PARA TRANSFERENCIA */}
                        {selectedPayment === "TRANSFER" && tenantAlias && (
                            <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 animate-in fade-in slide-in-from-top-4">
                                <h4 className="mb-1.5 text-sm font-extrabold text-amber-400">Datos para la Transferencia</h4>
                                <p className={`mb-3 text-xs leading-relaxed ${t.textMuted}`}>
                                    Transferí <strong className={t.text}>${total.toLocaleString("es-AR")}</strong> al siguiente alias/CBU
                                    {tenantAccountName ? <> a nombre de <strong className={t.text}>{tenantAccountName}</strong>:</> : <>:</>}
                                </p>

                                <div className={`mb-4 flex items-center justify-between rounded-lg p-3 ring-1 ${isLight ? "bg-zinc-100 ring-zinc-200" : "bg-black ring-zinc-800"}`}>
                                    <span className={`font-mono text-sm font-bold tracking-wider ${t.text}`}>{tenantAlias}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(tenantAlias);
                                            toast.success("Alias copiado al portapapeles");
                                        }}
                                        className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors"
                                    >
                                        Copiar
                                    </button>
                                </div>

                                <div className={`rounded-lg border-2 border-dashed border-amber-500/30 p-3 ${isLight ? "bg-amber-50/50" : "bg-black/50"}`}>
                                    <p className={`mb-1 text-xs font-bold ${t.text}`}>Comprobante <span className="text-red-500">*</span></p>
                                    <p className={`mb-2 text-[11px] ${t.textMuted}`}>Adjuntá una foto o PDF del pago.</p>
                                    <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border py-4 text-xs font-semibold transition-all ${isLight ? "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}`}>
                                        <Upload size={18} className={receiptFile ? "text-primary" : "text-zinc-600"} />
                                        {receiptFile ? <span className="text-primary truncate px-4">{receiptFile.name}</span> : <span>Toca para subir comprobante</span>}
                                        <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                            </div>
                        )}
                        {/* TRANSFER only shown if tenantAlias exists — no dead-end state */}
                    </section>

                    {/* RESUMEN FINAL */}
                    <section className={`pt-6 border-t-2 border-dashed ${isLight ? "border-zinc-200" : "border-zinc-900"}`}>
                        <SectionHeader number="4" title="Resumen del Pedido" accentColor={accentColor} isLight={isLight} />

                        <div className={`mt-3 mb-5 p-4 rounded-xl border shadow-inner ${isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/40 border-zinc-800"}`}>
                            {/* Lista de Productos */}
                            <ul className={`space-y-3 mb-4 pb-4 border-b ${isLight ? "border-zinc-200" : "border-zinc-800/80"}`}>
                                {items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between text-xs">
                                        <div className="pr-3">
                                            <p className={`font-bold tracking-wide ${t.text}`}>
                                                <span className="mr-1.5" style={{ color: accentColor }}>{item.quantity}x</span>
                                                {item.name}
                                            </p>
                                            {item.modifiersText && (
                                                <p className={`mt-0.5 text-[11px] font-medium leading-relaxed ${t.textMuted}`}>
                                                    {item.modifiersText}
                                                </p>
                                            )}
                                        </div>
                                        <div className={`font-mono font-medium shrink-0 ${t.text}`}>
                                            ${(item.price * item.quantity).toLocaleString("es-AR")}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Totales */}
                            <div className="space-y-2">
                                <div className={`flex justify-between font-medium text-xs ${t.textMuted}`}>
                                    <span>Subtotal</span>
                                    <span className={t.text}>${subtotal.toLocaleString("es-AR")}</span>
                                </div>
                                {deliveryMethod === "DELIVERY" && (
                                    <div className={`flex justify-between font-medium text-xs ${t.textMuted}`}>
                                        <span>Envío {tenantDeliveryType === "distance" && !selectedCoords && <span className="text-[10px] opacity-60">(se calcula con tu direccion)</span>}</span>
                                        <span className={t.text}>+ ${calculatedDeliveryCost.toLocaleString("es-AR")}</span>
                                    </div>
                                )}
                                <div className={`flex justify-between items-end text-xl font-black pt-3 border-t mt-1.5 ${t.text} ${isLight ? "border-zinc-200" : "border-zinc-800"}`}>
                                    <span className={`text-xs uppercase tracking-widest ${t.textMuted}`}>Total</span>
                                    <span className="tracking-tight" style={{ color: accentColor }}>${total.toLocaleString("es-AR")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Min order warning */}
                        {isBelowMinOrder && (
                            <div className={`rounded-xl border px-4 py-3 text-center ${isLight ? "border-amber-300 bg-amber-50" : "border-amber-500/30 bg-amber-500/5"}`}>
                                <p className="text-xs font-bold text-amber-500">
                                    Pedido minimo: ${minOrder.toLocaleString("es-AR")} — te faltan ${(minOrder - subtotal).toLocaleString("es-AR")}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                isBelowMinOrder ||
                                (isOutOfBounds && deliveryMethod === "DELIVERY") ||
                                isAddressIncomplete ||
                                (selectedPayment === "TRANSFER" && (!tenantAlias || !receiptFile))
                            }
                            className={`w-full py-3.5 rounded-xl font-black text-sm transition-all uppercase tracking-tighter flex items-center justify-center gap-2 ${
                                (isOutOfBounds && deliveryMethod === "DELIVERY") || isAddressIncomplete || isBelowMinOrder
                                ? "bg-red-500/10 border border-red-500/30 text-red-500 shadow-none disabled:cursor-not-allowed"
                                : "hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                            }`}
                            style={
                                !((isOutOfBounds && deliveryMethod === "DELIVERY") || isAddressIncomplete || isBelowMinOrder)
                                ? { backgroundColor: accentColor, color: accentTextColor }
                                : undefined
                            }
                        >
                            {isSubmitting ? (
                                <><Loader2 size={16} className="animate-spin" /> PROCESANDO PEDIDO...</>
                            ) : isBelowMinOrder ? (
                                "PEDIDO MINIMO NO ALCANZADO"
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

function SectionHeader({ number, title, accentColor, isLight }: { number: string; title: string; accentColor?: string; isLight?: boolean }) {
    return (
        <div className="flex items-center gap-2.5">
            <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black border"
                style={accentColor ? { backgroundColor: `${accentColor}15`, color: accentColor, borderColor: `${accentColor}30` } : undefined}
            >
                {number}
            </span>
            <h2 className={`text-base font-bold uppercase tracking-tight ${isLight ? "text-zinc-900" : "text-white"}`}>{title}</h2>
        </div>
    );
}

let fieldIdCounter = 0;
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode; isLight?: boolean }) {
    const id = React.useMemo(() => `field-${++fieldIdCounter}`, []);
    const errorId = error ? `${id}-error` : undefined;
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-[11px] font-bold tracking-widest uppercase ml-1 text-zinc-400">{label}</label>
            {React.isValidElement(children)
                ? React.cloneElement(children as React.ReactElement<any>, { id, "aria-invalid": !!error || undefined, "aria-describedby": errorId })
                : children
            }
            {error && <p id={errorId} role="alert" className="text-[11px] text-red-500 font-bold ml-1">× {error}</p>}
        </div>
    );
}

function inputStyle(hasError: boolean, isLight: boolean = false) {
    const bg = isLight ? "bg-white" : "bg-zinc-900/50";
    const border = hasError
        ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
        : isLight
            ? "border-zinc-300 focus:border-primary focus:ring-1 focus:ring-primary"
            : "border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary";
    const text = isLight ? "text-zinc-900 placeholder:text-zinc-400" : "text-white placeholder:text-zinc-400";
    return `w-full ${bg} border ${border} rounded-xl py-3 px-4 ${text} text-sm font-medium outline-none transition-all`;
}

function MethodButton({ active, onClick, icon, label, accentColor, isLight }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; accentColor?: string; isLight?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${active
                ? ""
                : isLight
                    ? "border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-zinc-300"
                    : "border-zinc-900 bg-zinc-900/20 text-zinc-600 hover:border-zinc-800"
                }`}
            style={active && accentColor ? { borderColor: accentColor, backgroundColor: `${accentColor}15`, color: accentColor } : undefined}
        >
            {icon}
            <span className="text-xs font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}