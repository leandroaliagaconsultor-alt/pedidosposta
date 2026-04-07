import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Crea una preferencia de pago (Checkout Pro) para la suscripción mensual.
// Usa el mismo flujo probado que ya funciona para los pedidos de los clientes.
// Cuando MP confirma el pago, el webhook activa la suscripción del tenant.
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

        // Usar Checkout Pro (preferencia de pago) — mismo flujo que ya funciona para pedidos
        const preferencePayload = {
            items: [
                {
                    id: "plan-full-commerce",
                    title: `PedidosPosta - Plan Full Commerce (${tenant.name})`,
                    description: "Suscripción mensual — Menú digital, pedidos online, analytics y más",
                    quantity: 1,
                    unit_price: 100, // TODO: cambiar a 60000 después de testear
                    currency_id: "ARS",
                },
            ],
            external_reference: `sub_${tenant.id}`,
            back_urls: {
                success: `${baseUrl}/${tenantSlug}/manager/subscription/success`,
                failure: `${baseUrl}/${tenantSlug}/manager/subscription`,
                pending: `${baseUrl}/${tenantSlug}/manager/subscription/success`,
            },
            auto_return: "approved",
            notification_url: `${baseUrl}/api/subscription/webhook`,
            statement_descriptor: "PEDIDOSPOSTA",
        };

        const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${platformToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(preferencePayload),
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error("MP Preference Error:", JSON.stringify(mpData, null, 2));
            return NextResponse.json(
                { error: "Error al crear el pago en MercadoPago", mp_error: mpData },
                { status: 400 }
            );
        }

        return NextResponse.json({ init_point: mpData.init_point });
    } catch (e: unknown) {
        console.error("MP Subscription error:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
