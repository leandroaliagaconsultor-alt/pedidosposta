import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Crea una suscripción (preapproval) en MercadoPago
// Usa el token de la PLATAFORMA, no del tenant
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { tenantSlug, payerEmail } = body;

        if (!tenantSlug || !payerEmail) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        const platformToken = process.env.MP_PLATFORM_ACCESS_TOKEN;
        if (!platformToken) {
            console.error("MP Subscription: MP_PLATFORM_ACCESS_TOKEN no configurado");
            return NextResponse.json({ error: "Configuración de pagos no disponible" }, { status: 500 });
        }

        // Verificar que el tenant existe y no está ya activo
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        // Usar service role si disponible (para poder escribir), sino anon key para leer
        const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey);

        const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .select("id, name, subscription_status, mp_subscription_id")
            .eq("slug", tenantSlug)
            .single();

        if (tenantError || !tenant) {
            return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
        }

        // Si ya tiene suscripción activa, no crear otra
        if (tenant.subscription_status === "active" && tenant.mp_subscription_id) {
            return NextResponse.json({ error: "Ya tenés una suscripción activa" }, { status: 400 });
        }

        // Construir URL base para callbacks
        const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://pedidosposta.com";

        // Crear Preapproval (suscripción automática) en MercadoPago
        // Docs: https://www.mercadopago.com.ar/developers/es/reference/subscriptions/_preapproval/post
        // En modo sandbox (token TEST-*), MP requiere test users
        const isSandbox = platformToken.startsWith("TEST-");
        const mpPayerEmail = isSandbox
            ? (process.env.MP_TEST_BUYER_EMAIL || payerEmail)
            : payerEmail;

        // Formatear fecha sin milisegundos (formato que MP acepta)
        const formatMPDate = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, ".000-00:00");
        const startDate = formatMPDate(new Date(Date.now() + 5 * 60 * 1000)); // 5 min futuro
        const endDate = formatMPDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)); // 1 año

        const preapprovalPayload = {
            reason: `PedidosPosta - Plan Full Commerce`,
            payer_email: mpPayerEmail,
            status: "pending",
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: isSandbox ? 100 : 60000,
                currency_id: "ARS",
                start_date: startDate,
                end_date: endDate,
            },
            external_reference: tenant.id,
            back_url: `${baseUrl}/${tenantSlug}/manager/subscription/success`,
        };

        console.log("MP Preapproval payload:", JSON.stringify(preapprovalPayload, null, 2));

        const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${platformToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(preapprovalPayload),
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error("MP Subscription Error:", JSON.stringify(mpData, null, 2));
            return NextResponse.json(
                { error: "Error al crear la suscripción en MercadoPago", mp_error: mpData },
                { status: 400 }
            );
        }

        // Guardar el preapproval ID en el tenant para referencia
        await supabase
            .from("tenants")
            .update({ mp_subscription_id: mpData.id })
            .eq("id", tenant.id);

        // Devolver la URL de pago de MP
        return NextResponse.json({ init_point: mpData.init_point });
    } catch (e: unknown) {
        console.error("MP Subscription error:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
