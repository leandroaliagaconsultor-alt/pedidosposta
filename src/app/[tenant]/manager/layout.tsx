import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import ManagerShell from "./ManagerShell";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  🔑 SUPER ADMIN — Tiene acceso global a TODOS los tenants                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
const SUPER_ADMIN_EMAIL = "leandro@pedidosposta.com";

export default async function ManagerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tenant: string }>;
}) {
    const { tenant } = await params;

    // ── Login page: renderizar sin sidebar ni guard ──────────────────────
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";
    const isLoginPage = pathname.endsWith("/login");

    if (isLoginPage) {
        return <>{children}</>;
    }

    const supabase = await createClient();

    // ── 1. Obtener usuario autenticado ──────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${tenant}/manager/login`);
    }

    // ── 2. LLAVE MAESTRA: Super Admin bypasea el RBAC ───────────────────
    if (user.email === SUPER_ADMIN_EMAIL) {
        // 🔑 God Mode: acceso global sin restricciones
        return (
            <ManagerShell tenant={tenant}>
                {children}
            </ManagerShell>
        );
    }

    // ── 3. Verificar que el usuario pertenece a este tenant ─────────────
    const { data: membership } = await supabase
        .from("tenant_users")
        .select("id, tenants!inner(slug)")
        .eq("user_id", user.id)
        .eq("tenants.slug", tenant)
        .maybeSingle();

    if (!membership) {
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

        redirect(`/${tenant}/manager/login`);
    }

    // ── 4. Autorizado → renderizar el panel con sidebar ─────────────────
    return (
        <ManagerShell tenant={tenant}>
            {children}
        </ManagerShell>
    );
}
