import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Webhook para notificaciones de pago de suscripción (Checkout Pro)
// MP envía notificaciones cuando un pago es aprobado, rechazado, etc.

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

        // ── Notificación de pago (Checkout Pro) ──────────────────────────
        if (topic === "payment" || body?.action === "payment.created" || body?.action === "payment.updated") {
            const sanitizedId = String(resourceId).replace(/[^0-9]/g, "");
            if (!sanitizedId || sanitizedId.length > 20) {
                return NextResponse.json({ received: true }, { status: 200 });
            }

            // Consultar el pago en MP con el token de la plataforma
            const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${sanitizedId}`, {
                headers: { Authorization: `Bearer ${platformToken}` },
            });

            if (!mpRes.ok) {
                console.error("MP Sub Webhook: Error consultando pago", sanitizedId);
                return NextResponse.json({ received: true }, { status: 200 });
            }

            const payment = await mpRes.json();
            const externalRef = payment.external_reference;
            const paymentStatus = payment.status;

            // Solo procesar pagos de suscripción (external_reference empieza con "sub_")
            if (!externalRef || !externalRef.startsWith("sub_")) {
                return NextResponse.json({ received: true }, { status: 200 });
            }

            const tenantId = externalRef.replace("sub_", "");

            if (paymentStatus === "approved") {
                // Pago aprobado → activar suscripción + 30 días
                const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                const { error } = await supabase
                    .from("tenants")
                    .update({
                        subscription_status: "active",
                        subscription_ends_at: subscriptionEndsAt,
                        mp_subscription_id: sanitizedId,
                    })
                    .eq("id", tenantId);

                if (error) {
                    console.error("MP Sub Webhook: Error actualizando tenant", error);
                } else {
                    console.log("MP Sub Webhook: Tenant activado", tenantId);
                }
            } else if (paymentStatus === "rejected" || paymentStatus === "cancelled" || paymentStatus === "refunded") {
                console.log("MP Sub Webhook: Pago no aprobado", tenantId, paymentStatus);
                // No cambiamos el estado — el tenant puede reintentar
            }
            // "pending" / "in_process" → esperamos, no hacemos nada

            return NextResponse.json({ received: true, tenant_id: tenantId, status: paymentStatus }, { status: 200 });
        }

        // ── Notificación de suscripción (preapproval) — legacy support ───
        if (topic === "subscription_preapproval" || body?.action?.startsWith("subscription_preapproval")) {
            const sanitizedId = String(resourceId).replace(/[^a-zA-Z0-9-]/g, "");
            if (!sanitizedId || sanitizedId.length > 60) {
                return NextResponse.json({ received: true }, { status: 200 });
            }

            const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${sanitizedId}`, {
                headers: { Authorization: `Bearer ${platformToken}` },
            });

            if (!mpRes.ok) {
                return NextResponse.json({ received: true }, { status: 200 });
            }

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

            if (!tenantId) {
                return NextResponse.json({ received: true }, { status: 200 });
            }

            if (mpStatus === "authorized") {
                const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                await supabase
                    .from("tenants")
                    .update({
                        subscription_status: "active",
                        mp_subscription_id: sanitizedId,
                        subscription_ends_at: subscriptionEndsAt,
                    })
                    .eq("id", tenantId);
            } else if (mpStatus === "paused") {
                await supabase.from("tenants").update({ subscription_status: "past_due" }).eq("id", tenantId);
            } else if (mpStatus === "cancelled") {
                await supabase.from("tenants").update({ subscription_status: "cancelled" }).eq("id", tenantId);
            }

            return NextResponse.json({ received: true, tenant_id: tenantId, status: mpStatus }, { status: 200 });
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (e: unknown) {
        console.error("MP Sub Webhook error:", e);
        return NextResponse.json({ received: true }, { status: 200 });
    }
}
