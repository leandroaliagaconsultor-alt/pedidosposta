import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Crea una suscripción (preapproval) en MercadoPago con status "pending"
// Esto genera un init_point con contexto del pagador (reduce rechazos por fraude)
// Usa el token de la PLATAFORMA, no del tenant.
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { tenantSlug, payerEmail } = body;

        if (!tenantSlug) {
            return NextResponse.json({ error: "Falta el slug del tenant" }, { status: 400 });
        }

        const platformToken = process.env.MP_PLATFORM_ACCESS_TOKEN;
        if (!platformToken) {
            console.error("MP Subscription: MP_PLATFORM_ACCESS_TOKEN no configurado");
            return NextResponse.json({ error: "Configuración de pagos no disponible" }, { status: 500 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey);

        const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .select("id, name, subscription_status, mp_subscription_id")
            .eq("slug", tenantSlug)
            .single();

        if (tenantError || !tenant) {
            return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
        }

        if (tenant.subscription_status === "active" && tenant.mp_subscription_id) {
            return NextResponse.json({ error: "Ya tenés una suscripción activa" }, { status: 400 });
        }

        const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://pedidosposta.com";

        // Crear suscripción con status "pending" → MP devuelve init_point para checkout
        // Docs: https://www.mercadopago.com.ar/developers/es/reference/subscriptions/_preapproval/post
        const preapprovalPayload: Record<string, unknown> = {
            reason: `PedidosPosta - Full Commerce (${tenant.name})`,
            external_reference: tenant.id,
            status: "pending",
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: 100, // TODO: cambiar a 60000 después de testear
                currency_id: "ARS",
            },
            back_url: `${baseUrl}/${tenantSlug}/manager/subscription/success`,
        };

        // payer_email ayuda al anti-fraude de MP — agregarlo si está disponible
        if (payerEmail) {
            preapprovalPayload.payer_email = payerEmail;
        }

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

        // Guardar el preapproval ID en el tenant
        await supabase
            .from("tenants")
            .update({ mp_subscription_id: mpData.id })
            .eq("id", tenant.id);

        return NextResponse.json({ init_point: mpData.init_point });
    } catch (e: unknown) {
        console.error("MP Subscription error:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
