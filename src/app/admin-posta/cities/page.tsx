"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";
import { Plus, Trash2, ArrowLeft, MapPin, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function CitiesAdminPage() {
    const supabase = createClient();
    const [cities, setCities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [adding, setAdding] = useState(false);

    useEffect(() => { fetchCities(); }, []);

    const fetchCities = async () => {
        setLoading(true);
        const { data } = await supabase.from("directory_cities").select("*").order("name");
        if (data) setCities(data);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setAdding(true);
        const slug = newName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const { error } = await supabase.from("directory_cities").insert({ name: newName.trim(), slug });
        if (error) { toast.error("Error: " + error.message); } else { toast.success(`Ciudad "${newName.trim()}" creada`); setNewName(""); fetchCities(); }
        setAdding(false);
    };

    const toggleActive = async (id: string, current: boolean) => {
        await supabase.from("directory_cities").update({ is_active: !current }).eq("id", id);
        setCities(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
        toast.success(!current ? "Ciudad activada" : "Ciudad desactivada");
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar "${name}"? Los locales de esta ciudad no se borran, solo la ciudad del selector.`)) return;
        await supabase.from("directory_cities").delete().eq("id", id);
        toast.success("Ciudad eliminada");
        fetchCities();
    };

    if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-t-2 border-primary" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <Toaster position="top-center" toastOptions={{ style: { background: "#18181b", border: "1px solid #27272a", color: "#fafafa" } }} />

            <div>
                <Link href="/admin-posta" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white mb-2 transition">
                    <ArrowLeft size={12} /> Volver al panel
                </Link>
                <h1 className="text-2xl font-extrabold tracking-tight">Ciudades del Directorio</h1>
                <p className="text-sm text-zinc-400 mt-1">Gestioná las ciudades donde opera el directorio gastronómico.</p>
            </div>

            {/* Add new */}
            <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAdd()}
                        placeholder="Nombre de la ciudad (ej: Luján)"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary outline-none"
                    />
                </div>
                <button onClick={handleAdd} disabled={adding || !newName.trim()} className="inline-flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl hover:brightness-110 transition disabled:opacity-50">
                    <Plus size={16} /> Agregar
                </button>
            </div>

            {/* List */}
            <div className="rounded-2xl border border-zinc-800 bg-[#09090b] overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900 text-[10px] uppercase font-extrabold tracking-widest text-zinc-500">
                        <tr>
                            <th className="px-5 py-3">Ciudad</th>
                            <th className="px-5 py-3">Slug (URL)</th>
                            <th className="px-5 py-3">Estado</th>
                            <th className="px-5 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {cities.map(city => (
                            <tr key={city.id} className="hover:bg-zinc-900/40 transition-colors">
                                <td className="px-5 py-3 font-bold text-white flex items-center gap-2">
                                    <MapPin size={14} className="text-primary" /> {city.name}
                                </td>
                                <td className="px-5 py-3 text-zinc-400 font-mono text-xs">/directorio/{city.slug}</td>
                                <td className="px-5 py-3">
                                    <button onClick={() => toggleActive(city.id, city.is_active)}
                                        className={`inline-flex items-center gap-1 text-[10px] font-bold ${city.is_active ? "text-emerald-400" : "text-zinc-600"}`}>
                                        {city.is_active ? <><Eye size={11} /> Activa</> : <><EyeOff size={11} /> Inactiva</>}
                                    </button>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <button onClick={() => handleDelete(city.id, city.name)} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition" title="Eliminar">
                                        <Trash2 size={13} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {cities.length === 0 && (
                            <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-600">No hay ciudades. Agregá la primera.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
