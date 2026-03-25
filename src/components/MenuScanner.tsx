"use client";

import React, { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { 
  Camera, 
  Loader2, 
  Save, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  FileSearch,
  AlertCircle,
  X
} from "lucide-react";

interface Producto {
  nombre: string;
  descripcion: string;
  precio: number;
}

interface Categoria {
  nombre: string;
  productos: Producto[];
}

interface MenuData {
  categorias: Categoria[];
}

interface MenuScannerProps {
  tenantId: string;
  onComplete?: () => void;
}

const MenuScanner: React.FC<MenuScannerProps> = ({ tenantId, onComplete }) => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      // Automáticamente disparar el escaneo al seleccionar? O esperar botón?
      // El usuario pidió un botón "Escanear Menú con IA".
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    setMenuData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleScan = async () => {
    if (!image) return;

    setLoading(true);
    setMenuData(null);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch("/api/scan-menu", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No pudimos leer la imagen con claridad.");
      }

      // Asegurar que los datos tengan la estructura correcta
      if (!result.categorias || !Array.isArray(result.categorias)) {
        throw new Error("Formato de respuesta inválido.");
      }

      setMenuData(result);
      toast.success("Menú analizado con éxito!");
    } catch (error: any) {
      toast.error(error.message || "Error al escanear el menú.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = (catIndex: number, newName: string) => {
    if (!menuData) return;
    const newData = { ...menuData };
    newData.categorias[catIndex].nombre = newName;
    setMenuData(newData);
  };

  const handleUpdateProduct = (catIndex: number, prodIndex: number, field: keyof Producto, value: string | number) => {
    if (!menuData) return;
    const newData = { ...menuData };
    const prod = newData.categorias[catIndex].productos[prodIndex];
    
    if (field === 'precio') {
        prod.precio = Number(value) || 0;
    } else {
        (prod as any)[field] = value;
    }
    
    setMenuData(newData);
  };

  const removeProduct = (catIndex: number, prodIndex: number) => {
    if (!menuData) return;
    const newData = { ...menuData };
    newData.categorias[catIndex].productos.splice(prodIndex, 1);
    setMenuData(newData);
  };

  const removeCategory = (catIndex: number) => {
    if (!menuData) return;
    const newData = { ...menuData };
    newData.categorias.splice(catIndex, 1);
    setMenuData(newData);
  };

  const handleSaveToSupabase = async () => {
    if (!menuData || !tenantId) return;

    setSaving(true);
    try {
      for (const cat of menuData.categorias) {
        // 1. Insert/Get Category
        const { data: catData, error: catError } = await supabase
          .from("categories")
          .insert({
            tenant_id: tenantId,
            name: cat.nombre,
            sort_order: 0,
          })
          .select()
          .single();

        if (catError) throw catError;

        // 2. Insert Products for this category
        const productsToInsert = cat.productos.map((prod) => ({
          tenant_id: tenantId,
          category_id: catData.id,
          name: prod.nombre,
          description: prod.descripcion,
          price: prod.precio,
          is_available: true,
          sort_order: 0,
        }));

        if (productsToInsert.length > 0) {
          const { error: prodError } = await supabase
            .from("products")
            .insert(productsToInsert);

          if (prodError) throw prodError;
        }
      }

      toast.success("Menú guardado correctamente!");
      if (onComplete) onComplete();
      setMenuData(null);
      clearImage();
    } catch (error: any) {
      toast.error("Error al guardar en la base de datos: " + error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-white p-4">
      {/* HEADER / UPLOAD SECTION */}
      {!menuData && !loading && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-500 transition-all rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer group"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*" 
          />
          
          {preview ? (
            <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden mb-6 shadow-2xl ring-1 ring-white/10">
              <img src={preview} alt="Menu preview" className="w-full h-full object-cover" />
              <button 
                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full hover:bg-red-500/80 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="bg-zinc-800 p-6 rounded-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl ring-1 ring-white/5">
              <Camera size={48} className="text-zinc-400 group-hover:text-white" />
            </div>
          )}

          <h3 className="text-2xl font-bold mb-2">
            {preview ? "Escanear esta imagen" : "Escáner Mágico de Menús"}
          </h3>
          <p className="text-zinc-500 text-center max-w-sm mb-8 leading-relaxed">
            Sube una foto de tu menú físico. Nuestra IA extraerá automáticamente categorías, nombres y precios.
          </p>

          {preview && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleScan(); }}
              className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-lg shadow-white/5"
            >
              <FileSearch size={22} />
              Comenzar Magia con Gemini
            </button>
          )}
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center space-y-6 bg-zinc-900/40 rounded-3xl border border-white/5 backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full"></div>
            <Loader2 size={64} className="animate-spin text-white relative z-10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-medium text-white/90">La IA está leyendo tu menú...</h3>
            <p className="text-zinc-500 animate-pulse">Analizando productos, descripciones y precios...</p>
          </div>
        </div>
      )}

      {/* EDITABLE DRAFT SECTION */}
      {menuData && !loading && (
        <div className="transition-all duration-700 ease-out space-y-8 pb-12">
          <div className="flex items-center justify-between sticky top-4 z-30 bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">

            <div className="flex items-center gap-3 px-2">
              <div className="bg-green-500/10 p-2 rounded-xl border border-green-500/20">
                <CheckCircle2 size={24} className="text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Validación Humana</h2>
                <p className="text-xs text-zinc-500">Revisa y edita los datos antes de guardar</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={clearImage}
                className="px-5 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all font-medium text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveToSupabase}
                disabled={saving}
                className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Confirmar y Subir al Menú
              </button>
            </div>
          </div>

          <div className="grid gap-8">
            {menuData.categorias.map((cat, catIdx) => (
              <div key={catIdx} className="bg-zinc-900/40 rounded-3xl border border-white/5 overflow-hidden group/cat shadow-lg">
                <div className="p-4 bg-zinc-800/30 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-3 flex-1 px-2">
                    <input 
                      type="text" 
                      value={cat.nombre}
                      onChange={(e) => handleUpdateCategory(catIdx, e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-xl font-bold text-white w-full placeholder-zinc-700 p-0"
                      placeholder="Nombre de categoría..."
                    />
                  </div>
                  <button 
                    onClick={() => removeCategory(catIdx)}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="p-2 overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descripción</th>
                        <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-32">Precio ($)</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {cat.productos.map((prod, prodIdx) => (
                        <tr key={prodIdx} className="group/row hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              value={prod.nombre}
                              onChange={(e) => handleUpdateProduct(catIdx, prodIdx, 'nombre', e.target.value)}
                              className="bg-transparent border-none focus:ring-0 text-white font-medium w-full p-0"
                              placeholder="Nombre..."
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              value={prod.descripcion}
                              onChange={(e) => handleUpdateProduct(catIdx, prodIdx, 'descripcion', e.target.value)}
                              className="bg-transparent border-none focus:ring-0 text-zinc-400 text-sm w-full p-0"
                              placeholder="Sin descripción..."
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              value={prod.precio}
                              onChange={(e) => handleUpdateProduct(catIdx, prodIdx, 'precio', e.target.value)}
                              className="bg-zinc-800/50 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-white/20 border-none text-white font-mono text-sm w-full outline-none"
                            />
                          </td>
                          <td className="px-2">
                            <button 
                              onClick={() => removeProduct(catIdx, prodIdx)}
                              className="p-1.5 text-zinc-600 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-all"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 border-t border-white/5">
                    <button 
                        onClick={() => {
                            const newData = { ...menuData };
                            newData.categorias[catIdx].productos.push({ nombre: "", descripcion: "", precio: 0 });
                            setMenuData(newData);
                        }}
                        className="w-full py-2 hover:bg-white/[0.03] rounded-xl text-zinc-500 hover:text-white text-sm flex items-center justify-center gap-2 transition-all border border-dashed border-white/5"
                    >
                        <Plus size={14} />
                        Agregar Producto
                    </button>
                </div>
              </div>
            ))}
            
            <button 
                onClick={() => {
                    if (menuData) {
                        setMenuData({
                            ...menuData,
                            categorias: [...menuData.categorias, { nombre: "Nueva Categoría", productos: [] }]
                        });
                    }
                }}
                className="w-full py-6 bg-zinc-900/40 border-2 border-dashed border-white/5 rounded-3xl text-zinc-500 hover:text-white hover:border-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-sm group"
            >
                <Plus size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-lg font-medium">Agregar Nueva Categoría</span>
            </button>
          </div>
        </div>
      )}

      {/* ERROR FEEDBACK (Fallback design) */}
      {!loading && !menuData && preview && (
         <div className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
            <AlertCircle size={18} />
            <p>Asegúrate de que el menú sea legible y esté bien iluminado para mejores resultados.</p>
         </div>
      )}
    </div>
  );
};

export default MenuScanner;
