import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Webhook para notificaciones de suscripciones (preapproval) de MercadoPago
// MP envía notificaciones cuando se crea, aprueba, pausa o cancela una suscripción
// y cuando se procesa cada pago recurrente (authorized_payment)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const topic = req.nextUrl.searchParams.get("topic") || body?.type;
        const resourceId = req.nextUrl.searchParams.get("id") || body?.data?.id;

        if (!resourceId) {
            return NextResponse.json({ received: true }, { status: 200 });
        }

        const platformToken = process.env.MP_PLATFORM_ACCESS_TOKEN;
        if (!platformToken) {
            console.error("MP Sub Webhook: MP_PLATFORM_ACCESS_TOKEN no configurado");
            return NextResponse.json({ received: true }, { status: 200 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        if (!supabaseKey) {
            console.error("MP Sub Webhook: No Supabase key available");
            return NextResponse.json({ received: true }, { status: 200 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // ── Notificación de suscripción (preapproval) ────────────────────
        if (topic === "subscription_preapproval" || body?.action?.startsWith("subscription_preapproval")) {
            const sanitizedId = String(resourceId).replace(/[^a-zA-Z0-9-]/g, "");
            if (!sanitizedId || sanitizedId.length > 60) {
                return NextResponse.json({ received: true }, { status: 200 });
            }

            // Consultar la suscripción en MP
            const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${sanitizedId}`, {
                headers: { Authorization: `Bearer ${platformToken}` },
            });

            if (!mpRes.ok) {
                console.error("MP Sub Webhook: Error consultando preapproval", sanitizedId);
                return NextResponse.json({ received: true }, { status: 200 });
            }

            const preapproval = await mpRes.json();
            const tenantId = preapproval.external_reference;
            const mpStatus = preapproval.status; // authorized, paused, cancelled, pending

            if (!tenantId) {
                console.error("MP Sub Webhook: Preapproval sin external_reference", sanitizedId);
                return NextResponse.json({ received: true }, { status: 200 });
            }

            // Mapear estado de MP a nuestro subscription_status
            if (mpStatus === "authorized") {
                // Suscripción autorizada → activar tenant + sumar 30 días
                const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                await supabase
                    .from("tenants")
                    .update({
                        subscription_status: "active",
                        mp_subscription_id: sanitizedId,
                        subscription_ends_at: subscriptionEndsAt,
                    })
                    .eq("id", tenantId);

                console.log("MP Sub Webhook: Tenant activado", tenantId);

            } else if (mpStatus === "paused") {
                await supabase
                    .from("tenants")
                    .update({ subscription_status: "past_due" })
                    .eq("id", tenantId);

                console.log("MP Sub Webhook: Tenant pausado", tenantId);

            } else if (mpStatus === "cancelled") {
                await supabase
                    .from("tenants")
                    .update({ subscription_status: "cancelled" })
                    .eq("id", tenantId);

                console.log("MP Sub Webhook: Tenant cancelado", tenantId);
            }
            // pending → no hacemos nada, esperamos autorización

            return NextResponse.json({ received: true, tenant_id: tenantId, status: mpStatus }, { status: 200 });
        }

        // ── Notificación de pago autorizado (cobro recurrente mensual) ───
        if (topic === "subscription_authorized_payment" || body?.action?.startsWith("payment")) {
            const sanitizedId = String(resourceId).replace(/[^a-zA-Z0-9-]/g, "");
            if (!sanitizedId || sanitizedId.length > 60) {
                return NextResponse.json({ received: true }, { status: 200 });
            }

            // Consultar el pago autorizado en MP
            const mpRes = await fetch(`https://api.mercadopago.com/authorized_payments/${sanitizedId}`, {
                headers: { Authorization: `Bearer ${platformToken}` },
            });

            if (!mpRes.ok) {
                // Puede ser un pago de checkout regular, no de suscripción — ignorar silenciosamente
                return NextResponse.json({ received: true }, { status: 200 });
            }

            const authorizedPayment = await mpRes.json();
            const preapprovalId = authorizedPayment.preapproval_id;
            const paymentStatus = authorizedPayment.status; // approved, rejected, etc.

            if (!preapprovalId) {
                return NextResponse.json({ received: true }, { status: 200 });
            }

            // Buscar el tenant por su mp_subscription_id
            const { data: tenant } = await supabase
                .from("tenants")
                .select("id, subscription_status")
                .eq("mp_subscription_id", preapprovalId)
                .single();

            if (!tenant) {
                console.error("MP Sub Webhook: Tenant no encontrado para preapproval", preapprovalId);
                return NextResponse.json({ received: true }, { status: 200 });
            }

            if (paymentStatus === "approved") {
                // Pago exitoso → renovar +30 días
                const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                await supabase
                    .from("tenants")
                    .update({
                        subscription_status: "active",
                        subscription_ends_at: subscriptionEndsAt,
                    })
                    .eq("id", tenant.id);

                console.log("MP Sub Webhook: Pago recurrente aprobado, renovado", tenant.id);

            } else if (paymentStatus === "rejected") {
                await supabase
                    .from("tenants")
                    .update({ subscription_status: "past_due" })
                    .eq("id", tenant.id);

                console.log("MP Sub Webhook: Pago recurrente rechazado", tenant.id);
            }

            return NextResponse.json({ received: true, tenant_id: tenant.id, payment_status: paymentStatus }, { status: 200 });
        }

        // Otro tipo de notificación — ignorar
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (e: unknown) {
        console.error("MP Sub Webhook error:", e);
        return NextResponse.json({ received: true }, { status: 200 });
    }
}
