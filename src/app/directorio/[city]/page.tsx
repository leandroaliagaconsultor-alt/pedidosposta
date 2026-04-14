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

    const { data: tenants, error } = await supabase
        .from("tenants")
        .select("id, name, slug, description, category, categories, type, logo_url, banner_url, external_url, opening_hours, is_directory_active, city")
        .eq("city", city.toLowerCase())
        .eq("is_directory_active", true)
        .order("type", { ascending: true }) // saas first
        .order("name", { ascending: true });

    if (error || !tenants) return notFound();

    return <DirectoryClient tenants={tenants} city={city} />;
}
