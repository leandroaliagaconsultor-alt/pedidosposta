import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  🔒 SUPER ADMIN — CAMBIÁ ESTE EMAIL POR EL TUYO                          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
const SUPER_ADMIN_EMAIL = "leandro@pedidosposta.com";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ── Detectar si es la página de login ────────────────────────────────
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";
    const isLoginPage = pathname === "/admin/login";

    // ── Si es login page → renderizar sin guard ─────────────────────────
    if (isLoginPage) {
        return <>{children}</>;
    }

    // ── Verificar sesión ────────────────────────────────────────────────
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/admin/login");
    }

    // ── Validar email del superadmin ────────────────────────────────────
    if (user.email !== SUPER_ADMIN_EMAIL) {
        // 🚫 No sos el admin supremo.
        redirect("/admin/login");
    }

    // ── Autorizado → renderizar ─────────────────────────────────────────
    return <>{children}</>;
}
