import { NextRequest, NextResponse } from "next/server";

// Subdominios que NO son ciudades
const RESERVED = new Set(["www", "api", "app", "admin", "mail", "ftp", "staging", "dev"]);

export function middleware(req: NextRequest) {
    const hostname = req.headers.get("host") || "";

    // Solo procesar subdominios de pedidosposta.com
    const match = hostname.match(/^([a-z0-9-]+)\.pedidosposta\.com$/i);
    if (!match) return NextResponse.next();

    const subdomain = match[1].toLowerCase();

    // Ignorar subdominios reservados
    if (RESERVED.has(subdomain)) return NextResponse.next();

    // Reescribir: mercedes.pedidosposta.com → /directorio/mercedes
    const url = req.nextUrl.clone();
    url.pathname = `/directorio/${subdomain}`;
    return NextResponse.rewrite(url);
}

export const config = {
    matcher: ["/"],
};
