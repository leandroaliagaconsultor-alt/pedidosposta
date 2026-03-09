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
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { useCartStore } from "@/lib/store/cartStore";
import { createClient } from "@/lib/supabase/client";
import { generateAvailableSlots } from "@/lib/utils/timeSlots";

// ─── Zod Schema ────────────────────────────────────────────────────────────────

const checkoutSchema = z
    .object({
        firstName: z.string().min(2, "Ingresá tu nombre"),
        lastName: z.string().min(2, "Ingresá tu apellido"),
        email: z.string().email("Email inválido"),
        phone: z.string().min(8, "Teléfono inválido"),
        deliveryMethod: z.enum(["DELIVERY", "TAKEAWAY"]),
        address: z.string().optional(),
        notes: z.string().optional(),
        deliveryTime: z.string().optional(),
        is_asap: z.boolean(),
        paymentMethod: z.enum(["CASH", "TRANSFER"]),
    })
    .refine(
        (data) =>
            data.deliveryMethod === "TAKEAWAY" ||
            (data.address && data.address.length >= 5),
        { message: "Ingresá tu dirección", path: ["address"] }
    );

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

    const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(true);
    const [scheduleType, setScheduleType] = useState<"asap" | "scheduled">("asap");

    const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const deliveryCost = 2000;

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
                    .select("id, schedule, max_orders_per_slot")
                    .eq("slug", tenantSlug)
                    .single();
                if (!tenantData) return;

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
            const { data: order, error: orderErr } = await supabase
                .from("orders")
                .insert({
                    tenant_id: tenant.id,
                    first_name: data.firstName,
                    last_name: data.lastName,
                    email: data.email,
                    customer_phone: data.phone,
                    customer_address: data.deliveryMethod === "DELIVERY" ? data.address : null,
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
        <main className="min-h-screen bg-zinc-950 pb-28 pt-6">
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
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Nombre" error={errors.firstName?.message}>
                                <input {...register("firstName")} placeholder="Juan" className={inputCls(!!errors.firstName)} />
                            </Field>
                            <Field label="Apellido" error={errors.lastName?.message}>
                                <input {...register("lastName")} placeholder="Pérez" className={inputCls(!!errors.lastName)} />
                            </Field>
                        </div>
                        <Field label="Email" error={errors.email?.message}>
                            <input {...register("email")} type="email" placeholder="juan@email.com" className={inputCls(!!errors.email)} />
                        </Field>
                        <Field label="Teléfono / WhatsApp" error={errors.phone?.message}>
                            <input {...register("phone")} type="tel" placeholder="+54 9 11 0000 0000" className={inputCls(!!errors.phone)} />
                        </Field>
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
                            className={`overflow-hidden transition-all duration-300 ${deliveryMethod === "DELIVERY" ? "max-h-56 opacity-100 mt-4" : "max-h-0 opacity-0"
                                }`}
                        >
                            <Field label="Dirección de entrega" error={errors.address?.message}>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                                    <input
                                        {...register("address")}
                                        placeholder="Av. Corrientes 1234, CABA"
                                        className={`${inputCls(!!errors.address)} pl-9`}
                                    />
                                </div>
                            </Field>
                            <Field label="Notas de entrega (opcional)" error={undefined}>
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
                        {selectedPayment === "TRANSFER" && (
                            <div className="mt-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                                <p className="mb-2 text-xs font-bold text-zinc-300">Comprobante de transferencia</p>
                                <p className="mb-3 text-[11px] text-zinc-500">Opcional: Adjuntá una foto o PDF del comprobante para agilizar la verificación.</p>
                                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white">
                                    <Upload size={16} />
                                    {receiptFile ? receiptFile.name : "Elegir archivo"}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="sr-only"
                                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                                {receiptFile && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                                        <FileText size={14} />
                                        <span className="truncate">{receiptFile.name}</span>
                                        <span className="text-zinc-600">({(receiptFile.size / 1024).toFixed(0)} KB)</span>
                                    </div>
                                )}
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

                    {/* ── CTA ── */}
                    <button
                        type="submit"
                        disabled={items.length === 0 || isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-[0_0_30px_var(--brand-color)] shadow-primary/40 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Confirmando...
                            </span>
                        ) : (
                            <>
                                <CheckCircle2 size={20} />
                                CONFIRMAR PEDIDO
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}

// ─── Micro-components ──────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
    return `w-full rounded-lg border bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:ring-2 focus:ring-primary ${hasError ? "border-red-500/50 focus:ring-red-500" : "border-zinc-800 focus:border-primary/50"
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
