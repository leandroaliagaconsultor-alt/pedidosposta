import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import ManagerShell from "./ManagerShell";

export default async function ManagerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tenant: string }>;
}) {
    const { tenant } = await params;

    // ── Login page: renderizar sin sidebar ni guard ──────────────────────
    // Leemos x-pathname inyectado por proxy.ts para saber la ruta actual.
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";
    const isLoginPage = pathname.endsWith("/login");

    if (isLoginPage) {
        // La página de login no necesita auth guard ni sidebar
        return <>{children}</>;
    }

    const supabase = await createClient();

    // ── 1. Obtener usuario autenticado ──────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Sin sesión → redirigir a login (defensa en profundidad)
        redirect(`/${tenant}/manager/login`);
    }

    // ── 2. Verificar que el usuario pertenece a este tenant ─────────────
    // Una sola query optimizada que cruza tenant_users con tenants por slug.
    const { data: membership } = await supabase
        .from("tenant_users")
        .select("id, tenants!inner(slug)")
        .eq("user_id", user.id)
        .eq("tenants.slug", tenant)
        .maybeSingle();

    if (!membership) {
        // Usuario autenticado pero NO pertenece a este tenant.
        // Buscar su tenant real para redirigirlo allí.
        const { data: ownTenant } = await supabase
            .from("tenant_users")
            .select("tenants(slug)")
            .eq("user_id", user.id)
            .limit(1)
            .single();

        if (ownTenant?.tenants) {
            const ownSlug = (ownTenant.tenants as unknown as { slug: string }).slug;
            redirect(`/${ownSlug}/manager`);
        }

        // Sin ningún tenant asignado: volver a login
        redirect(`/${tenant}/manager/login`);
    }

    // ── 3. Autorizado → renderizar el panel con sidebar ─────────────────
    return (
        <ManagerShell tenant={tenant}>
            {children}
        </ManagerShell>
    );
}
