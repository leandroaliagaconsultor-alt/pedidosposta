import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

// Configurar VAPID details
webpush.setVapidDetails(
    'mailto:contacto@pedidoposta.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
    try {
        // Auth check — solo owners/managers del tenant pueden enviar push
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { subscription, title, body, url } = await req.json();

        if (!subscription) {
            return NextResponse.json({ error: "Missing subscription" }, { status: 400 });
        }

        const payload = JSON.stringify({
            title: title || "PedidosPosta",
            body: body || "",
            url: url || '#'
        });

        await webpush.sendNotification(subscription, payload);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("Push Error: ", error);
        return NextResponse.json({ error: "Error al enviar notificacion" }, { status: 500 });
    }
}
