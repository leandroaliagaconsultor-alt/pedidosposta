import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// MercadoPago envía notificaciones como POST con query params y body
// Docs: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/notifications/webhooks

export async function POST(req: NextRequest) {
    // Responder 200 inmediatamente para que MP no reintente
    // Procesamos en el mismo request pero sin demorar la respuesta innecesariamente
    try {
        const body = await req.json();

        // MP envía distintos tipos de notificación. Solo nos interesa "payment"
        const topic = req.nextUrl.searchParams.get("topic") || body?.type;
        const paymentId = req.nextUrl.searchParams.get("id") || body?.data?.id;

        // Notificaciones de tipo "merchant_order" o "test" las ignoramos
        if (!paymentId || (topic !== "payment" && topic !== "payment.updated" && body?.action !== "payment.created" && body?.action !== "payment.updated")) {
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // Sanitizar paymentId — debe ser numérico para evitar SSRF
        const sanitizedPaymentId = String(paymentId).replace(/[^0-9]/g, "");
        if (!sanitizedPaymentId || sanitizedPaymentId.length > 20) {
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // Necesitamos obtener el mp_access_token del tenant para consultar el pago.
        // El external_reference en MP contiene el order_id.
        // Primero consultamos el pago a MP para obtener el external_reference y el status.

        // Para consultar el pago necesitamos el access_token. Como la notificación no
        // incluye el tenant, usamos service role para buscar la orden después de verificar.
        // Esto es seguro porque es un endpoint server-side que solo MP llama.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseKey) {
            console.error("MP Webhook: SUPABASE_SERVICE_ROLE_KEY no configurada");
            return NextResponse.json({ error: "Config error" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Obtener la orden que tiene status "awaiting_payment" para buscar su tenant
        // El payment_id viene como string, necesitamos consultar a MP con el token del tenant
        // Estrategia: buscar órdenes en awaiting_payment y probar con su token

        // Alternativa más eficiente: si el body tiene metadata o external_reference
        const externalRef = body?.data?.id ? null : null; // No viene en webhook directamente

        // Consultamos el pago usando los tokens de cada tenant que tenga MP activo
        // Esto es necesario porque MP no nos dice a qué tenant pertenece el pago en el webhook
        const { data: activeTenantsData } = await supabase
            .from("tenants")
            .select("id, mp_access_token")
            .eq("is_mp_active", true)
            .not("mp_access_token", "is", null);

        if (!activeTenantsData || activeTenantsData.length === 0) {
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // Intentar consultar el pago con cada token hasta encontrar el correcto
        let paymentData = null;
        let matchedTenantId: string | null = null;

        for (const t of activeTenantsData) {
            const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${sanitizedPaymentId}`, {
                headers: { "Authorization": `Bearer ${t.mp_access_token}` },
            });

            if (mpRes.ok) {
                paymentData = await mpRes.json();
                matchedTenantId = t.id;
                break;
            }
            // 401/403 = token incorrecto para este pago, probar siguiente tenant
        }

        if (!paymentData || !matchedTenantId) {
            console.error("MP Webhook: No se pudo verificar el pago", sanitizedPaymentId);
            return NextResponse.json({ received: true }, { status: 200 });
        }

        const orderId = paymentData.external_reference;
        const mpStatus = paymentData.status; // "approved", "pending", "rejected", etc.

        if (!orderId) {
            console.error("MP Webhook: Pago sin external_reference", paymentId);
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // Verificar que la orden pertenece al tenant correcto (doble check de seguridad)
        const { data: orderData } = await supabase
            .from("orders")
            .select("id, status, tenant_id")
            .eq("id", orderId)
            .eq("tenant_id", matchedTenantId)
            .single();

        if (!orderData) {
            console.error("MP Webhook: Orden no encontrada o no coincide con tenant", orderId, matchedTenantId);
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // Solo transicionar si está en awaiting_payment
        if (orderData.status !== "awaiting_payment") {
            return NextResponse.json({ received: true, already_processed: true }, { status: 200 });
        }

        // Mapear estado de MP a estado de la orden
        let newStatus: string | null = null;

        if (mpStatus === "approved") {
            newStatus = "pending"; // Pago confirmado → entra a la cola de cocina
        } else if (mpStatus === "rejected" || mpStatus === "cancelled" || mpStatus === "refunded") {
            newStatus = "cancelled";
        }
        // "pending" o "in_process" de MP = seguimos esperando, no cambiamos nada

        if (newStatus) {
            const { error: updateErr } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", orderId)
                .eq("tenant_id", matchedTenantId); // Filtro de seguridad

            if (updateErr) {
                console.error("MP Webhook: Error actualizando orden", updateErr);
            }
        }

        return NextResponse.json({ received: true, order_id: orderId, new_status: newStatus }, { status: 200 });

    } catch (e: unknown) {
        console.error("MP Webhook error:", e);
        // Siempre responder 200 para que MP no reintente infinitamente
        return NextResponse.json({ received: true }, { status: 200 });
    }
}
