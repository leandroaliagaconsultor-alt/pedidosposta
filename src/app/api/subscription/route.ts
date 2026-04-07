import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Crea un plan de suscripción (preapproval_plan) en MercadoPago
// y devuelve el init_point para que el usuario se suscriba.
// Usa el token de la PLATAFORMA, no del tenant.
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { tenantSlug } = body;

        if (!tenantSlug) {
            return NextResponse.json({ error: "Falta el slug del tenant" }, { status: 400 });
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
        const isSandbox = platformToken.startsWith("TEST-");

        // Crear un Preapproval Plan en MercadoPago
        // El plan genera un init_point donde el usuario ingresa su tarjeta
        // Docs: https://www.mercadopago.com.ar/developers/es/reference/subscriptions/_preapproval_plan/post
        const planPayload = {
            reason: `PedidosPosta - Full Commerce (${tenant.name})`,
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: 100, // TODO: cambiar a 60000 después de testear
                currency_id: "ARS",
            },
            back_url: `${baseUrl}/${tenantSlug}/manager/subscription/success`,
        };

        const mpResponse = await fetch("https://api.mercadopago.com/preapproval_plan", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${platformToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(planPayload),
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error("MP Plan Error:", JSON.stringify(mpData, null, 2));
            return NextResponse.json(
                { error: "Error al crear el plan en MercadoPago", mp_error: mpData },
                { status: 400 }
            );
        }

        // Guardar el plan ID en el tenant para referencia
        await supabase
            .from("tenants")
            .update({ mp_subscription_id: mpData.id })
            .eq("id", tenant.id);

        // Devolver la URL de suscripción de MP
        return NextResponse.json({ init_point: mpData.init_point });
    } catch (e: unknown) {
        console.error("MP Subscription error:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
