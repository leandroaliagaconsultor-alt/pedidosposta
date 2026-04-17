import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DirectoryClient } from "./DirectoryClient";

interface Props {
    params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { city } = await params;
    const cityName = city.charAt(0).toUpperCase() + city.slice(1);
    return {
        title: `Dónde Pedir en ${cityName} — PedidosPosta`,
        description: `Directorio gastronómico de ${cityName}. Encontrá hamburgueserías, pizzerías, sushi y más. Pedí online o por WhatsApp.`,
    };
}

export default async function DirectoryPage({ params }: Props) {
    const { city } = await params;
    const supabase = await createClient();

    // 1. Fetch directory listings (tabla separada)
    const { data: listings } = await supabase
        .from("directory_listings")
        .select("id, name, description, categories, logo_url, external_url, opening_hours, is_active, city, address")
        .eq("city", city.toLowerCase())
        .eq("is_active", true)
        .order("name", { ascending: true });

    // 2. Fetch SaaS tenants visible in directory
    const { data: saasTenants } = await supabase
        .from("tenants")
        .select("id, name, slug, description, category, categories, type, logo_url, external_url, opening_hours, schedule, override_status, is_directory_active, city, business_hours, address")
        .eq("city", city.toLowerCase())
        .eq("is_directory_active", true)
        .eq("type", "saas")
        .order("name", { ascending: true });

    // 3. Normalize listings to match Tenant interface
    const normalizedListings = (listings || []).map(l => ({
        id: l.id,
        name: l.name,
        slug: "",
        description: l.description,
        category: (l.categories && l.categories[0]) || "otros",
        categories: l.categories,
        type: "directory" as const,
        logo_url: l.logo_url,
        external_url: l.external_url,
        opening_hours: l.opening_hours,
        schedule: null,
        override_status: null,
        is_directory_active: true,
        city: l.city,
        business_hours: null,
        address: l.address,
    }));

    const allTenants = [...(saasTenants || []), ...normalizedListings];

    if (allTenants.length === 0 && !listings && !saasTenants) return notFound();

    return <DirectoryClient tenants={allTenants} city={city} />;
}
