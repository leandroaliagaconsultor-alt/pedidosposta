import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import StorefrontClient, { type StorefrontData } from "./StorefrontClient";
import type { Product, Modifier, ModifierOption } from "@/components/storefront/ProductModal";

// ─── ISR: Revalidar cada 1 hora ─────────────────────────────────────────────
export const revalidate = 3600;

// ─── Supabase client sin cookies (permite caching estático) ─────────────────
function getPublicSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// ─── Columnas explícitas por tabla ──────────────────────────────────────────
const TENANT_COLUMNS = [
    "id", "name", "slug", "color_hex", "logo_url", "banner_url",
    "address", "business_hours", "schedule", "override_status",
    "announcement_text", "is_suspended", "min_order", "public_phone",
    "instagram_url", "facebook_url", "delivery_pricing_type",
    "fixed_delivery_price", "base_delivery_price", "base_delivery_km",
    "extra_price_per_km", "theme", "show_whatsapp_checkout",
    "subscription_status", "trial_ends_at"
].join(", ");

const PRODUCT_COLUMNS = [
    "id", "category_id", "name", "description", "price",
    "promotional_price", "badges", "image_url", "sort_order"
].join(", ");

const MODIFIER_COLUMNS = "id, name, is_required, is_multiple";

const MODIFIER_OPTION_COLUMNS = "id, modifier_id, name, additional_price, is_default, is_available";

const PRODUCT_MODIFIER_COLUMNS = "product_id, modifier_id";

// ─── DB Row types (sin tipos generados de Supabase) ─────────────────────────
type TenantRow = StorefrontData["brand"] & { id: string };
type CategoryRow = { id: string; name: string };
type ProductRow = { id: string; category_id: string | null; name: string; description: string | null; price: number; promotional_price: number | null; badges: string[] | null; image_url: string | null; sort_order: number };
type ModifierRow = { id: string; name: string; is_required: boolean; is_multiple: boolean };
type ModifierOptionRow = { id: string; modifier_id: string; name: string; additional_price: number; is_default: boolean; is_available: boolean };
type PivotRow = { product_id: string; modifier_id: string };

// ─── Server Component ───────────────────────────────────────────────────────

export default async function StorefrontPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant: tenantSlug } = await params;
    const supabase = getPublicSupabase();

    // 1. Fetch tenant con columnas explícitas
    const { data: rawTenant } = await supabase
        .from("tenants")
        .select(TENANT_COLUMNS)
        .eq("slug", tenantSlug)
        .single();

    const tenantData = rawTenant as TenantRow | null;
    if (!tenantData) notFound();

    // 2. Fetch en paralelo: categories, products, modifiers, options, pivot
    const [catRes, prodRes, modRes, optRes, pivotRes] = await Promise.all([
        supabase
            .from("categories")
            .select("id, name")
            .eq("tenant_id", tenantData.id)
            .order("sort_order", { ascending: true }),
        supabase
            .from("products")
            .select(PRODUCT_COLUMNS)
            .eq("tenant_id", tenantData.id)
            .eq("is_available", true)
            .order("sort_order", { ascending: true }),
        supabase
            .from("modifiers")
            .select(MODIFIER_COLUMNS)
            .eq("tenant_id", tenantData.id),
        supabase
            .from("modifier_options")
            .select(`${MODIFIER_OPTION_COLUMNS}, modifiers!inner(tenant_id)`)
            .eq("modifiers.tenant_id", tenantData.id),
        supabase
            .from("product_modifiers")
            .select(PRODUCT_MODIFIER_COLUMNS)
    ]);

    // 3. Mapear datos (server-side, no se envía al browser)
    const categories = (catRes.data ?? []) as unknown as CategoryRow[];

    // Map pivot: product_id → [modifier_id]
    const prodModMap: Record<string, string[]> = {};
    for (const row of ((pivotRes.data ?? []) as unknown as PivotRow[])) {
        if (!prodModMap[row.product_id]) prodModMap[row.product_id] = [];
        prodModMap[row.product_id].push(row.modifier_id);
    }

    // Map options: modifier_id → ModifierOption[]
    const groupedOptions: Record<string, ModifierOption[]> = {};
    for (const opt of ((optRes.data ?? []) as unknown as ModifierOptionRow[])) {
        if (!groupedOptions[opt.modifier_id]) groupedOptions[opt.modifier_id] = [];
        groupedOptions[opt.modifier_id].push({
            id: opt.id,
            name: opt.name,
            additionalPrice: opt.additional_price,
            isDefault: opt.is_default ?? false,
            isAvailable: opt.is_available ?? true,
        });
    }

    // Map modifiers: id → Modifier
    const allModifiersMap: Record<string, Modifier> = {};
    for (const m of ((modRes.data ?? []) as unknown as ModifierRow[])) {
        allModifiersMap[m.id] = {
            id: m.id,
            name: m.name,
            isRequired: m.is_required,
            isMultiple: m.is_multiple,
            options: groupedOptions[m.id] || [],
        };
    }

    // Build final products
    const productRows = (prodRes.data ?? []) as unknown as ProductRow[];

    const products: Product[] = productRows.map((p) => {
        const linkedModIds = (prodModMap[p.id] || []);
        const productModifiers = linkedModIds
            .map((mid: string) => allModifiersMap[mid])
            .filter(Boolean);

        return {
            id: p.id,
            categoryId: p.category_id ?? undefined,
            name: p.name,
            description: p.description || "",
            price: p.price,
            promotionalPrice: p.promotional_price || undefined,
            badges: p.badges || [],
            imageUrl: p.image_url || undefined,
            modifiers: productModifiers,
        };
    });

    // 4. Construir los datos para el client
    const storefrontData: StorefrontData = {
        brand: tenantData,
        categories,
        products,
    };

    return <StorefrontClient data={storefrontData} />;
}
