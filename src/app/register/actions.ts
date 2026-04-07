"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { slugify } from "@/utils/slugify";

export type RegisterState = {
    error?: string;
    fieldError?: {
        name?: string;
        email?: string;
        password?: string;
        slug?: string;
    };
};

export async function registerTenant(
    _prevState: RegisterState,
    formData: FormData
): Promise<RegisterState> {
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;

    // ── Validación básica ────────────────────────────────────────────────
    const fieldError: RegisterState["fieldError"] = {};
    if (!name || name.length < 2) fieldError.name = "El nombre del local es requerido (mín. 2 caracteres).";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldError.email = "Email inválido.";
    if (!password || password.length < 6) fieldError.password = "La contraseña debe tener mínimo 6 caracteres.";
    if (Object.keys(fieldError).length > 0) return { fieldError };

    const slug = slugify(name);
    if (!slug || slug.length < 2) {
        return { fieldError: { name: "El nombre no genera un link válido. Usá letras o números." } };
    }

    const supabase = await createClient();

    // ── Paso B: Verificar que el slug no esté en uso ─────────────────────
    const { data: existing } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (existing) {
        return { fieldError: { name: `El link "pedidosposta.com/${slug}" ya está en uso. Probá un nombre diferente.` } };
    }

    // ── Paso C: Registrar usuario en Supabase Auth ───────────────────────
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        if (signUpError.message.includes("already registered")) {
            return { fieldError: { email: "Este email ya tiene una cuenta. ¿Querés iniciar sesión?" } };
        }
        return { error: `Error al crear la cuenta: ${signUpError.message}` };
    }

    if (!signUpData.user) {
        return { error: "No se pudo crear el usuario. Intentá nuevamente." };
    }

    // ── Paso C.2: Iniciar sesión inmediatamente para obtener sesión activa ─
    // Necesitamos una sesión válida para que las políticas RLS permitan el INSERT
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        return { error: "Cuenta creada pero no pudimos iniciar sesión automáticamente. Ingresá manualmente." };
    }

    // ── Paso D: Insertar tenant con trial de 10 días ──────────────────────
    const trialEndsAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    const { data: newTenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
            name,
            slug,
            subscription_status: "trialing",
            trial_ends_at: trialEndsAt,
        })
        .select("id")
        .single();

    if (tenantError || !newTenant) {
        // Limpiar: eliminar usuario de Auth si falló la DB
        await supabase.auth.signOut();
        return { error: `Error al crear el local: ${tenantError?.message ?? "Error desconocido"}` };
    }

    // ── Paso D.2: Insertar relación tenant_users ─────────────────────────
    const { error: tuError } = await supabase
        .from("tenant_users")
        .insert({
            tenant_id: newTenant.id,
            user_id: signUpData.user.id,
            role: "owner",
        });

    if (tuError) {
        return { error: `Local creado pero error al asignar permisos: ${tuError.message}` };
    }

    // ── Paso E: Redirigir al panel del nuevo tenant ──────────────────────
    redirect(`/${slug}/manager`);
}
