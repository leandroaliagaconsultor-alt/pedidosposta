import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This route is called by a cron job to clean up old receipt files from Storage.
// Protect with CRON_SECRET header check.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    // Security: only allow calls with the correct secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Use service role if available, otherwise anon (needs proper RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    try {
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Find orders older than 7 days with receipt_url
        const { data: orders, error: fetchErr } = await supabase
            .from("orders")
            .select("id, receipt_url")
            .not("receipt_url", "is", null)
            .lt("created_at", cutoffDate)
            .limit(200);

        if (fetchErr) {
            console.error("Cron fetch error:", fetchErr);
            return NextResponse.json({ error: fetchErr.message }, { status: 500 });
        }

        if (!orders || orders.length === 0) {
            return NextResponse.json({ message: "No receipts to clean up", deleted: 0 });
        }

        // 2. Extract file paths from URLs and delete from Storage
        const filePaths: string[] = [];
        for (const order of orders) {
            if (!order.receipt_url) continue;
            // URL format: https://<project>.supabase.co/storage/v1/object/public/receipts/<path>
            const match = order.receipt_url.match(/\/receipts\/(.+)$/);
            if (match) {
                filePaths.push(match[1]);
            }
        }

        if (filePaths.length > 0) {
            const { error: deleteErr } = await supabase.storage
                .from("receipts")
                .remove(filePaths);

            if (deleteErr) {
                console.error("Storage delete error:", deleteErr);
            }
        }

        // 3. Set receipt_url to null for these orders
        const orderIds = orders.map((o) => o.id);
        const { error: updateErr } = await supabase
            .from("orders")
            .update({ receipt_url: null })
            .in("id", orderIds);

        if (updateErr) {
            console.error("Orders update error:", updateErr);
            return NextResponse.json({ error: updateErr.message }, { status: 500 });
        }

        console.log(`✅ Cron cleanup: ${filePaths.length} files deleted, ${orderIds.length} orders updated.`);
        return NextResponse.json({
            message: "Cleanup complete",
            filesDeleted: filePaths.length,
            ordersUpdated: orderIds.length,
        });
    } catch (err: any) {
        console.error("Cron error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
