import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
    try {
        const { tenantId, listingId } = await req.json();

        if (!tenantId && !listingId) {
            return NextResponse.json({ error: "Missing id" }, { status: 400 });
        }

        const id = tenantId || listingId;
        if (typeof id !== "string" || !UUID_RE.test(id)) {
            return NextResponse.json({ error: "Invalid format" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const row: Record<string, string> = {};
        if (tenantId) row.tenant_id = tenantId;
        if (listingId) row.listing_id = listingId;

        await supabase.from("directory_clicks").insert(row);

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}
