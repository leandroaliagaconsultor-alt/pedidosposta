"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { X, Minus, Plus, ShoppingBag, ArrowLeft, Truck, Package, MapPin, CheckCircle2, Loader2, MessageSquare, User, Phone, Clock, ChevronDown, CreditCard, Banknote, Upload, FileText } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { createClient } from "@/lib/supabase/client";
import { generateAvailableSlots } from "@/lib/utils/timeSlots";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { calculateDistance } from "@/lib/utils/geo";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import { useJsApiLoader } from "@react-google-maps/api";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

// Move libraries array outside component to avoid infinite re-renders
const libraries: ("places")[] = ["places"];

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const checkoutSchema = z
    .object({
        fullName: z.string().min(3, "Ingresá tu nombre y apellido"),
        phone: z.string().min(8, "Teléfono / WhatsApp inválido"),
        deliveryMethod: z.enum(["DELIVERY", "TAKEAWAY"]),
        address: z.string().optional(),
        houseNumber: z.string().optional(),
        apartment: z.string().optional(),
        delivery_notes: z.string().optional(),
        notes: z.string().optional(),
        deliveryTime: z.string().optional(),
        is_asap: z.boolean(),
        paymentMethod: z.enum(["CASH", "TRANSFER", "MP"])
    })
    .refine(
        (data) => data.deliveryMethod === "TAKEAWAY" || (data.address && data.address.trim().length >= 3 && data.houseNumber && data.houseNumber.length >= 1),
        { message: "Ingresá calle y número", path: ["address"] }
    );

type CheckoutForm = z.infer<typeof checkoutSchema>;

interface CartDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isStoreOpen?: boolean;
}

