"use client"

import { useState } from "react"
import { Palette, Sun, Moon, ShoppingBag, Star } from "lucide-react"

const COLORS = [
  { name: "Verde", hex: "#22c55e" },
  { name: "Naranja", hex: "#f97316" },
  { name: "Rojo", hex: "#ef4444" },
  { name: "Azul", hex: "#3b82f6" },
  { name: "Violeta", hex: "#a855f7" },
]

const MOCK_PRODUCTS = [
  { name: "Hamburguesa Clasica", desc: "Carne, lechuga, tomate, cheddar", price: 6500, rating: 4.8 },
  { name: "Pizza Muzzarella", desc: "Muzzarella, salsa, oregano", price: 7800, rating: 4.9 },
  { name: "Papas con Cheddar", desc: "Papas fritas, cheddar, panceta", price: 4200, rating: 4.7 },
]

export function DemoBranding() {
  const [accent, setAccent] = useState("#22c55e")
  const [isDark, setIsDark] = useState(true)

  const bg = isDark ? "bg-zinc-950" : "bg-white"
  const surface = isDark ? "bg-zinc-900" : "bg-zinc-100"
  const text = isDark ? "text-white" : "text-zinc-900"
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500"
  const border = isDark ? "border-zinc-800" : "border-zinc-200"
  const cardBg = isDark ? "bg-zinc-900/60" : "bg-white"

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium mb-4">
            <Palette className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary">Brand Studio</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Tu propia tienda,
            <br />
            <span className="text-gradient">100% con tu identidad.</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto">
            Personaliza colores, modo oscuro y mas. Los cambios se reflejan al instante.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
          {/* Left — Controls */}
          <div className="space-y-6">
            {/* Color picker */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Color de Acento</h3>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setAccent(c.hex)}
                    className={`w-10 h-10 rounded-xl transition-all ${
                      accent === c.hex ? "ring-2 ring-offset-2 ring-offset-zinc-950 scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex, outlineColor: accent === c.hex ? c.hex : undefined }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Dark/Light mode */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Modo de Tema</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsDark(true)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    isDark ? "bg-zinc-700 text-white ring-2 ring-zinc-500" : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800"
                  }`}
                >
                  <Moon size={16} /> Oscuro
                </button>
                <button
                  onClick={() => setIsDark(false)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    !isDark ? "bg-zinc-200 text-zinc-900 ring-2 ring-zinc-400" : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800"
                  }`}
                >
                  <Sun size={16} /> Claro
                </button>
              </div>
            </div>

            {/* Info */}
            <p className="text-xs text-zinc-600 text-center">
              Proba los controles y mira como cambia la tienda en tiempo real.
            </p>
          </div>

          {/* Right — Phone mockup */}
          <div className="flex justify-center">
            <div className="relative w-[280px] md:w-[300px]">
              <div className="rounded-[2.5rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-800 rounded-b-2xl z-10" />

                {/* Screen */}
                <div className={`${bg} transition-colors duration-300`}>
                  {/* Store header */}
                  <div className="relative h-28 overflow-hidden" style={{ backgroundColor: `${accent}20` }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-current" style={{ color: isDark ? "#09090b" : "#ffffff" }} />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black" style={{ backgroundColor: accent }}>
                        BP
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${text} transition-colors`}>Burger Pro</p>
                        <p className={`text-[10px] ${textMuted} transition-colors`}>Hamburgueseria Artesanal</p>
                      </div>
                    </div>
                  </div>

                  {/* Category tabs */}
                  <div className={`flex gap-2 px-4 py-3 border-b ${border} transition-colors overflow-x-auto`}>
                    {["Burgers", "Papas", "Bebidas"].map((cat, i) => (
                      <span
                        key={cat}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
                          i === 0
                            ? "text-white"
                            : `${textMuted} ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`
                        }`}
                        style={i === 0 ? { backgroundColor: accent } : undefined}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Product cards */}
                  <div className="p-3 space-y-2.5">
                    {MOCK_PRODUCTS.map((product) => (
                      <div
                        key={product.name}
                        className={`flex gap-3 p-2.5 rounded-xl border ${border} ${cardBg} transition-colors`}
                      >
                        {/* Placeholder image */}
                        <div className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                          <ShoppingBag size={18} style={{ color: accent }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${text} transition-colors truncate`}>{product.name}</p>
                          <p className={`text-[10px] ${textMuted} transition-colors truncate`}>{product.desc}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-sm font-black transition-colors" style={{ color: accent }}>
                              ${product.price.toLocaleString("es-AR")}
                            </span>
                            <span className={`flex items-center gap-0.5 text-[10px] ${textMuted}`}>
                              <Star size={9} className="fill-amber-400 text-amber-400" />
                              {product.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom checkout bar */}
                  <div className={`mx-3 mb-3 rounded-xl py-3 text-center text-xs font-black text-white uppercase tracking-wider transition-colors`} style={{ backgroundColor: accent }}>
                    Checkout · $18.500
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
