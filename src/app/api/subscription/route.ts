import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Crea un pago de suscripción en MercadoPago.
// Soporta dos modos:
//   mode: "auto"   → preapproval_plan (débito automático mensual, solo tarjeta de crédito)
//   mode: "manual"  → checkout/preferences (pago único mensual, acepta todo: débito, crédito, MP, transferencia)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { tenantSlug, mode = "manual" } = body;

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
        const amount = 100; // TODO: cambiar a 60000 después de testear

        // ── Modo automático: preapproval_plan (crédito, débito automático mensual) ──
        if (mode === "auto") {
            const planPayload = {
                reason: `PedidosPosta - Full Commerce (${tenant.name})`,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: amount,
                    currency_id: "ARS",
                },
                back_url: `${baseUrl}/${tenantSlug}/manager/subscription/success`,
            };

            const mpRes = await fetch("https://api.mercadopago.com/preapproval_plan", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${platformToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(planPayload),
            });

            const mpData = await mpRes.json();

            if (!mpRes.ok) {
                console.error("MP Plan Error:", JSON.stringify(mpData, null, 2));
                return NextResponse.json(
                    { error: "Error al crear la suscripción en MercadoPago", mp_error: mpData },
                    { status: 400 }
                );
            }

            // Guardar plan ID para el webhook
            await supabase
                .from("tenants")
                .update({ mp_subscription_id: mpData.id })
                .eq("id", tenant.id);

            return NextResponse.json({ init_point: mpData.init_point });
        }

        // ── Modo manual: Checkout Pro (débito, crédito, MP, transferencia) ──
        const preferencePayload = {
            items: [
                {
                    id: "plan-full-commerce",
                    title: `PedidosPosta - Plan Full Commerce (${tenant.name})`,
                    description: "Suscripción mensual — Menú digital, pedidos online, analytics y más",
                    quantity: 1,
                    unit_price: amount,
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

        const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${platformToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(preferencePayload),
        });

        const mpData = await mpRes.json();

        if (!mpRes.ok) {
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
