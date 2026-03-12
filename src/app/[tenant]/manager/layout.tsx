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

    // ── 2. Verificar que el usuario pertenece a este tenant (Anti-IDOR) ──
    const { data: membership } = await supabase
        .from("tenant_users")
        .select("id, tenants!inner(slug)")
        .eq("user_id", user.id)
        .eq("tenants.slug", tenant)
        .maybeSingle();

    if (!membership) {
        // God Mode bypass (SuperAdmin Llave Maestra)
        if (user.email !== "leandro@pedidosposta.com") {
            // Bloqueo Inmediato: NO es el dueño de este slug y NO es SuperAdmin.
            // Buscamos su tenant real para redirigirlo.
            const { data: ownTenant } = await supabase
                .from("tenant_users")
                .select("tenants(slug)")
                .eq("user_id", user.id)
                .limit(1)
                .single();

            if (ownTenant?.tenants) {
                const ownSlug = ((ownTenant.tenants as unknown) as { slug: string }).slug;
                redirect(`/${ownSlug}/manager`);
            } else {
                // Si por algún motivo no tiene ningún tenant en la BD, se lo patea al home general.
                redirect("/");
            }
        }
    }

    // ── 3. Autorizado → renderizar el panel con sidebar ─────────────────
    return (
        <ManagerShell tenant={tenant}>
            {children}
        </ManagerShell>
    );
}
