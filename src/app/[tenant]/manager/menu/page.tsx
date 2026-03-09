"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Edit2, Image as ImageIcon, Loader2, Plus, Trash2, X, Upload } from "lucide-react";

// ─── Types & Schemas ─────────────────────────────────────────────────────────

type Category = { id: string; name: string; sort_order: number };
type Product = {
    id: string;
    category_id: string | null;
    name: string;
    description: string;
    cost_price: number | null;
    profit_margin: number | null;
    price: number;
    image_url: string | null;
    is_available: boolean;
    sort_order: number;
    modifier_ids?: string[];
};

type ModifierOption = {
    id: string;
    modifier_id: string;
    name: string;
    additional_price: number;
};
type Modifier = {
    id: string;
    name: string;
    is_required: boolean;
    is_multiple: boolean;
    options?: ModifierOption[];
};

const categorySchema = z.object({
    name: z.string().min(2, "El nombre de la categoría es requerido"),
});
type CategoryForm = z.infer<typeof categorySchema>;

const productSchema = z.object({
    name: z.string().min(2, "El nombre del producto es requerido"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, { message: "El precio no puede ser negativo" }),
    cost_price: z.coerce.number().min(0, { message: "El costo no puede ser negativo" }).default(0),
    profit_margin: z.coerce.number().min(0, { message: "El margen no puede ser negativo" }).default(0),
    category_id: z.string().min(1, "Selecciona una categoría"),
    modifier_ids: z.array(z.string()).default([]),
    image_url: z.string().optional().nullable(),
});
type ProductForm = z.infer<typeof productSchema>;

const modSchema = z.object({
    name: z.string().min(2, "El nombre del modificador es requerido"),
    is_required: z.boolean().default(false),
    is_multiple: z.boolean().default(false),
    options: z.array(z.object({
        name: z.string().min(1, "Nombre requerido"),
        additional_price: z.coerce.number().min(0, { message: "El precio no puede ser negativo" }).default(0),
    })).min(1, "Debes agregar al menos una opción"),
});
type ModForm = z.infer<typeof modSchema>;

// ─── Page Component ──────────────────────────────────────────────────────────

