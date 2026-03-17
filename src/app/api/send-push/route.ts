import { NextResponse } from "next/server";
import webpush from "web-push";

// Configurar VAPID details
webpush.setVapidDetails(
    'mailto:contacto@pedidoposta.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
    try {
        const { subscription, title, body, url } = await req.json();

        if (!subscription) {
            return NextResponse.json({ error: "Missing subscription" }, { status: 400 });
        }

        const payload = JSON.stringify({
            title,
            body,
            url: url || '#'
        });

        await webpush.sendNotification(subscription, payload);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Push Error: ", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
