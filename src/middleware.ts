import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    // 1. Initial response and setup
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 2. Authentication check
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 3. Subdomain rewriting & URL matching
    const url = request.nextUrl.clone();
    const hostname = request.headers.get("host") || "";

    // Basic check for localhost vs custom domains
    const isLocalhost = hostname.includes("localhost:") || hostname.includes("127.0.0.1");
    const mainDomain = isLocalhost ? hostname : "pedidoposta.com";
    let tenantSlug = "";

    if (hostname !== mainDomain && !hostname.startsWith("www.")) {
        // This is a subdomain
        tenantSlug = hostname.split(".")[0];
    }

    // Rewrite if subdomain is used and we aren't already looking at /[tenant]
    if (tenantSlug && !url.pathname.startsWith(`/${tenantSlug}`)) {
        url.pathname = `/${tenantSlug}${url.pathname}`;
        // Re-create the response to rewrite the internally processed path
        response = NextResponse.rewrite(url);
    }

    // Determine the effective path after rewrites to perform Auth guards
    const effectivePath = tenantSlug ? url.pathname : request.nextUrl.pathname;

    // e.g. effectivePath = "/angus/manager/login"
    const segments = effectivePath.split("/").filter(Boolean);

    // Check if it's protecting /manager
    if (segments.length >= 2 && segments[1] === "manager") {
        const isLoginPath = segments[2] === "login";
        const currentTenant = segments[0];

        // Build absolute URL for redirect
        const redirectUrl = request.nextUrl.clone();

        if (!user && !isLoginPath) {
            // Redirect to login
            redirectUrl.pathname = tenantSlug ? "/manager/login" : `/${currentTenant}/manager/login`;
            return NextResponse.redirect(redirectUrl);
        }

        if (user && isLoginPath) {
            // Authenticated but on login page, send to dashboard
            redirectUrl.pathname = tenantSlug ? "/manager" : `/${currentTenant}/manager`;
            return NextResponse.redirect(redirectUrl);
        }
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
