"use client";

import React, { useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Camera, Loader2, Save, Trash2, Plus, CheckCircle2, FileSearch,
  AlertCircle, X, Settings2, ChevronDown, ArrowRight, Info, Link2
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */

interface OpcionMod {
  nombre: string;
  precio_extra: number;
}

interface ModificadorGlobal {
  id: string; // local uuid for referencing
  nombre: string;
  opciones: OpcionMod[];
}

interface Producto {
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaIdx: number;
  modIds: string[]; // references to ModificadorGlobal.id
}

interface Categoria {
  nombre: string;
}

interface EditableMenu {
  categorias: Categoria[];
  productos: Producto[];
  modificadores: ModificadorGlobal[];
}

interface MenuScannerProps {
  tenantId: string;
  onComplete?: () => void;
}

let _localId = 0;
const localId = () => `local_${++_localId}_${Date.now()}`;

/* ── Component ─────────────────────────────────────────────── */

const MenuScanner: React.FC<MenuScannerProps> = ({ tenantId, onComplete }) => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<EditableMenu | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  /* ── File handling ─────────────────────────────────────── */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const clearAll = () => {
    setImage(null);
    setPreview(null);
    setMenu(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Scan ──────────────────────────────────────────────── */

  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    setMenu(null);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const res = await fetch("/api/scan-menu", { method: "POST", body: formData });
      const raw = await res.json();
      if (!res.ok) throw new Error(raw.error || "No pudimos leer la imagen.");
      if (!raw.categorias || !Array.isArray(raw.categorias)) throw new Error("Formato inválido.");

      // Transform AI response → editable format with global modifiers
      const categorias: Categoria[] = [];
      const productos: Producto[] = [];
      const modMap = new Map<string, ModificadorGlobal>(); // dedup by name

      for (const cat of raw.categorias) {
        const catIdx = categorias.length;
        categorias.push({ nombre: cat.nombre || "Sin categoría" });

        for (const prod of cat.productos || []) {
          const modIds: string[] = [];

          for (const mod of prod.modificadores || []) {
            if (!mod.opciones || mod.opciones.length === 0) continue;
            const key = mod.nombre?.toLowerCase().trim() || "";

            if (modMap.has(key)) {
              // Reuse existing modifier
              modIds.push(modMap.get(key)!.id);
            } else {
              const gm: ModificadorGlobal = {
                id: localId(),
                nombre: mod.nombre || "Modificador",
                opciones: mod.opciones.map((o: any) => ({
                  nombre: o.nombre || "",
                  precio_extra: o.precio_extra ?? 0,
                })),
              };
              modMap.set(key, gm);
              modIds.push(gm.id);
            }
          }

          productos.push({
            nombre: prod.nombre || "Sin nombre",
            descripcion: prod.descripcion || "",
            precio: prod.precio ?? 0,
            categoriaIdx: catIdx,
            modIds,
          });
        }
      }

      setMenu({
        categorias,
        productos,
        modificadores: Array.from(modMap.values()),
      });
      toast.success("Menú analizado con éxito!");
    } catch (err: any) {
      toast.error(err.message || "Error al escanear.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Mutation helper ───────────────────────────────────── */

  const update = (fn: (m: EditableMenu) => void) => {
    if (!menu) return;
    const copy = JSON.parse(JSON.stringify(menu)) as EditableMenu;
    fn(copy);
    setMenu(copy);
  };

  /* ── Products grouped by category ──────────────────────── */

  const productsByCategory = useMemo(() => {
    if (!menu) return [];
    return menu.categorias.map((_, catIdx) => ({
      catIdx,
      products: menu.productos
        .map((p, i) => ({ ...p, _idx: i }))
        .filter((p) => p.categoriaIdx === catIdx),
    }));
  }, [menu]);

  /* ── Save to Supabase ──────────────────────────────────── */

  const handleSave = async () => {
    if (!menu || !tenantId) return;
    setSaving(true);

    try {
      // 1. Create categories
      const catIdMap = new Map<number, string>(); // localIdx → supabase id
      for (let i = 0; i < menu.categorias.length; i++) {
        const cat = menu.categorias[i];
        const prods = menu.productos.filter((p) => p.categoriaIdx === i);
        if (prods.length === 0) continue; // skip empty categories

        const { data, error } = await supabase
          .from("categories")
          .insert({ tenant_id: tenantId, name: cat.nombre, sort_order: i })
          .select()
          .single();
        if (error) throw error;
        catIdMap.set(i, data.id);
      }

      // 2. Create global modifiers
      const modIdMap = new Map<string, string>(); // localId → supabase id
      for (const mod of menu.modificadores) {
        // Only create if at least one product uses it
        const isUsed = menu.productos.some((p) => p.modIds.includes(mod.id));
        if (!isUsed) continue;

        const { data: modData, error: modError } = await supabase
          .from("modifiers")
          .insert({ tenant_id: tenantId, name: mod.nombre, is_multiple: false, is_required: false })
          .select()
          .single();
        if (modError) throw modError;

        const opts = mod.opciones
          .filter((o) => o.nombre.trim())
          .map((o) => ({
            modifier_id: modData.id,
            name: o.nombre,
            additional_price: o.precio_extra ?? 0,
            is_default: false,
            is_available: true,
          }));

        if (opts.length > 0) {
          const { error: optsErr } = await supabase.from("modifier_options").insert(opts);
          if (optsErr) throw optsErr;
        }

        modIdMap.set(mod.id, modData.id);
      }

      // 3. Create products + link modifiers
      for (const prod of menu.productos) {
        const catSupaId = catIdMap.get(prod.categoriaIdx);
        if (!catSupaId) continue;

        const { data: prodData, error: prodErr } = await supabase
          .from("products")
          .insert({
            tenant_id: tenantId,
            category_id: catSupaId,
            name: prod.nombre || "Sin nombre",
            description: prod.descripcion || "",
            price: prod.precio ?? 0,
            is_available: true,
            sort_order: 0,
          })
          .select()
          .single();
        if (prodErr) throw prodErr;

        // Link modifiers
        for (let si = 0; si < prod.modIds.length; si++) {
          const supaModId = modIdMap.get(prod.modIds[si]);
          if (!supaModId) continue;
          await supabase
            .from("product_modifiers")
            .insert({ product_id: prodData.id, modifier_id: supaModId, sort_order: si });
        }
      }

      toast.success("Menú guardado correctamente!");
      if (onComplete) onComplete();
      clearAll();
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-[#0F1210] p-4">
      {/* ═══ UPLOAD ═══ */}
      {!menu && !loading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[rgba(15,18,16,.15)] bg-[#FBF8F1] hover:bg-[#E9E7E2]/80 hover:border-[#43926A] transition-all rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer group"
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

          {preview ? (
            <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden mb-6 shadow-2xl ring-1 ring-[rgba(15,18,16,.1)]">
              <img src={preview} alt="Menu preview" className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); clearAll(); }}
                className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full hover:bg-red-500/80 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="bg-[#E9E7E2] p-6 rounded-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl ring-1 ring-[rgba(15,18,16,.08)]">
              <Camera size={48} className="text-[#575757] group-hover:text-[#0F1210]" />
            </div>
          )}

          <h3 className="text-2xl font-bold mb-2">{preview ? "Escanear esta imagen" : "Escáner Mágico de Menús"}</h3>
          <p className="text-[#575757] text-center max-w-sm mb-8 leading-relaxed">
            Subí una foto de tu menú físico. La IA extraerá productos, categorías y modificadores.
          </p>

          {preview && (
            <button
              onClick={(e) => { e.stopPropagation(); handleScan(); }}
              className="px-8 py-4 bg-[#43926A] text-white font-['Archivo_Black',sans-serif] uppercase tracking-[.04em] rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-lg shadow-[rgba(67,146,106,.15)]"
            >
              <FileSearch size={22} />
              Escanear Menú con IA
            </button>
          )}
        </div>
      )}

      {/* ═══ LOADING ═══ */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center space-y-6 bg-white rounded-3xl border border-[rgba(15,18,16,.08)] backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-[#43926A]/20 blur-2xl rounded-full" />
            <Loader2 size={64} className="animate-spin text-[#0F1210] relative z-10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-medium text-[#0F1210]/90">La IA está leyendo tu menú...</h3>
            <p className="text-[#575757] animate-pulse">Analizando productos, categorías y precios...</p>
          </div>
        </div>
      )}

      {/* ═══ EDITING PHASE ═══ */}
      {menu && !loading && (
        <div className="space-y-6 pb-12">
          {/* ── Guide banner ── */}
          {showGuide && (
            <div className="bg-white border border-[rgba(15,18,16,.15)]/50 rounded-2xl p-5 relative">
              <button onClick={() => setShowGuide(false)} className="absolute top-3 right-3 text-[#575757]/70 hover:text-[#0F1210]"><X size={16} /></button>
              <div className="flex items-start gap-3 mb-3">
                <Info size={20} className="text-blue-400 mt-0.5 shrink-0" />
                <h3 className="font-bold text-sm text-[#0F1210]">Cómo organizar tu menú</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#575757] leading-relaxed">
                <div className="bg-[#E9E7E2]/50 rounded-xl p-3 border border-[rgba(15,18,16,.15)]/30">
                  <span className="text-[#0F1210] font-semibold block mb-1">Categorías</span>
                  Agrupan tus productos. Ej: &quot;Hamburguesas&quot;, &quot;Pizzas&quot;, &quot;Bebidas&quot;. Podés mover productos entre categorías con el selector.
                </div>
                <div className="bg-[#E9E7E2]/50 rounded-xl p-3 border border-[rgba(15,18,16,.15)]/30">
                  <span className="text-[#0F1210] font-semibold block mb-1">Productos</span>
                  Cada plato o item que el cliente puede pedir. Tiene nombre, descripción y precio base.
                </div>
                <div className="bg-[#E9E7E2]/50 rounded-xl p-3 border border-[rgba(15,18,16,.15)]/30">
                  <span className="text-[#0F1210] font-semibold block mb-1">Modificadores</span>
                  Variantes de un producto: tamaño (Simple/Doble), extras (con queso, sin cebolla). Se crean una vez y se asignan a varios productos.
                </div>
              </div>
            </div>
          )}

          {/* ── Sticky toolbar ── */}
          <div className="flex items-center justify-between sticky top-4 z-30 bg-white/90 backdrop-blur-xl shadow-sm p-4 rounded-3xl border border-[rgba(15,18,16,.12)] shadow-2xl">
            <div className="flex items-center gap-3 px-2">
              <div className="bg-green-500/10 p-2 rounded-xl border border-green-500/20">
                <CheckCircle2 size={24} className="text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Revisá tu menú</h2>
                <p className="text-xs text-[#575757]">Editá, mové productos y asigná modificadores antes de guardar</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={clearAll} className="px-5 py-2.5 text-[#575757] hover:text-[#0F1210] hover:bg-[#E9E7E2] rounded-xl transition-all font-medium text-sm">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#43926A] text-white font-['Archivo_Black',sans-serif] uppercase tracking-[.04em] rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Confirmar y Subir
              </button>
            </div>
          </div>

          {/* ── Global Modifiers Panel ── */}
          <div className="bg-white rounded-3xl border border-[rgba(15,18,16,.08)] overflow-hidden shadow-lg">
            <div className="p-4 bg-[#E9E7E2]/30 border-b border-[rgba(15,18,16,.08)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-[#575757]" />
                <h3 className="font-bold text-sm text-[#0F1210]">Modificadores</h3>
                <span className="text-[10px] text-[#575757]/70 bg-[#E9E7E2] px-2 py-0.5 rounded-full">
                  Se comparten entre productos
                </span>
              </div>
              <button
                onClick={() =>
                  update((m) => {
                    m.modificadores.push({ id: localId(), nombre: "Nuevo modificador", opciones: [{ nombre: "Opción 1", precio_extra: 0 }] });
                  })
                }
                className="flex items-center gap-1.5 text-xs text-[#575757] hover:text-[#0F1210] bg-[#E9E7E2] hover:bg-[#E9E7E2] px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus size={12} />
                Crear Modificador
              </button>
            </div>

            {menu.modificadores.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-[#575757] text-sm">No hay modificadores todavía</p>
                <p className="text-[#575757]/70 text-xs">
                  Ej: &quot;Tamaño&quot; con opciones Simple (+$0), Doble (+$500), Triple (+$1000)
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(15,18,16,.08)]">
                {menu.modificadores.map((mod, modIdx) => {
                  const usedBy = menu.productos.filter((p) => p.modIds.includes(mod.id));

                  return (
                    <div key={mod.id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="text"
                          value={mod.nombre}
                          onChange={(e) => update((m) => { m.modificadores[modIdx].nombre = e.target.value; })}
                          className="bg-transparent border-none focus:ring-0 text-[#0F1210] text-sm font-semibold p-0 flex-1"
                          placeholder="Nombre del modificador..."
                        />
                        <span className="text-[10px] text-[#575757]/70 shrink-0">
                          <Link2 size={10} className="inline mr-1" />
                          {usedBy.length} {usedBy.length === 1 ? "producto" : "productos"}
                        </span>
                        <button
                          onClick={() => update((m) => {
                            const id = m.modificadores[modIdx].id;
                            m.modificadores.splice(modIdx, 1);
                            m.productos.forEach((p) => { p.modIds = p.modIds.filter((mid) => mid !== id); });
                          })}
                          className="p-1 text-[#575757]/70 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Options */}
                      <div className="flex flex-wrap gap-2 ml-1">
                        {mod.opciones.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-1.5 bg-[#E9E7E2]/60 border border-[rgba(15,18,16,.15)]/30 rounded-lg px-2.5 py-1.5">
                            <input
                              type="text"
                              value={opt.nombre}
                              onChange={(e) => update((m) => { m.modificadores[modIdx].opciones[optIdx].nombre = e.target.value; })}
                              className="bg-transparent border-none focus:ring-0 text-[#0F1210] text-xs p-0 w-20"
                              placeholder="Opción..."
                            />
                            <span className="text-[#575757]/70 text-xs">+$</span>
                            <input
                              type="number"
                              value={opt.precio_extra}
                              onChange={(e) => update((m) => { m.modificadores[modIdx].opciones[optIdx].precio_extra = Number(e.target.value) || 0; })}
                              className="bg-transparent border-none focus:ring-0 text-[#0F1210] text-xs p-0 w-12 font-mono"
                            />
                            <button
                              onClick={() => update((m) => { m.modificadores[modIdx].opciones.splice(optIdx, 1); })}
                              className="text-[#575757]/50 hover:text-red-500"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => update((m) => { m.modificadores[modIdx].opciones.push({ nombre: "", precio_extra: 0 }); })}
                          className="flex items-center gap-1 text-[#575757]/70 hover:text-[#0F1210] text-xs px-2.5 py-1.5 rounded-lg border border-dashed border-[rgba(15,18,16,.15)] hover:border-[#43926A] transition-all"
                        >
                          <Plus size={10} />
                          Opción
                        </button>
                      </div>

                      {/* Quick assign to all */}
                      {usedBy.length < menu.productos.length && (
                        <button
                          onClick={() => update((m) => {
                            m.productos.forEach((p) => { if (!p.modIds.includes(mod.id)) p.modIds.push(mod.id); });
                          })}
                          className="mt-2 ml-1 text-[10px] text-[#575757]/70 hover:text-[#575757] flex items-center gap-1 transition-all"
                        >
                          <ArrowRight size={10} />
                          Asignar a todos los productos
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Categories + Products ── */}
          <div className="space-y-6">
            {productsByCategory.map(({ catIdx, products }) => (
              <div key={catIdx} className="bg-white rounded-3xl border border-[rgba(15,18,16,.08)] overflow-hidden shadow-lg">
                {/* Category header */}
                <div className="p-4 bg-[#E9E7E2]/30 flex items-center justify-between border-b border-[rgba(15,18,16,.08)]">
                  <input
                    type="text"
                    value={menu.categorias[catIdx].nombre}
                    onChange={(e) => update((m) => { m.categorias[catIdx].nombre = e.target.value; })}
                    className="bg-transparent border-none focus:ring-0 text-lg font-bold text-[#0F1210] flex-1 placeholder-[#575757]/50 p-0"
                    placeholder="Nombre de categoría..."
                  />
                  <span className="text-xs text-[#575757]/70 mx-3 shrink-0">{products.length} productos</span>
                  <button
                    onClick={() => update((m) => {
                      m.productos = m.productos.filter((p) => p.categoriaIdx !== catIdx);
                      m.categorias.splice(catIdx, 1);
                      m.productos.forEach((p) => { if (p.categoriaIdx > catIdx) p.categoriaIdx--; });
                    })}
                    className="p-2 text-[#575757] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Products */}
                <div className="divide-y divide-[rgba(15,18,16,.08)]">
                  {products.map((prod) => {
                    const pIdx = prod._idx;
                    const assignedMods = menu.modificadores.filter((m) => prod.modIds.includes(m.id));
                    const unassignedMods = menu.modificadores.filter((m) => !prod.modIds.includes(m.id));

                    return (
                      <div key={pIdx} className="p-4 hover:bg-[rgba(15,18,16,.02)] transition-colors group/row">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <input
                              type="text"
                              value={prod.nombre}
                              onChange={(e) => update((m) => { m.productos[pIdx].nombre = e.target.value; })}
                              className="bg-transparent border-none focus:ring-0 text-[#0F1210] font-medium w-full p-0 text-sm"
                              placeholder="Nombre del producto..."
                            />
                            <input
                              type="text"
                              value={prod.descripcion}
                              onChange={(e) => update((m) => { m.productos[pIdx].descripcion = e.target.value; })}
                              className="bg-transparent border-none focus:ring-0 text-[#575757] text-xs w-full p-0"
                              placeholder="Descripción (opcional)..."
                            />
                          </div>

                          <div className="w-24 shrink-0">
                            <div className="flex items-center bg-[#E9E7E2]/50 rounded-lg px-2 py-1.5">
                              <span className="text-[#575757] text-xs mr-1">$</span>
                              <input
                                type="number"
                                value={prod.precio}
                                onChange={(e) => update((m) => { m.productos[pIdx].precio = Number(e.target.value) || 0; })}
                                className="bg-transparent border-none focus:ring-0 text-[#0F1210] font-mono text-sm w-full p-0 outline-none"
                              />
                            </div>
                          </div>

                          <div className="w-36 shrink-0 relative">
                            <select
                              value={prod.categoriaIdx}
                              onChange={(e) => update((m) => { m.productos[pIdx].categoriaIdx = Number(e.target.value); })}
                              className="w-full bg-[#E9E7E2]/50 border border-[rgba(15,18,16,.15)]/50 rounded-lg px-2 py-1.5 text-xs text-[#0F1210] appearance-none cursor-pointer focus:ring-1 focus:ring-white/20 outline-none pr-6"
                            >
                              {menu.categorias.map((c, i) => (
                                <option key={i} value={i}>{c.nombre}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#575757] pointer-events-none" />
                          </div>

                          <button
                            onClick={() => update((m) => { m.productos.splice(pIdx, 1); })}
                            className="p-1.5 text-[#575757]/70 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-all shrink-0"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="mt-2 ml-1 flex flex-wrap items-center gap-1.5">
                          {assignedMods.map((mod) => (
                            <span key={mod.id} className="inline-flex items-center gap-1.5 bg-[#E9E7E2]/60 border border-[rgba(15,18,16,.15)]/40 rounded-lg px-2.5 py-1 text-xs text-[#0F1210]">
                              <Settings2 size={10} className="text-[#575757]" />
                              {mod.nombre}
                              <span className="text-[#575757]/70">({mod.opciones.length})</span>
                              <button
                                onClick={() => update((m) => { m.productos[pIdx].modIds = m.productos[pIdx].modIds.filter((id) => id !== mod.id); })}
                                className="text-[#575757]/70 hover:text-red-400 ml-0.5"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}

                          {unassignedMods.length > 0 && (
                            <div className="relative inline-block">
                              <select
                                value=""
                                onChange={(e) => {
                                  if (!e.target.value) return;
                                  update((m) => { m.productos[pIdx].modIds.push(e.target.value); });
                                }}
                                className="bg-transparent border border-dashed border-[rgba(15,18,16,.15)] rounded-lg px-2 py-1 text-xs text-[#575757] appearance-none cursor-pointer hover:border-[#43926A] hover:text-[#0F1210] transition-all pr-5 outline-none focus:ring-0"
                              >
                                <option value="">+ Modificador</option>
                                {unassignedMods.map((m) => (
                                  <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                              </select>
                              <Plus size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#575757]/70 pointer-events-none" />
                            </div>
                          )}

                          {menu.modificadores.length === 0 && prod.modIds.length === 0 && (
                            <span className="text-[10px] text-[#575757]/70 italic">Sin modificadores — crealos arriba</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {products.length === 0 && (
                    <div className="p-6 text-center text-[#575757]/70 text-sm">Categoría vacía — agregá productos o eliminala</div>
                  )}
                </div>

                <div className="p-3 border-t border-[rgba(15,18,16,.08)]">
                  <button
                    onClick={() => update((m) => { m.productos.push({ nombre: "", descripcion: "", precio: 0, categoriaIdx: catIdx, modIds: [] }); })}
                    className="w-full py-2 hover:bg-[rgba(15,18,16,.03)] rounded-xl text-[#575757] hover:text-[#0F1210] text-sm flex items-center justify-center gap-2 transition-all border border-dashed border-[rgba(15,18,16,.08)]"
                  >
                    <Plus size={14} />
                    Agregar Producto
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => update((m) => { m.categorias.push({ nombre: "Nueva Categoría" }); })}
              className="w-full py-4 bg-white border-2 border-dashed border-[rgba(15,18,16,.08)] rounded-2xl text-[#575757] hover:text-[#0F1210] hover:border-[rgba(15,18,16,.12)] transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={18} />
              Agregar Categoría
            </button>
          </div>
        </div>
      )}

      {/* ═══ ERROR HINT ═══ */}
      {!loading && !menu && preview && (
        <div className="flex items-center gap-3 p-4 bg-[#FBF8F1] border border-[rgba(15,18,16,.12)] rounded-2xl text-[#575757] text-sm">
          <AlertCircle size={18} />
          <p>Asegurate de que el menú sea legible y esté bien iluminado para mejores resultados.</p>
        </div>
      )}
    </div>
  );
};

export default MenuScanner;
