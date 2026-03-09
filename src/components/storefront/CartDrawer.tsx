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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const checkoutSchema = z
    .object({
        fullName: z.string().min(3, "Ingresá tu nombre y apellido"),
        phone: z.string().min(8, "Teléfono / WhatsApp inválido"),
        deliveryMethod: z.enum(["DELIVERY", "TAKEAWAY"]),
        address: z.string().optional(),
        notes: z.string().optional(),
        deliveryTime: z.string().optional(),
        is_asap: z.boolean(),
        paymentMethod: z.enum(["CASH", "TRANSFER", "MP"])
    })
    .refine(
        (data) => data.deliveryMethod === "TAKEAWAY" || (data.address && data.address.trim().length >= 5),
        { message: "Ingresá una dirección válida", path: ["address"] }
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

    // MP State
    const [isMPActive, setIsMPActive] = useState(false);

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryCost = 2000; // Mock until tenant config handles it

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
    const total = subtotal + (deliveryMethod === "DELIVERY" ? deliveryCost : 0);

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
                    .select("id, schedule, max_orders_per_slot, is_mp_active, transfer_alias, transfer_account_name")
                    .eq("slug", tenantSlug)
                    .single();
                if (!tenantData) return;

                setIsMPActive(!!tenantData.is_mp_active);
                setTenantAlias(tenantData.transfer_alias || null);
                setTenantAccountName(tenantData.transfer_account_name || null);

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
            const { data: order, error: orderErr } = await supabase
                .from("orders")
                .insert({
                    tenant_id: tenantData.id,
                    customer_name: data.fullName,
                    first_name: firstName,
                    last_name: lastName || "",
                    customer_phone: data.phone,
                    customer_address: data.deliveryMethod === "DELIVERY" ? data.address : null,
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
                        deliveryFee: data.deliveryMethod === "DELIVERY" ? deliveryCost : 0,
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
                                        <span className="text-zinc-500">A calcular</span>
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
                                                <MapPin size={16} className="absolute left-4 top-4 text-zinc-500" />
                                                <input
                                                    {...register("address")}
                                                    placeholder="Calle y Número (Ej: Av. Siempreviva 123)"
                                                    className={`${inputCls(!!errors.address)} pl-11`}
                                                />
                                            </div>
                                            {errors.address && <p className="mt-1.5 ml-1 text-[11px] font-medium text-red-500">{errors.address.message}</p>}
                                        </div>
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
                            <div className="flex justify-between items-end mb-5">
                                <span className="text-zinc-400 font-semibold text-sm">Total final:</span>
                                <span className="text-2xl font-extrabold text-white tracking-tight">${total.toFixed(0)}</span>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || (selectedPayment === "TRANSFER" && ((tenantAlias && !receiptFile) || !tenantAlias))}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 font-black tracking-widest text-[13px] text-primary-foreground shadow-[0_4px_25px_var(--brand-color)] shadow-primary/30 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                {isSubmitting ? "PROCESANDO..." : "CONFIRMAR PEDIDO"}
                            </button>
                        </div>
                    </form>
                )}

            </SheetContent>
        </Sheet>
    );
}
