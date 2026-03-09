import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
    // 1. Respuesta base — se pasan los headers del request original para que
    //    las Server Components puedan leerlos sin problemas.
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // 2. Cliente de Supabase SSR con sincronización de cookies correcta.
    //    El patrón de setAll garantiza que el token de sesión refrescado
    //    se escriba tanto en el objeto `request` (para RSC) como en la
    //    `response` final (para el navegador).
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // Paso 1: mutar el request para que RSC vean las cookies ya frescas.
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );

                    // Paso 2: recrear la response con el request mutado y
                    //         escribir las cookies en la respuesta HTTP real
                    //         para que el navegador las almacene.
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 3. Llamada OBLIGATORIA a getUser() — este es el mecanismo que dispara
    //    el refresh del token de sesión y activa setAll() si las cookies
    //    necesitan actualizarse. No se puede omitir.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 4. Lógica de subdominio → reescritura de ruta interna.
    const url = request.nextUrl.clone();
    const hostname = request.headers.get("host") || "";

    const isLocalhost =
        hostname.includes("localhost:") || hostname.includes("127.0.0.1");
    const mainDomain = isLocalhost ? hostname : "pedidoposta.com";
    let tenantSlug = "";

    if (hostname !== mainDomain && !hostname.startsWith("www.")) {
        tenantSlug = hostname.split(".")[0];
    }

    if (tenantSlug && !url.pathname.startsWith(`/${tenantSlug}`)) {
        url.pathname = `/${tenantSlug}${url.pathname}`;

        // IMPORTANTE: al reescribir debemos propagar las cookies de sesión
        // que setAll() pudo haber establecido en `response`. Las copiamos
        // a la nueva NextResponse.rewrite para que no se pierdan.
        const rewriteResponse = NextResponse.rewrite(url);
        response.cookies.getAll().forEach(({ name, value }) => {
            rewriteResponse.cookies.set(name, value);
        });

        response = rewriteResponse;
    }

    // 5. Guards de autenticación para las rutas /manager.
    //    Usamos request.nextUrl.pathname (la ruta ORIGINAL antes del rewrite)
    //    para determinar si la ruta es una ruta de manager, ya que en modo
    //    path (sin subdominio) la URL real YA incluye el tenant en el path.
    const originalPathname = request.nextUrl.pathname;
    const segments = originalPathname.split("/").filter(Boolean);

    // La ruta de manager tiene forma: /[tenant]/manager[/...]
    if (segments.length >= 2 && segments[1] === "manager") {
        const isLoginPath = segments[2] === "login";
        const currentTenant = segments[0];

        if (!user && !isLoginPath) {
            // Sin sesión → redirigir a login del tenant correcto
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = `/${currentTenant}/manager/login`;
            // Limpiar query params para no arrastrar basura
            loginUrl.search = "";
            return NextResponse.redirect(loginUrl);
        }

        if (user && isLoginPath) {
            // Ya autenticado en la página de login → redirigir al dashboard
            const dashboardUrl = request.nextUrl.clone();
            dashboardUrl.pathname = `/${currentTenant}/manager`;
            dashboardUrl.search = "";
            return NextResponse.redirect(dashboardUrl);
        }
    }

    // 6. Devolver la response (con cookies de sesión sincronizadas si hubo refresh).
    return response;
}

export const config = {
    matcher: [
        /*
         * Ejecutar en todas las rutas EXCEPTO:
         * - _next/static  (archivos estáticos del bundle)
         * - _next/image   (optimización de imágenes)
         * - favicon.ico, robots.txt, sitemap.xml
         * - Cualquier archivo con extensión de imagen/fuente/svg
         */
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
    ],
};