export function CartDrawer({ open, onOpenChange, isStoreOpen = true }: CartDrawerProps) {
    const router = useRouter();
    const params = useParams() as { tenant: string };
    const tenantSlug = params.tenant;
    const supabase = createClient();

    const { items, updateQuantity, removeItem, clearCart } = useCartStore();
    const [isCheckoutMode, setIsCheckoutMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(true);
    const [scheduleType, setScheduleType] = useState<"asap" | "scheduled">("asap");

    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [tenantAlias, setTenantAlias] = useState<string | null>(null);
    const [tenantAccountName, setTenantAccountName] = useState<string | null>(null);

    // Logistics & Maps State
    const [tenantStoreAddress, setTenantStoreAddress] = useState<string | null>(null);
    const [tenantDeliveryType, setTenantDeliveryType] = useState<"fixed" | "distance">("fixed");
    const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
    const [calculatedDeliveryCost, setCalculatedDeliveryCost] = useState<number>(0);
    const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
    const [isOutOfBounds, setIsOutOfBounds] = useState(false);

    // Modern Pricing State
    const [tenantDeliveryRadius, setTenantDeliveryRadius] = useState(5);
    const [tenantFixedPrice, setTenantFixedPrice] = useState(0);
    const [tenantBasePrice, setTenantBasePrice] = useState(0);
    const [tenantBaseKm, setTenantBaseKm] = useState(0);
    const [tenantExtraKmPrice, setTenantExtraKmPrice] = useState(0);
    const [isUsingCachedAddress, setIsUsingCachedAddress] = useState(false);
    const [mapSessionToken, setMapSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [usedGPS, setUsedGPS] = useState(false);
    const houseNumberRef = React.useRef<HTMLInputElement>(null);

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
            /* Restrict to Argentina boundaries mostly if needed, or omit */
            componentRestrictions: { country: "ar" },
            sessionToken: mapSessionToken ?? undefined,
        },
        debounce: 600,
    });

    React.useEffect(() => {
        if (isLoaded) {
            init();
        }
    }, [isLoaded, init]);

    // OPTIMIZACIÓN: Generar un sessionToken único por sesión de checkout
    React.useEffect(() => {
        if (open && isCheckoutMode && !mapSessionToken && isLoaded && window.google?.maps?.places) {
            setMapSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        }
    }, [open, isCheckoutMode, mapSessionToken, isLoaded]);

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

    // OPTIMIZACIÓN: Cargar ubicación desde caché al montar el checkout
    React.useEffect(() => {
        if (open && isCheckoutMode) {
            const cached = localStorage.getItem('pedidosposta_user_location');
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    // Pre-rellenar campos de contacto
                    setValue("fullName", data.client_name);
                    setValue("phone", data.phone || "");

                    // Bypass de Google API si hay dirección y costos guardados
                    if (data.address && data.shipping_cost !== undefined) {
                        setValue("address", data.address);
                        setAddressValue(data.address, false);
                        setCalculatedDistance(data.distance_km);
                        setCalculatedDeliveryCost(data.shipping_cost);
                        setSelectedCoords({ lat: data.lat, lng: data.lng });
                        setIsUsingCachedAddress(true);
                    }
                } catch (e) {
                    console.error("Error loading location cache", e);
                }
            }
        }
    }, [open, isCheckoutMode, setValue, setAddressValue]);

    // MP State
    const [isMPActive, setIsMPActive] = useState(false);

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total = subtotal + (deliveryMethod === "DELIVERY" ? calculatedDeliveryCost : 0);

    // Reset view when Drawer closes
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            // Slight delay so the slide animation finishes before changing content
            setTimeout(() => setIsCheckoutMode(false), 300);
        }
        onOpenChange(isOpen);
    };

    React.useEffect(() => {
        const fetchAvailability = async () => {
            setIsLoadingSlots(true);
            try {
                const { data: tenantData } = await supabase
                    .from("tenants")
                    .select("id, schedule, max_orders_per_slot, is_mp_active, transfer_alias, transfer_account_name, store_address, delivery_pricing_type, delivery_radius_km, fixed_delivery_price, base_delivery_price, base_delivery_km, extra_price_per_km")
                    .eq("slug", tenantSlug)
                    .single();
                if (!tenantData) return;

                setIsMPActive(!!tenantData.is_mp_active);
                setTenantAlias(tenantData.transfer_alias || null);
                setTenantAccountName(tenantData.transfer_account_name || null);
                setTenantStoreAddress(tenantData.store_address || null);

                // Nuevos campos Enterprise
                const pricingType = tenantData.delivery_pricing_type || "fixed";
                setTenantDeliveryType(pricingType);
                setTenantDeliveryRadius(tenantData.delivery_radius_km || 5);
                setTenantFixedPrice(tenantData.fixed_delivery_price || 0);
                setTenantBasePrice(tenantData.base_delivery_price || 0);
                setTenantBaseKm(tenantData.base_delivery_km || 0);
                setTenantExtraKmPrice(tenantData.extra_price_per_km || 0);

                // Initial fallback
                setCalculatedDeliveryCost(pricingType === 'fixed' ? (tenantData.fixed_delivery_price || 0) : (tenantData.base_delivery_price || 0));

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

        if (open && isCheckoutMode) {
            fetchAvailability();
        }
    }, [tenantSlug, supabase, scheduleType, setValue, open, isCheckoutMode]);

    // ─── Calculate Distance ─────────────────────────────────────────────────────
    const handleAddressSelect = async (addressStr: string) => {
        setAddressValue(addressStr, false);
        clearSuggestions();
        setValue("address", addressStr, { shouldValidate: true });

        if (tenantDeliveryType === "fixed") {
            setCalculatedDeliveryCost(tenantFixedPrice);
            return;
        }

        if (!tenantStoreAddress && tenantDeliveryType === "distance") {
            toast.error("El local no tiene configurada su dirección de envío.");
            return;
        }

        setIsCalculatingDistance(true);
        try {
            const results = await getGeocode({ address: addressStr });
            const { lat, lng } = await getLatLng(results[0]);
            setSelectedCoords({ lat, lng });

            const originResults = await getGeocode({ address: tenantStoreAddress! });
            const originLatLng = await getLatLng(originResults[0]);

            // REEMPLAZO: Usar Haversine local en lugar de DistanceMatrixService para ahorro extremo
            const rawDistance = calculateDistance(originLatLng.lat, originLatLng.lng, lat, lng);
            const finalDistance = Math.round(rawDistance * 10) / 10;
            setIsCalculatingDistance(false);
            setCalculatedDistance(finalDistance);

            // VALIDAR RADIO
            if (finalDistance > tenantDeliveryRadius) {
                setIsOutOfBounds(true);
                toast.error(`Lo sentimos, el local solo entrega hasta ${tenantDeliveryRadius}km de distancia.`);
                return;
            }
            setIsOutOfBounds(false);

            if (finalDistance <= tenantBaseKm) {
                setCalculatedDeliveryCost(Math.round(tenantBasePrice));
            } else {
                const extraKm = finalDistance - tenantBaseKm;
                const cost = tenantBasePrice + (extraKm * tenantExtraKmPrice);
                setCalculatedDeliveryCost(Math.round(cost));
            }
        } catch (error) {
            setIsCalculatingDistance(false);
            setCalculatedDeliveryCost(tenantBasePrice);
            console.error("Error Geocoding: ", error);
        }
    };

    // ─── GPS Geolocalización ───────────────────────────────────────────────────
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
                    
                    // Extraer solo la calle si es posible
                    const streetName = results[0].address_components.find(c => c.types.includes("route"))?.long_name || results[0].formatted_address.split(',')[0];
                    
                    setAddressValue(streetName, false);
                    setValue("address", streetName, { shouldValidate: true });
                    setUsedGPS(true);

                    // Auto-focus en la altura
                    setTimeout(() => houseNumberRef.current?.focus(), 100);

                    setSelectedCoords({ lat, lng });
                    setIsUsingCachedAddress(false);

                    // Calcular distancia usando Haversine con coordenadas GPS
                    if (tenantStoreAddress) {
                        const originResults = await getGeocode({ address: tenantStoreAddress });
                        const originLatLng = await getLatLng(originResults[0]);
                        const rawDistance = calculateDistance(originLatLng.lat, originLatLng.lng, lat, lng);
                        const finalDistance = Math.round(rawDistance * 10) / 10;
                        setCalculatedDistance(finalDistance);

                        if (finalDistance > tenantDeliveryRadius) {
                            setIsOutOfBounds(true);
                            toast.error(`Tu ubicación está fuera del radio de entrega (${tenantDeliveryRadius}km).`);
                        } else {
                            setIsOutOfBounds(false);
                            if (finalDistance <= tenantBaseKm) {
                                setCalculatedDeliveryCost(Math.round(tenantBasePrice));
                            } else {
                                const extraKm = finalDistance - tenantBaseKm;
                                const cost = tenantBasePrice + (extraKm * tenantExtraKmPrice);
                                setCalculatedDeliveryCost(Math.round(cost));
                            }
                        }
                    }
                } catch (error) {
                    console.error("Geocoding error:", error);
                    toast.error("No pudimos obtener tu dirección exacta.");
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                setIsLocating(false);
                toast.error("No pudimos obtener tu ubicación. Por favor, escribila manualmente.");
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    // ─── Submit Order ───────────────────────────────────────────────────────────
    const onSubmit = async (data: CheckoutForm) => {
        if (items.length === 0) {
            toast.error("Tu carrito está vacío");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Get real tenant ID
            const { data: tenantData, error: tenantErr } = await supabase
                .from("tenants")
                .select("id")
                .eq("slug", tenantSlug)
                .single();

            if (tenantErr || !tenantData) throw new Error("Local no encontrado.");

            // Split name
            const nameParts = data.fullName.split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ");

            // Preparar scheduled_time si no es ASAP
            let scheduledTime = null;
            if (!data.is_asap && data.deliveryTime) {
                const [hours, mins] = data.deliveryTime.split(':').map(Number);
                const scheduledDate = new Date();
                scheduledDate.setHours(hours, mins, 0, 0);
                scheduledTime = scheduledDate.toISOString();
            }

            // Subir comprobante si es transferencia
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

            // 2. Insert Order
            const finalAddress = data.deliveryMethod === "DELIVERY"
                ? `${data.address} ${data.houseNumber}${data.apartment ? `, Piso/Depto: ${data.apartment}` : ""}`
                : null;

            const { data: order, error: orderErr } = await supabase
                .from("orders")
                .insert({
                    tenant_id: tenantData.id,
                    customer_name: data.fullName,
                    first_name: firstName,
                    last_name: lastName || "",
                    customer_phone: data.phone,
                    customer_address: finalAddress,
                    delivery_notes: data.deliveryMethod === "DELIVERY" ? data.delivery_notes : null,
                    customer_notes: data.notes || null,
                    delivery_method: data.deliveryMethod,
                    payment_method: data.paymentMethod,
                    is_asap: data.is_asap,
                    scheduled_time: scheduledTime,
                    total_amount: total,
                    status: data.paymentMethod === "MP" ? "pending_payment" : "pending",
                    receipt_url: receiptUrl,
                })
                .select("id")
                .single();

            if (orderErr) {
                console.error("SUPABASE ERROR:", orderErr);
                throw new Error("DB Error -> " + (orderErr.message || 'N/A'));
            }
            if (!order) throw new Error("Error creando el pedido: No se devolvió la orden.");

            // 3. Insert Order Items
            const orderItems = items.map((item) => ({
                order_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity,
                notes: item.modifiersText || null,
            }));

            const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
            if (itemsErr) {
                throw new Error(
                    "DB Error -> Mensaje: " + (itemsErr.message || 'N/A') +
                    " | Detalles: " + (itemsErr.details || 'N/A') +
                    " | Hint: " + (itemsErr.hint || 'N/A')
                );
            }

            // MP Integration Logic
            if (data.paymentMethod === "MP") {
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
                    onOpenChange(false);
                    // Redirect to MP
                    window.location.href = mpData.init_point;
                    return;
                } else {
                    toast.error("Error al generar pago en MercadoPago. Tu pedido quedó pendiente de pago.");
                }
            }

            // OPTIMIZACIÓN: Guardar ubicación en caché para evitar cargos futuros de Maps
            const cacheData = {
                address: data.deliveryMethod === "DELIVERY" ? data.address : null,
                lat: selectedCoords?.lat || null,
                lng: selectedCoords?.lng || null,
                distance_km: calculatedDistance,
                shipping_cost: calculatedDeliveryCost,
                client_name: data.fullName,
                phone: data.phone
            };
            localStorage.setItem('pedidosposta_user_location', JSON.stringify(cacheData));
            
            // Reset session token for next time
            if (isLoaded && window.google?.maps?.places) {
                setMapSessionToken(new window.google.maps.places.AutocompleteSessionToken());
            }

            // 4. Cleanup & Redirect for non-MP
            try { localStorage.setItem(`active_order_${tenantSlug}`, order.id); } catch { }
            clearCart();
            onOpenChange(false);

            // Allow slider to close before pushing
            setTimeout(() => {
                router.push(`/${tenantSlug}/order/${order.id}`);
            }, 300);

        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Error al confirmar el pedido. Reintente por favor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper inputs classes
    const inputCls = (hasError: boolean) => `w-full rounded-xl border bg-zinc-900/50 px-4 py-3.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:ring-2 focus:ring-primary ${hasError ? "border-red-500/50 focus:ring-red-500" : "border-zinc-800 focus:border-primary/50"}`;

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent className="flex w-full flex-col border-zinc-800 bg-zinc-950 p-0 sm:max-w-md shadow-2xl overflow-hidden">

                {/* ── Header ── */}
                <SheetHeader className="border-b border-zinc-900 bg-zinc-950/80 p-5 backdrop-blur-md relative z-10 shrink-0">
                    {isCheckoutMode ? (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCheckoutMode(false)}
                                className="p-2 -ml-2 rounded-full hover:bg-zinc-900 text-zinc-400 transition text-sm flex items-center"
                            >
                                <ArrowLeft size={18} className="mr-1" />
                            </button>
                            <SheetTitle className="text-xl tracking-tight text-white">
                                Finalizar Pedido
                            </SheetTitle>
                        </div>
                    ) : (
                        <SheetTitle className="flex items-center gap-2 text-xl tracking-tight text-white">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                            Tu Orden
                        </SheetTitle>
                    )}
                </SheetHeader>

                {/* ── Mode: View Cart ── */}
                {!isCheckoutMode && (
                    <>
                        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                            {items.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                                    <div className="rounded-full bg-zinc-900/50 p-6 border border-zinc-800/50">
                                        <ShoppingBag className="h-10 w-10 text-zinc-600" />
                                    </div>
                                    <p className="text-zinc-400 font-medium">Bolsa vacía. ¡Sumá algo rico!</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-4 group">
                                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800/50 shadow-sm">
                                                {item.imageUrl ? (
                                                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover transition-transform group-hover:scale-105" />
                                                ) : (
                                                    <div className="flex h-full bg-zinc-900 w-full items-center justify-center text-zinc-700">
                                                        <ShoppingBag size={24} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-1 flex-col justify-between py-0.5">
                                                <div>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="font-bold text-zinc-100 leading-tight">{item.name}</h4>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-zinc-600 hover:text-red-500 transition-colors shrink-0 p-1 -mr-1"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-zinc-400 font-medium line-clamp-2 leading-relaxed">
                                                        {item.modifiersText || "Original"}
                                                    </p>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="font-black text-primary font-mono tracking-tight">
                                                        ${(item.price * item.quantity).toFixed(0)}
                                                    </span>
                                                    <div className="flex items-center gap-1 overflow-hidden rounded-full border border-zinc-800/80 bg-zinc-900/60 shadow-inner p-0.5">
                                                        <button
                                                            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="min-w-[1.5rem] text-center text-xs font-bold text-zinc-200">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cart Footer */}
                        {items.length > 0 && (
                            <div className="border-t border-zinc-800/80 bg-zinc-950 p-6 shadow-2xl mt-auto shrink-0 relative z-10">
                                <div className="space-y-2.5 mb-6 text-sm">
                                    <div className="flex justify-between font-medium text-zinc-400">
                                        <span>Subtotal</span>
                                        <span>${subtotal.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium text-zinc-400 border-b border-zinc-800/50 pb-3">
                                        <span>Costo de Envío</span>
                                        <span className="text-zinc-500 text-xs">A calcular en Checkout</span>
                                    </div>
                                    <div className="flex justify-between pt-1 text-xl font-extrabold tracking-tight text-white">
                                        <span>Total</span>
                                        <span className="text-primary">${subtotal.toFixed(0)}</span>
                                    </div>
                                </div>

                                {isStoreOpen ? (
                                    <button
                                        onClick={() => setIsCheckoutMode(true)}
                                        className="w-full rounded-2xl bg-primary px-4 py-4 font-black tracking-widest text-primary-foreground shadow-[0_4px_25px_var(--brand-color)] shadow-primary/30 transition-transform hover:scale-[1.02] active:scale-95"
                                    >
                                        IR A DATOS DE ENVÍO
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full rounded-2xl bg-red-950/40 border border-red-900/50 px-4 py-4 font-black tracking-widest text-red-500 opacity-80 cursor-not-allowed"
                                    >
                                        LOCAL CERRADO
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ── Mode: Checkout Form ── */}
                {isCheckoutMode && (
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col h-full overflow-hidden"
                    >
                        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8 scrollbar-hide">

                            {/* Entrega */}
                            <section>
                                <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Método de Entrega</h3>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {(["DELIVERY", "TAKEAWAY"] as const).map((m) => {
                                        const isActive = deliveryMethod === m;
                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setValue("deliveryMethod", m, { shouldValidate: true })}
                                                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-bold transition-all ${isActive
                                                    ? "border-primary bg-primary/10 text-primary shadow-[inset_0_0_10px_rgba(var(--brand-color-rgb),0.1)]"
                                                    : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                                                    }`}
                                            >
                                                {m === "DELIVERY" ? <Truck size={22} className="mb-1" /> : <Package size={22} className="mb-1" />}
                                                {m === "DELIVERY" ? "DELIVERY" : "TAKEAWAY"}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Direccion Fields (animate collapse manually via Tailwind) */}
                                {deliveryMethod === "DELIVERY" && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <div className="relative">
                                                <MapPin size={16} className={`absolute left-4 top-4 ${isCalculatingDistance ? "text-primary animate-bounce" : "text-zinc-500"}`} />
                                                {isUsingCachedAddress ? (
                                                    <div className={`${inputCls(false)} pl-11 flex items-center justify-between`}>
                                                        <span className="truncate">Envío a: {addressValue}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsUsingCachedAddress(false);
                                                                setAddressValue("");
                                                                setValue("address", "");
                                                                setCalculatedDistance(null);
                                                                setSelectedCoords(null);
                                                                // Rotar el token para la nueva búsqueda
                                                                if (isLoaded && window.google?.maps?.places) {
                                                                    setMapSessionToken(new window.google.maps.places.AutocompleteSessionToken());
                                                                }
                                                            }}
                                                            className="text-[10px] font-bold text-primary hover:underline ml-2 flex-shrink-0"
                                                        >
                                                            Cambiar dirección
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <input
                                                        value={addressValue}
                                                        onChange={(e) => {
                                                            setAddressValue(e.target.value);
                                                            setValue("address", e.target.value);
                                                        }}
                                                        disabled={!ready || !isLoaded}
                                                        placeholder="Ej: Calle 13 34, Mercedes, Buenos Aires"
                                                        className={`${inputCls(!!errors.address)} pl-11`}
                                                    />
                                                )}
                                            </div>
                                            <p className="mt-1.5 ml-1 text-[11px] text-zinc-500 font-medium">
                                                Ingresá calle, número y ciudad para calcular el costo de envío exacto.
                                            </p>

                                            <button
                                                type="button"
                                                onClick={handleGeolocation}
                                                disabled={isLocating}
                                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                                            >
                                                {isLocating ? (
                                                    <Loader2 size={14} className="animate-spin text-primary" />
                                                ) : (
                                                    <MapPin size={14} className="text-primary" />
                                                )}
                                                📍 Usar mi ubicación actual (GPS)
                                            </button>

                                            {usedGPS && (
                                                <p className="mt-1 ml-1 text-[10px] font-bold text-amber-500 animate-pulse">
                                                    ⚠️ Verificá la calle. A veces el GPS marca la esquina. Podés editarla.
                                                </p>
                                            )}

                                            {/* Google Maps Suggestions */}
                                            {status === "OK" && (
                                                <ul className="mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in">
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

                                            {errors.address && <p className="mt-1.5 ml-1 text-[11px] font-medium text-red-500">{errors.address.message}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="mb-1.5 block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Altura / Nº *</label>
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
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Piso / Depto</label>
                                                <input
                                                    {...register("apartment")}
                                                    placeholder="Ej: 3B"
                                                    className={inputCls(!!errors.apartment)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="relative">
                                                <MessageSquare size={16} className="absolute left-4 top-4 text-zinc-500 opacity-50" />
                                                <input
                                                    {...register("delivery_notes")}
                                                    placeholder="Observaciones para el repartidor (Opcional). Ej: Portón negro..."
                                                    className={`${inputCls(false)} pl-11`}
                                                />
                                            </div>
                                        </div>

                                        {calculatedDistance !== null && (
                                            <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/80 rounded-lg py-2 px-4 shadow-inner">
                                                <span className="text-xs text-zinc-400 font-medium">Distancia a recorrer:</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-black tracking-widest text-zinc-200 bg-zinc-800 px-2 py-1 rounded">
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

                            <hr className="border-dashed border-zinc-800" />

                            {/* Cliente */}
                            <section>
                                <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Tus Datos</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="relative">
                                            <User size={16} className="absolute left-4 top-4 text-zinc-500" />
                                            <input {...register("fullName")} placeholder="Nombre y Apellido" className={`${inputCls(!!errors.fullName)} pl-11`} />
                                        </div>
                                        {errors.fullName && <p className="mt-1.5 ml-1 text-[11px] font-medium text-red-500">{errors.fullName.message}</p>}
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-4 top-4 text-zinc-500" />
                                            <input {...register("phone")} type="tel" placeholder="Tu número de WhatsApp" className={`${inputCls(!!errors.phone)} pl-11`} />
                                        </div>
                                        {errors.phone && <p className="mt-1.5 ml-1 text-[11px] font-medium text-red-500">{errors.phone.message}</p>}
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <MessageSquare size={16} className="absolute left-4 top-4 text-zinc-500" />
                                            <textarea {...register("notes")} placeholder="Notas para el local (opcional)" rows={2} className={`${inputCls(!!errors.notes)} pl-11 resize-none bg-zinc-900/30`} />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-dashed border-zinc-800" />

                            {/* Horario */}
                            <section>
                                <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Cuándo querés tu pedido</h3>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => { setScheduleType("asap"); setValue("is_asap", true, { shouldValidate: true }); setValue("deliveryTime", "") }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${scheduleType === "asap" ? "border-primary bg-primary/10 text-primary" : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                                            }`}
                                    >
                                        Lo antes posible
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setScheduleType("scheduled"); setValue("is_asap", false); setValue("deliveryTime", "", { shouldValidate: true }) }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${scheduleType === "scheduled" ? "border-primary bg-primary/10 text-primary" : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                                            }`}
                                    >
                                        Programar
                                    </button>
                                </div>

                                {scheduleType === "scheduled" && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="relative">
                                            <Clock size={16} className="pointer-events-none absolute left-4 top-4 text-zinc-500" />
                                            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-4 text-zinc-500" />
                                            <select
                                                {...register("deliveryTime")}
                                                className={`${inputCls(!!errors.deliveryTime)} appearance-none pl-11 pr-10`}
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
                                    </div>
                                )}
                            </section>

                            <hr className="border-dashed border-zinc-800" />

                            {/* Método de Pago */}
                            <section>
                                <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Forma de Pago</h3>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {(["CASH", "TRANSFER"] as const).map((m) => {
                                        const isActive = selectedPayment === m;
                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setValue("paymentMethod", m, { shouldValidate: true })}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${isActive ? "border-primary bg-primary/10 text-primary shadow-[inset_0_0_10px_rgba(var(--brand-color-rgb),0.1)]" : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"}`}
                                            >
                                                {m === "CASH" ? "Efectivo" : "Transferencia"}
                                            </button>
                                        );
                                    })}
                                </div>
                                {isMPActive && (
                                    <button
                                        type="button"
                                        onClick={() => { setValue("paymentMethod", "MP", { shouldValidate: true }); setReceiptFile(null); }}
                                        className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border text-sm font-black tracking-wide transition ${selectedPayment === "MP" ? "border-sky-500 bg-sky-500/10 text-sky-400 shadow-[inset_0_0_15px_rgba(14,165,233,0.15)]" : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"}`}
                                    >
                                        <CreditCard size={18} /> Pagar con MercadoPago
                                    </button>
                                )}
                                {errors.paymentMethod && <p className="mt-2 ml-1 text-[11px] font-medium text-red-500">{errors.paymentMethod.message}</p>}

                                {/* INFO PARA TRANSFERENCIA */}
                                {selectedPayment === "TRANSFER" && tenantAlias && (
                                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 animate-in fade-in slide-in-from-top-4">
                                        <h4 className="mb-2 text-sm font-extrabold text-amber-400">Datos para la Transferencia</h4>
                                        <p className="mb-4 text-xs text-zinc-400 leading-relaxed">
                                            Para completar tu pedido, transferí el total de <strong className="text-white">${total.toLocaleString("es-AR")}</strong> al siguiente alias/CBU
                                            {tenantAccountName ? (
                                                <> a nombre de <strong className="text-white">{tenantAccountName}</strong>:</>
                                            ) : (
                                                <>:</>
                                            )}
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
                                            El local no ha configurado un alias para transferencias. Por favor, elegí Efectivo.
                                        </p>
                                    </div>
                                )}
                            </section>

                        </div>

                        {/* Checkout Footer */}
                        <div className="border-t border-zinc-800 bg-zinc-950 p-6 shrink-0 z-10 shadow-[0_-10px_40px_-5px_theme(colors.black)]">
                            <div className="space-y-1.5 mb-5 border-b border-zinc-800/50 pb-4">
                                <div className="flex justify-between font-medium text-zinc-400 text-sm">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(0)}</span>
                                </div>
                                {deliveryMethod === "DELIVERY" && (
                                    <div className="flex justify-between font-medium text-zinc-400 text-sm">
                                        <span>Envío</span>
                                        <span>${calculatedDeliveryCost.toFixed(0)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-end mb-5">
                                <span className="text-zinc-400 font-semibold text-sm">Total final:</span>
                                <span className="text-2xl font-extrabold text-white tracking-tight">${total.toFixed(0)}</span>
                            </div>
                            <button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    isOutOfBounds ||
                                    (deliveryMethod === "DELIVERY" && !addressValue) ||
                                    (selectedPayment === "TRANSFER" && ((tenantAlias && !receiptFile) || !tenantAlias))
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 font-black tracking-widest text-[13px] text-primary-foreground shadow-[0_4px_25px_var(--brand-color)] shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : isOutOfBounds ? (
                                    <X size={20} />
                                ) : (
                                    <CheckCircle2 size={20} />
                                )}
                                {isSubmitting ? "PROCESANDO..." : isOutOfBounds ? "FUERA DE RADIO" : "CONFIRMAR PEDIDO"}
                            </button>
                        </div>
                    </form>
                )}

            </SheetContent>
        </Sheet>
    );
}
