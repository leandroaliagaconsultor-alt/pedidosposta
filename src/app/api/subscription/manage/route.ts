import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Gestionar suscripción — cancelar, pausar o reactivar
// Solo aplica a suscripciones automáticas (preapproval).
// Para pagos manuales, simplemente se marca como cancelled en la DB.
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { tenantSlug, action } = body;

        if (!tenantSlug || !action) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        if (!["cancel", "pause", "reactivate"].includes(action)) {
            return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
        }

        const platformToken = process.env.MP_PLATFORM_ACCESS_TOKEN;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey);

        const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .select("id, subscription_status, mp_subscription_id, subscription_ends_at")
            .eq("slug", tenantSlug)
            .single();

        if (tenantError || !tenant) {
            return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
        }

        // ── Cancelar ─────────────────────────────────────────────────────
        if (action === "cancel") {
            // Si tiene preapproval en MP, cancelarlo allá también
            if (tenant.mp_subscription_id && platformToken) {
                // Intentar cancelar en MP (puede fallar si es un payment ID, no preapproval)
                const mpRes = await fetch(
                    `https://api.mercadopago.com/preapproval/${tenant.mp_subscription_id}`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${platformToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ status: "cancelled" }),
                    }
                );

                if (mpRes.ok) {
                    console.log("MP: Preapproval cancelado", tenant.mp_subscription_id);
                }
                // Si falla (ej: es un payment ID de checkout pro), seguimos con la cancelación local
            }

            // Cancelar en nuestra DB — mantener acceso hasta subscription_ends_at
            await supabase
                .from("tenants")
                .update({ subscription_status: "cancelled" })
                .eq("id", tenant.id);

            return NextResponse.json({
                success: true,
                message: "Suscripción cancelada",
                access_until: tenant.subscription_ends_at,
            });
        }

        // ── Pausar ───────────────────────────────────────────────────────
        if (action === "pause") {
            if (tenant.mp_subscription_id && platformToken) {
                await fetch(
                    `https://api.mercadopago.com/preapproval/${tenant.mp_subscription_id}`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${platformToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ status: "paused" }),
                    }
                );
            }

            await supabase
                .from("tenants")
                .update({ subscription_status: "past_due" })
                .eq("id", tenant.id);

            return NextResponse.json({ success: true, message: "Suscripción pausada" });
        }

        // ── Reactivar ────────────────────────────────────────────────────
        if (action === "reactivate") {
            if (tenant.mp_subscription_id && platformToken) {
                await fetch(
                    `https://api.mercadopago.com/preapproval/${tenant.mp_subscription_id}`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${platformToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ status: "authorized" }),
                    }
                );
            }

            const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            await supabase
                .from("tenants")
                .update({
                    subscription_status: "active",
                    subscription_ends_at: subscriptionEndsAt,
                })
                .eq("id", tenant.id);

            return NextResponse.json({ success: true, message: "Suscripción reactivada" });
        }

        return NextResponse.json({ error: "Acción no implementada" }, { status: 400 });
    } catch (e: unknown) {
        console.error("MP Manage error:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
