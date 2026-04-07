import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Webhook para notificaciones de suscripción de MercadoPago
// Maneja tanto pagos de Checkout Pro (mode: manual) como preapproval (mode: auto)
// Implementa idempotencia via mp_webhook_log table

const ok = (data: Record<string, unknown> = {}) =>
    NextResponse.json({ received: true, ...data }, { status: 200 });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const topic = req.nextUrl.searchParams.get("topic") || body?.type;
        const resourceId = req.nextUrl.searchParams.get("id") || body?.data?.id;
        const notificationId = body?.id || body?.data?.id || resourceId;

        if (!resourceId) return ok();

        const platformToken = process.env.MP_PLATFORM_ACCESS_TOKEN;
        if (!platformToken) {
            console.error("MP Sub Webhook: MP_PLATFORM_ACCESS_TOKEN no configurado");
            return ok();
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        if (!supabaseKey) return ok();

        const supabase = createClient(supabaseUrl, supabaseKey);

        // ── Idempotencia: verificar si ya procesamos esta notificación ────
        if (notificationId) {
            const { data: existingLog } = await supabase
                .from("mp_webhook_log")
                .select("id, processed")
                .eq("notification_id", String(notificationId))
                .maybeSingle();

            if (existingLog?.processed) {
                return ok({ status: "already_processed" });
            }

            // Registrar el evento antes de procesar
            if (!existingLog) {
                await supabase.from("mp_webhook_log").insert({
                    notification_id: String(notificationId),
                    action: body?.action || null,
                    type: topic || null,
                    data_id: String(resourceId),
                    payload: body,
                }); // Si falla (tabla no existe), seguimos
            }
        }

        let result: Record<string, unknown> = {};

        // ── Pago de Checkout Pro (suscripción manual mensual) ────────────
        if (topic === "payment" || body?.action === "payment.created" || body?.action === "payment.updated") {
            const sanitizedId = String(resourceId).replace(/[^0-9]/g, "");
            if (!sanitizedId || sanitizedId.length > 20) return ok();

            const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${sanitizedId}`, {
                headers: { Authorization: `Bearer ${platformToken}` },
            });

            if (!mpRes.ok) {
                console.error("MP Sub Webhook: Error consultando pago", sanitizedId);
                return ok();
            }

            const payment = await mpRes.json();
            const externalRef = payment.external_reference;
            const paymentStatus = payment.status;

            // Solo procesar pagos de suscripción (prefijo sub_)
            if (!externalRef || !externalRef.startsWith("sub_")) return ok();

            const tenantId = externalRef.replace("sub_", "");

            if (paymentStatus === "approved") {
                const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                await supabase
                    .from("tenants")
                    .update({
                        subscription_status: "active",
                        subscription_ends_at: subscriptionEndsAt,
                        mp_subscription_id: sanitizedId,
                    })
                    .eq("id", tenantId);

                console.log("MP Sub Webhook: Tenant activado via Checkout Pro", tenantId);
            }

            result = { tenant_id: tenantId, status: paymentStatus };
        }

        // ── Preapproval (suscripción automática) ─────────────────────────
        if (topic === "subscription_preapproval" || body?.action?.startsWith("subscription_preapproval")) {
            const sanitizedId = String(resourceId).replace(/[^a-zA-Z0-9-]/g, "");
            if (!sanitizedId || sanitizedId.length > 60) return ok();

            const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${sanitizedId}`, {
                headers: { Authorization: `Bearer ${platformToken}` },
            });

            if (!mpRes.ok) return ok();

            const preapproval = await mpRes.json();
            const mpStatus = preapproval.status;

            let tenantId = preapproval.external_reference;
            if (!tenantId && preapproval.preapproval_plan_id) {
                const { data: t } = await supabase
                    .from("tenants")
                    .select("id")
                    .eq("mp_subscription_id", preapproval.preapproval_plan_id)
                    .single();
                tenantId = t?.id;
            }
            if (!tenantId) return ok();

            if (mpStatus === "authorized") {
                const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                await supabase.from("tenants").update({
                    subscription_status: "active",
                    mp_subscription_id: sanitizedId,
                    subscription_ends_at: subscriptionEndsAt,
                }).eq("id", tenantId);
                console.log("MP Sub Webhook: Tenant activado via preapproval", tenantId);
            } else if (mpStatus === "paused") {
                await supabase.from("tenants").update({ subscription_status: "past_due" }).eq("id", tenantId);
            } else if (mpStatus === "cancelled") {
                await supabase.from("tenants").update({ subscription_status: "cancelled" }).eq("id", tenantId);
            }

            result = { tenant_id: tenantId, status: mpStatus };
        }

        // ── Pago autorizado recurrente ───────────────────────────────────
        if (topic === "subscription_authorized_payment" || body?.action?.startsWith("payment")) {
            const sanitizedId = String(resourceId).replace(/[^a-zA-Z0-9-]/g, "");
            if (!sanitizedId || sanitizedId.length > 60) return ok();

            const mpRes = await fetch(`https://api.mercadopago.com/authorized_payments/${sanitizedId}`, {
                headers: { Authorization: `Bearer ${platformToken}` },
            });

            if (!mpRes.ok) return ok();

            const authorizedPayment = await mpRes.json();
            const preapprovalId = authorizedPayment.preapproval_id;
            const paymentStatus = authorizedPayment.status;

            if (!preapprovalId) return ok();

            const { data: tenant } = await supabase
                .from("tenants")
                .select("id")
                .eq("mp_subscription_id", preapprovalId)
                .single();

            if (!tenant) return ok();

            if (paymentStatus === "approved") {
                const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                await supabase.from("tenants").update({
                    subscription_status: "active",
                    subscription_ends_at: subscriptionEndsAt,
                }).eq("id", tenant.id);
                console.log("MP Sub Webhook: Pago recurrente aprobado", tenant.id);
            } else if (paymentStatus === "rejected") {
                await supabase.from("tenants").update({ subscription_status: "past_due" }).eq("id", tenant.id);
            }

            result = { tenant_id: tenant.id, payment_status: paymentStatus };
        }

        // ── Marcar como procesado ────────────────────────────────────────
        if (notificationId) {
            await supabase
                .from("mp_webhook_log")
                .update({ processed: true, updated_at: new Date().toISOString() })
                .eq("notification_id", String(notificationId));
        }

        return ok(result);
    } catch (e: unknown) {
        console.error("MP Sub Webhook error:", e);
        return ok();
    }
}
