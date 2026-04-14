import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const { tenantId } = await req.json();

        if (!tenantId || typeof tenantId !== "string") {
            return NextResponse.json({ error: "Invalid tenantId" }, { status: 400 });
        }

        // Sanitize UUID format
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
            return NextResponse.json({ error: "Invalid format" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.from("directory_clicks").insert({ tenant_id: tenantId });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}