export default function MenuBuilderPage({ params }: { params: Promise<{ tenant: string }> }) {
    const { tenant } = use(params);
    const supabase = createClient();

    const [activeTab, setActiveTab] = useState<"productos" | "categorias" | "modificadores">("productos");
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // State
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [modifiers, setModifiers] = useState<Modifier[]>([]);

    // Modals state
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);

    const [prodModalOpen, setProdModalOpen] = useState(false);
    const [editingProd, setEditingProd] = useState<Product | null>(null);

    const [modModalOpen, setModModalOpen] = useState(false);
    const [editingMod, setEditingMod] = useState<Modifier | null>(null);

    const [saving, setSaving] = useState(false);

    // File upload ref
    const prodImgFileRef = useRef<File | null>(null);

    // Forms
    const catForm = useForm({ resolver: zodResolver(categorySchema) });
    const prodForm = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: { name: "", description: "", cost_price: 0, profit_margin: 0, price: 0 as any, category_id: "", modifier_ids: [], image_url: "" as any }
    });

    // Import useFieldArray dynamically, we need it for forms
    const { useFieldArray } = require("react-hook-form");

    const modForm = useForm({
        resolver: zodResolver(modSchema),
        defaultValues: { name: "", is_required: false, is_multiple: false, options: [{ name: "", additional_price: 0 as any }] }
    });

    const { fields: optionFields, append: optionAppend, remove: optionRemove } = useFieldArray({
        control: modForm.control,
        name: "options"
    });

    // ─── Fetch Data ───
    useEffect(() => {
        const fetchData = async () => {
            const { data: tData } = await supabase.from("tenants").select("id").eq("slug", tenant).single();
            if (!tData) return;
            setTenantId(tData.id);

            const [catRes, prodRes, modRes, optRes, pivotRes] = await Promise.all([
                supabase.from("categories").select("*").eq("tenant_id", tData.id).order("sort_order", { ascending: true }),
                supabase.from("products").select("*").eq("tenant_id", tData.id).order("sort_order", { ascending: true }),
                supabase.from("modifiers").select("*").eq("tenant_id", tData.id),
                supabase.from("modifier_options").select("*, modifiers!inner(tenant_id)").eq("modifiers.tenant_id", tData.id),
                supabase.from("product_modifiers").select("*")
            ]);

            if (catRes.data) setCategories(catRes.data);

            // Map pivot to products
            const prodModMap = (pivotRes.data || []).reduce((acc: any, curr: any) => {
                if (!acc[curr.product_id]) acc[curr.product_id] = [];
                acc[curr.product_id].push(curr.modifier_id);
                return acc;
            }, {});

            if (prodRes.data) {
                setProducts(prodRes.data.map(p => ({
                    ...p,
                    modifier_ids: prodModMap[p.id] || []
                })));
            }

            if (modRes.data) {
                // Map options to modifiers
                const groupedOptions = (optRes.data || []).reduce((acc: any, curr: any) => {
                    if (!acc[curr.modifier_id]) acc[curr.modifier_id] = [];
                    acc[curr.modifier_id].push(curr);
                    return acc;
                }, {});

                setModifiers(modRes.data.map(m => ({
                    ...m,
                    options: groupedOptions[m.id] || []
                })));
            }

            setLoading(false);
        };
        fetchData();
    }, [supabase, tenant]);

    // ─── Handlers: Categories ───
    const openCatModal = (cat: Category | null = null) => {
        setEditingCat(cat);
        if (cat) catForm.reset({ name: cat.name });
        else catForm.reset({ name: "" });
        setCatModalOpen(true);
    };

    const onSaveCat = async (data: CategoryForm) => {
        if (!tenantId) return;
        setSaving(true);
        try {
            if (editingCat) {
                const { data: updated, error } = await supabase
                    .from("categories").update({ name: data.name }).eq("id", editingCat.id).select().single();
                if (error) throw error;
                setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? updated : c)));
                toast.success("Categoría actualizada");
            } else {
                const sortOrder = categories.length;
                const { data: inserted, error } = await supabase
                    .from("categories").insert({ tenant_id: tenantId, name: data.name, sort_order: sortOrder }).select().single();
                if (error) throw error;
                setCategories((prev) => [...prev, inserted]);
                toast.success("Categoría creada");
            }
            setCatModalOpen(false);
        } catch (err: any) {
            toast.error("Error al guardar categoría", { description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const deleteCat = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta categoría? Los productos dentro quedarán sin categoría.")) return;
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (!error) {
            setCategories((prev) => prev.filter((c) => c.id !== id));
            // Refresh products so they show null category locally
            setProducts((prev) => prev.map((p) => p.category_id === id ? { ...p, category_id: null } : p));
            toast.success("Categoría eliminada");
        }
    };

    // ─── Handlers: Products ───
    const openProdModal = (prod: Product | null = null) => {
        setEditingProd(prod);
        prodImgFileRef.current = null;
        if (prod) {
            prodForm.reset({
                name: prod.name,
                description: prod.description || "",
                cost_price: prod.cost_price || 0,
                profit_margin: prod.profit_margin || 0,
                price: prod.price,
                category_id: prod.category_id || "",
                modifier_ids: prod.modifier_ids || [],
                image_url: prod.image_url || "",
            });
        } else {
            prodForm.reset({ name: "", description: "", cost_price: 0, profit_margin: 0, price: 0 as any, category_id: categories[0]?.id || "", modifier_ids: [], image_url: "" as any });
        }
        setProdModalOpen(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        prodImgFileRef.current = file;
        const tempUrl = URL.createObjectURL(file);
        prodForm.setValue("image_url", tempUrl);
    };

    const handleCostOrMarginChange = (field: 'cost_price' | 'profit_margin', rawValue: string) => {
        // Allow empty string while user types, treat as 0 for calculation
        const numValue = rawValue === '' ? 0 : parseFloat(rawValue);
        if (isNaN(numValue)) return;
        prodForm.setValue(field, numValue, { shouldValidate: true, shouldDirty: true });
        const cp = field === 'cost_price' ? numValue : Number(prodForm.getValues("cost_price") || 0);
        const pm = field === 'profit_margin' ? numValue : Number(prodForm.getValues("profit_margin") || 0);

        const newPrice = cp * (1 + (pm / 100));
        prodForm.setValue("price", Math.round(newPrice), { shouldValidate: true, shouldDirty: true });
    };

    const handlePriceChange = (rawValue: string) => {
        const numValue = rawValue === '' ? 0 : parseFloat(rawValue);
        if (isNaN(numValue)) return;
        prodForm.setValue("price", numValue, { shouldValidate: true, shouldDirty: true });
        const cp = Number(prodForm.getValues("cost_price") || 0);
        if (cp > 0) {
            const newMargin = ((numValue / cp) - 1) * 100;
            prodForm.setValue("profit_margin", parseFloat(newMargin.toFixed(1)), { shouldValidate: true, shouldDirty: true });
        }
    };

    const onSaveProd = async (data: ProductForm) => {
        if (!tenantId) return;
        setSaving(true);
        try {
            let finalImageUrl = data.image_url;

            // 1. Upload if there is a new image selected
            if (prodImgFileRef.current) {
                const fileExt = prodImgFileRef.current.name.split('.').pop() || 'tmp';
                const fileName = `${tenantId}/products/${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('tenant-assets')
                    .upload(fileName, prodImgFileRef.current, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from('tenant-assets')
                    .getPublicUrl(fileName);
                finalImageUrl = publicData.publicUrl;
            }

            let finalProd: any;
            if (editingProd) {
                const { data: updated, error } = await supabase
                    .from("products")
                    .update({
                        name: data.name,
                        description: data.description,
                        cost_price: data.cost_price,
                        profit_margin: data.profit_margin,
                        price: data.price,
                        category_id: data.category_id,
                        image_url: finalImageUrl,
                    })
                    .eq("id", editingProd.id)
                    .select().single();
                if (error) throw error;
                finalProd = updated;
            } else {
                const sortOrder = products.filter(p => p.category_id === data.category_id).length;
                const { data: inserted, error } = await supabase
                    .from("products")
                    .insert({
                        tenant_id: tenantId,
                        name: data.name,
                        description: data.description,
                        cost_price: data.cost_price,
                        profit_margin: data.profit_margin,
                        price: data.price,
                        category_id: data.category_id,
                        image_url: finalImageUrl,
                        sort_order: sortOrder,
                    })
                    .select().single();
                if (error) throw error;
                finalProd = inserted;
            }

            // Update product_modifiers pivot table
            const prodId = finalProd.id;
            await supabase.from("product_modifiers").delete().eq("product_id", prodId);
            if (data.modifier_ids.length > 0) {
                const pivotData = data.modifier_ids.map(mid => ({ product_id: prodId, modifier_id: mid }));
                const { error: pivotErr } = await supabase.from("product_modifiers").insert(pivotData);
                if (pivotErr) throw pivotErr;
            }

            // Sync state
            const prodWithMods = { ...finalProd, modifier_ids: data.modifier_ids };
            if (editingProd) {
                setProducts((prev) => prev.map((p) => (p.id === editingProd.id ? prodWithMods : p)));
            } else {
                setProducts((prev) => [...prev, prodWithMods]);
            }

            toast.success(editingProd ? "Producto actualizado" : "Producto creado");
            setProdModalOpen(false);
        } catch (err: any) {
            toast.error("Error al guardar producto", { description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const deleteProd = async (id: string) => {
        if (!confirm("¿Eliminar este producto permanentemente?")) return;
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (!error) {
            setProducts((prev) => prev.filter((p) => p.id !== id));
            toast.success("Producto eliminado");
        }
    };

    const toggleProdAvailability = async (prod: Product) => {
        const newVal = !prod.is_available;
        // Optimistic
        setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, is_available: newVal } : p)));
        const { error } = await supabase.from("products").update({ is_available: newVal }).eq("id", prod.id);
        if (error) {
            toast.error("Error al actualizar disponibilidad");
            // Revert optimism
            setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, is_available: !newVal } : p)));
        } else {
            toast.success(newVal ? "Producto activado" : "Producto pausado", { position: "bottom-center" });
        }
    };

    // ─── Handlers: Modifiers ───
    const openModModal = (mod: Modifier | null = null) => {
        setEditingMod(mod);
        if (mod) {
            modForm.reset({
                name: mod.name,
                is_multiple: mod.is_multiple,
                is_required: mod.is_required,
                options: mod.options?.length ? mod.options : [{ name: "", additional_price: 0 as any }],
            });
        } else {
            modForm.reset({ name: "", is_multiple: false, is_required: false, options: [{ name: "", additional_price: 0 as any }] });
        }
        setModModalOpen(true);
    };

    const deleteMod = async (id: string) => {
        if (!confirm("¿Eliminar este grupo de modificador?")) return;
        const { error } = await supabase.from("modifiers").delete().eq("id", id);
        if (!error) {
            setModifiers((prev) => prev.filter((p) => p.id !== id));
            toast.success("Modificador eliminado");
        }
    };

    const onSaveMod = async (data: ModForm) => {
        if (!tenantId) return;
        setSaving(true);
        try {
            if (editingMod) {
                // Update Base
                const { data: updatedBase, error: uErr } = await supabase
                    .from("modifiers")
                    .update({ name: data.name, is_multiple: data.is_multiple, is_required: data.is_required })
                    .eq("id", editingMod.id)
                    .select().single();
                if (uErr) throw uErr;

                // Simple wipe & replace for options for now
                await supabase.from("modifier_options").delete().eq("modifier_id", editingMod.id);

                const { data: insertedOpts, error: optsErr } = await supabase
                    .from("modifier_options")
                    .insert(data.options.map(opt => ({ modifier_id: editingMod.id, name: opt.name, additional_price: opt.additional_price })))
                    .select();
                if (optsErr) throw optsErr;

                setModifiers(prev => prev.map(m => m.id === editingMod.id ? { ...(updatedBase as any), options: insertedOpts } : m));
                toast.success("Modificador actualizado");
            } else {
                // Insert Base
                const { data: newBase, error: iErr } = await supabase
                    .from("modifiers")
                    .insert({ tenant_id: tenantId, name: data.name, is_multiple: data.is_multiple, is_required: data.is_required })
                    .select().single();
                if (iErr) throw iErr;

                // Insert Options
                const { data: insertedOpts, error: optsErr } = await supabase
                    .from("modifier_options")
                    .insert(data.options.map(opt => ({ modifier_id: newBase.id, name: opt.name, additional_price: opt.additional_price })))
                    .select();
                if (optsErr) throw optsErr;

                setModifiers(prev => [...prev, { ...(newBase as any), options: insertedOpts }]);
                toast.success("Modificador creado");
            }
            setModModalOpen(false);
        } catch (err: any) {
            toast.error("Error guardando modificador", { description: err.message });
        } finally {
            setSaving(false);
        }
    };

    // ─── Render ───
    if (loading) {
        return (
            <div className="flex h-full min-h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl animate-in fade-in duration-500">

            {/* ── Header ── */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">Menu Builder</h1>
                    <p className="mt-1 text-sm text-zinc-400">Gestioná las categorías y productos de tu restaurante.</p>
                </div>
                <button
                    onClick={() => openProdModal()}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_0_20px_var(--brand-color)] shadow-primary/30 transition hover:brightness-110 active:scale-95 w-full sm:w-auto justify-center"
                >
                    <Plus size={18} /> NUEVO PRODUCTO
                </button>
            </div>

            {/* ── Tabs Navigation ── */}
            <div className="mb-6 flex space-x-2 border-b border-zinc-800 pb-px">
                {(["categorias", "productos", "modificadores"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative px-4 py-2 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? "text-primary" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary shadow-[0_-2px_8px_var(--brand-color)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab Content: Categorías ── */}
            {activeTab === "categorias" && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
                        <p className="text-sm text-zinc-400">Las categorías agrupan tu menú. Ej: "Burgers", "Papas Fritas", "Bebidas".</p>
                        <button
                            onClick={() => openCatModal()}
                            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 w-full sm:w-auto text-center"
                        >
                            + Nueva Categoría
                        </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all hover:bg-zinc-800/80">
                                <span className="font-semibold text-white">{cat.name}</span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openCatModal(cat)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => deleteCat(cat.id)} className="rounded-md p-1.5 text-red-500/70 hover:bg-red-500/20 hover:text-red-400">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Tab Content: Productos ── */}
            {activeTab === "productos" && (
                <div className="space-y-8">
                    {categories.length === 0 && (
                        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200/80">
                            Crea al menos una categoría primero para poder organizar tus productos.
                        </div>
                    )}

                    {/* Group products by category UI */}
                    {categories.map((cat) => {
                        const catProds = products.filter((p) => p.category_id === cat.id);
                        if (catProds.length === 0) return null;
                        return (
                            <div key={cat.id} className="space-y-3">
                                <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">{cat.name}</h3>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {catProds.map((prod) => (
                                        <div key={prod.id} className="flex overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition-all hover:border-zinc-700 items-stretch">
                                            <div className="flex relative shrink-0 h-24 items-center justify-center p-2 border-b border-zinc-800/50 bg-zinc-800/20 mix-blend-multiply sm:mix-blend-normal overflow-hidden w-24">
                                                {prod.image_url ? (
                                                    <img src={prod.image_url} alt={prod.name} className="absolute inset-0 h-full w-full object-cover" />
                                                ) : (
                                                    <ImageIcon size={32} className="text-zinc-700 opacity-50 absolute z-10" />
                                                )}
                                            </div>
                                            <div className="flex flex-1 flex-col p-4">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-white leading-tight">{prod.name}</h4>
                                                    <span className="text-sm font-semibold text-primary font-mono">${prod.price}</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 line-clamp-2 mb-4 flex-1">{prod.description || "Sin descripción"}</p>

                                                <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3">
                                                    <label className="flex items-center cursor-pointer gap-2 text-xs font-semibold text-zinc-300 select-none">
                                                        <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${prod.is_available ? 'bg-primary' : 'bg-zinc-700'}`}>
                                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${prod.is_available ? 'translate-x-5' : 'translate-x-1'}`} />
                                                        </div>
                                                        <input type="checkbox" className="sr-only" checked={prod.is_available} onChange={() => toggleProdAvailability(prod)} />
                                                        {prod.is_available ? "Activo" : "Pausado"}
                                                    </label>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => openProdModal(prod)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => deleteProd(prod.id)} className="rounded-md p-1.5 text-red-500/70 hover:bg-red-500/20 hover:text-red-400">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Tab Content: Modificadores  ── */}
            {activeTab === "modificadores" && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
                        <p className="text-sm text-zinc-400">Los modificadores son agregados u opciones (ej: "Salsas", "Punto de carne", "Extra Queso").</p>
                        <button
                            onClick={() => openModModal()}
                            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 w-full sm:w-auto text-center"
                        >
                            + Nuevo Modificador
                        </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {modifiers.map((mod) => (
                            <div key={mod.id} className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-all hover:bg-zinc-800/80">
                                <div className="mb-3 flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-white">{mod.name}</h3>
                                        <div className="mt-1 flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                                            {mod.is_required && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-400">Requerido</span>}
                                            {mod.is_multiple ? (
                                                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-sky-400">Múltiple (Checkbox)</span>
                                            ) : (
                                                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">Único (Radio)</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openModModal(mod)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => deleteMod(mod.id)} className="rounded-md p-1.5 text-red-500/70 hover:bg-red-500/20 hover:text-red-400">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-auto border-t border-zinc-800/50 pt-3">
                                    <p className="text-xs text-zinc-500 font-mono">{mod.options?.length || 0} opciones configuradas</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Modal: Formulario Categoría ── */}
            <DialogPrimitive.Root open={catModalOpen} onOpenChange={setCatModalOpen}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                        <div className="mb-5 flex items-center justify-between">
                            <DialogPrimitive.Title className="text-xl font-bold text-white">
                                {editingCat ? "Editar Categoría" : "Nueva Categoría"}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Close className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                                <X size={18} />
                            </DialogPrimitive.Close>
                        </div>

                        <form onSubmit={catForm.handleSubmit(onSaveCat as any)} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-zinc-300">Nombre de la categoría</label>
                                <input
                                    {...catForm.register("name")}
                                    className={`w-full rounded-xl border bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${catForm.formState.errors.name ? "border-red-500/50" : "border-zinc-800"}`}
                                    placeholder="Ej: Combos Burgers"
                                />
                                {catForm.formState.errors.name && <p className="mt-1 text-xs text-red-400">{catForm.formState.errors.name.message}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <DialogPrimitive.Close type="button" className="rounded-lg px-4 py-2 text-sm font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white">
                                    Cancelar
                                </DialogPrimitive.Close>
                                <button type="submit" disabled={saving} className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50 flex items-center gap-2">
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>

            {/* ── Modal: Formulario Producto ── */}
            <DialogPrimitive.Root open={prodModalOpen} onOpenChange={setProdModalOpen}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogPrimitive.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md rounded-l-2xl sm:rounded-none">

                        <div className="mb-6 flex items-center justify-between">
                            <DialogPrimitive.Title className="text-2xl font-extrabold tracking-tight text-white">
                                {editingProd ? "Editar Producto" : "Nuevo Producto"}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Close className="rounded-full bg-zinc-900 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                                <X size={18} />
                            </DialogPrimitive.Close>
                        </div>

                        <form onSubmit={prodForm.handleSubmit(onSaveProd as any)} className="space-y-5">

                            {/* Product Image Upload */}
                            <div className="flex justify-center mb-6">
                                <div className="relative flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 transition-colors hover:border-zinc-700 hover:bg-zinc-900 overflow-hidden">
                                    <input
                                        type="file"
                                        onChange={(e) => { handleFileSelect(e); (e.target as HTMLInputElement).value = ''; }}
                                        accept="image/png, image/jpeg, image/webp"
                                        className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                                        disabled={saving}
                                    />
                                    {prodForm.watch("image_url") ? (
                                        <img src={prodForm.watch("image_url") || undefined} alt="Product" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-zinc-500">
                                            <Upload size={24} className="mb-2 opacity-50" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Subir Foto</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-zinc-300">Categoría</label>
                                    <select
                                        {...prodForm.register("category_id")}
                                        className={`w-full rounded-xl border bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary appearance-none ${prodForm.formState.errors.category_id ? "border-red-500/50" : "border-zinc-800"}`}
                                    >
                                        <option value="" disabled>Elegir categoría...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {prodForm.formState.errors.category_id && <p className="mt-1 text-xs text-red-400">{prodForm.formState.errors.category_id.message}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-zinc-300">Margen de Gan. (%)</label>
                                    <div className="relative">
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">%</span>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={prodForm.watch("profit_margin") as number ?? ''}
                                            onChange={(e) => handleCostOrMarginChange('profit_margin', e.target.value)}
                                            onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                                            className={`w-full rounded-xl border bg-zinc-900 pl-4 pr-10 py-3 text-sm text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${prodForm.formState.errors.profit_margin ? "border-red-500/50" : "border-zinc-800"}`}
                                            placeholder="Ej: 50"
                                        />
                                    </div>
                                    {prodForm.formState.errors.profit_margin && <p className="mt-1 text-xs text-red-400">{prodForm.formState.errors.profit_margin.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-zinc-300">Precio de Costo ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={prodForm.watch("cost_price") as number ?? ''}
                                            onChange={(e) => handleCostOrMarginChange('cost_price', e.target.value)}
                                            onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                                            className={`w-full rounded-xl border bg-zinc-900 pl-8 pr-4 py-3 text-sm text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${prodForm.formState.errors.cost_price ? "border-red-500/50" : "border-zinc-800"}`}
                                            placeholder="Ej: 3000"
                                        />
                                    </div>
                                    {prodForm.formState.errors.cost_price && <p className="mt-1 text-xs text-red-400">{prodForm.formState.errors.cost_price.message}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-zinc-300">Precio Final al Público</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold">$</span>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={prodForm.watch("price") as number ?? ''}
                                            onChange={(e) => handlePriceChange(e.target.value)}
                                            onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                                            className={`w-full rounded-xl border bg-green-950/20 pl-8 pr-4 py-3 text-sm text-green-400 font-bold outline-none transition focus:ring-2 focus:ring-green-500 ${prodForm.formState.errors.price ? "border-red-500/50" : "border-green-500/30"}`}
                                            placeholder="Ej: 5000"
                                        />
                                    </div>
                                    {prodForm.formState.errors.price && <p className="mt-1 text-xs text-red-400">{prodForm.formState.errors.price.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-zinc-300">Nombre del producto</label>
                                <input
                                    {...prodForm.register("name")}
                                    className={`w-full rounded-xl border bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${prodForm.formState.errors.name ? "border-red-500/50" : "border-zinc-800"}`}
                                    placeholder="Ej: Classic Burger"
                                />
                                {prodForm.formState.errors.name && <p className="mt-1 text-xs text-red-400">{prodForm.formState.errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-zinc-300">Descripción</label>
                                <textarea
                                    {...prodForm.register("description")}
                                    rows={3}
                                    className={`w-full rounded-xl border bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition resize-none focus:ring-2 focus:ring-primary ${prodForm.formState.errors.description ? "border-red-500/50" : "border-zinc-800"}`}
                                    placeholder="Ej: Medallón smash 100gr, cheddar, pan de papa..."
                                />
                            </div>

                            {/* Modificadores Section */}
                            <div className="pt-2">
                                <label className="mb-3 block text-sm font-semibold text-zinc-300">Modificadores Aplicables</label>
                                <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                                    {modifiers.length > 0 ? (
                                        modifiers.map((mod) => (
                                            <label key={mod.id} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    value={mod.id}
                                                    {...prodForm.register("modifier_ids")}
                                                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-primary accent-primary"
                                                />
                                                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                                                    {mod.name}
                                                    <span className="ml-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                                        {mod.options?.length} opciones
                                                    </span>
                                                </span>
                                            </label>
                                        ))
                                    ) : (
                                        <p className="text-xs text-zinc-500 italic">No hay modificadores creados aún.</p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-zinc-800 pb-20 pt-6">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full rounded-xl bg-primary py-4 text-sm font-extrabold tracking-widest text-primary-foreground shadow-[0_0_20px_var(--brand-color)] shadow-primary/30 transition hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 size={18} className="animate-spin" />}
                                    GUARDAR PRODUCTO
                                </button>
                            </div>

                        </form>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>

            {/* ── Modal: Formulario Modificadores ── */}
            <DialogPrimitive.Root open={modModalOpen} onOpenChange={setModModalOpen}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogPrimitive.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-xl rounded-l-2xl sm:rounded-none">

                        <div className="mb-6 flex items-center justify-between">
                            <DialogPrimitive.Title className="text-2xl font-extrabold tracking-tight text-white">
                                {editingMod ? "Editar Grupo Modificador" : "Nuevo Grupo Modificador"}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Close className="rounded-full bg-zinc-900 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                                <X size={18} />
                            </DialogPrimitive.Close>
                        </div>

                        <form onSubmit={modForm.handleSubmit(onSaveMod as any)} className="space-y-6">

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-zinc-300">Nombre del Grupo</label>
                                <input
                                    {...modForm.register("name")}
                                    className={`w-full rounded-xl border bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary ${modForm.formState.errors.name ? "border-red-500/50" : "border-zinc-800"}`}
                                    placeholder="Ej: Punto de Carne, Salsas Extra..."
                                />
                                {modForm.formState.errors.name && <p className="mt-1 text-xs text-red-400">{modForm.formState.errors.name.message}</p>}
                            </div>

                            <div className="flex gap-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                                <label className="flex flex-1 items-start gap-3 cursor-pointer">
                                    <div className="flex h-5 items-center mt-0.5">
                                        <input type="checkbox" {...modForm.register("is_required")} className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-primary accent-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">Es Obligatorio</p>
                                        <p className="text-xs text-zinc-500">¿El cliente DEBE elegir algo de aquí obligatoriamente?</p>
                                    </div>
                                </label>
                                <label className="flex flex-1 items-start gap-3 cursor-pointer">
                                    <div className="flex h-5 items-center mt-0.5">
                                        <input type="checkbox" {...modForm.register("is_multiple")} className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-primary accent-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">Opción Múltiple</p>
                                        <p className="text-xs text-zinc-500">Pueden elegir más de una opción (Checkbox vs Radio).</p>
                                    </div>
                                </label>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-zinc-300">Opciones</label>
                                    <button
                                        type="button"
                                        onClick={() => optionAppend({ name: "", additional_price: 0 })}
                                        className="text-xs font-bold text-primary hover:text-white"
                                    >
                                        + Agregar Opción
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {optionFields.map((field: any, index: number) => (
                                        <div key={field.id} className="flex gap-2 items-start">
                                            <div className="flex-1">
                                                <input
                                                    {...modForm.register(`options.${index}.name`)}
                                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary"
                                                    placeholder="Nombre (Ej: Doble Medallón)"
                                                />
                                            </div>
                                            <div className="w-1/3">
                                                <input
                                                    {...modForm.register(`options.${index}.additional_price`)}
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 outline-none transition focus:ring-2 focus:ring-primary font-mono"
                                                    placeholder="+$ 0.00"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="p-2.5 rounded-lg text-zinc-500 hover:bg-red-500/20 hover:text-red-400 mt-px"
                                                onClick={() => optionRemove(index)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {modForm.formState.errors.options?.root && (
                                        <p className="text-xs text-red-500 mt-2">{modForm.formState.errors.options.root.message}</p>
                                    )}
                                    {optionFields.length === 0 && (
                                        <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-sm text-zinc-500">
                                            No hay opciones. Hacé clic en "Agregar Opción" para comenzar.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-zinc-800 pb-20 pt-6">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full rounded-xl bg-primary py-4 text-sm font-extrabold tracking-widest text-primary-foreground shadow-[0_0_20px_var(--brand-color)] shadow-primary/30 transition hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 size={18} className="animate-spin" />}
                                    GUARDAR MODIFICADOR
                                </button>
                            </div>

                        </form>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>

        </div >
    );
}
