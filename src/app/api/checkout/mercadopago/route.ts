import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items, deliveryFee, tenantId, orderId, tenantSlug } = body;

        if (!tenantId || !items || !orderId || !tenantSlug) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        // 1. Obtener la configuración del tenant con la key de MercadoPago
        const { data: tenantData, error: tenantError } = await supabase
            .from("tenants")
            .select("is_mp_active, mp_access_token")
            .eq("id", tenantId)
            .single();

        if (tenantError || !tenantData) {
            return NextResponse.json({ error: "Error obteniendo datos del comercio" }, { status: 500 });
        }

        if (!tenantData.is_mp_active || !tenantData.mp_access_token) {
            return NextResponse.json({ error: "MercadoPago no está activo en este comercio" }, { status: 400 });
        }

        // 2. Construir los items para MercadoPago
        const mpItems = items.map((item: any) => ({
            id: item.id,
            title: `${item.name} ${item.modifiersText ? `(${item.modifiersText})` : ''}`,
            quantity: item.quantity,
            unit_price: Number(item.price),
            currency_id: "ARS",
        }));

        // Añadir el costo de envío si existe
        if (deliveryFee && deliveryFee > 0) {
            mpItems.push({
                id: "DELIVERY_FEE",
                title: "Costo de Envío",
                quantity: 1,
                unit_price: Number(deliveryFee),
                currency_id: "ARS",
            });
        }

        // 3. Crear la preferencia de pago interactuando directo con la API REST de MercadoPago
        // Necesitamos la URL base real para los callbacks
        let baseUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        if (baseUrl.includes('localhost')) {
            baseUrl = 'https://angus-pedidoposta.vercel.app';
        }

        const preferencePayload = {
            items: mpItems,
            metadata: {
                order_id: orderId,
                tenant_id: tenantId,
            },
            external_reference: orderId,
            back_urls: {
                success: `${baseUrl}/${tenantSlug}/order/${orderId}?status=success`,
                failure: `${baseUrl}/${tenantSlug}/cart?status=failure`,
                pending: `${baseUrl}/${tenantSlug}/order/${orderId}?status=pending`
            },
            auto_return: "approved",
            notification_url: `${baseUrl}/api/checkout/mercadopago/webhook`,
            statement_descriptor: tenantSlug.toUpperCase(),
        };

        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tenantData.mp_access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferencePayload)
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error("MP ERROR REST API:", mpData);
            return NextResponse.json({ error: "Error en MercadoPago API" }, { status: 400 });
        }

        // 4. Devolvemos la URL al frontend
        return NextResponse.json({ init_point: mpData.init_point });

    } catch (e: unknown) {
        console.error("Error en endpoint MP:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
