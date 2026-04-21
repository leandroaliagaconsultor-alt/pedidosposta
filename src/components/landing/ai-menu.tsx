"use client"

import { useState, useEffect } from "react"

const menuItems = [
  { name: "Pizza Muzzarella", desc: "Masa casera, salsa de tomate, muzzarella", price: "$7.800", cat: "Pizzas" },
  { name: "Pizza Napolitana", desc: "Tomate, muzzarella, jamón, morrones", price: "$9.200", cat: "Pizzas" },
  { name: "Hamburguesa Clásica", desc: "Medallón 180g, cheddar, panceta, lechuga", price: "$6.500", cat: "Burgers" },
  { name: "Hamburguesa Doble", desc: "2 medallones, cheddar x2, panceta, huevo", price: "$9.800", cat: "Burgers" },
  { name: "Papas Cheddar", desc: "Papas fritas con cheddar y panceta crocante", price: "$4.200", cat: "Acompañamientos" },
  { name: "Fainá", desc: "Porción de fainá tradicional", price: "$1.800", cat: "Acompañamientos" },
  { name: "Coca-Cola 1.5L", desc: "Coca-Cola línea regular 1.5 litros", price: "$3.500", cat: "Bebidas" },
  { name: "Agua Mineral 500ml", desc: "Agua mineral sin gas", price: "$1.200", cat: "Bebidas" },
]

export function AIMenu() {
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle")
  const [visibleItems, setVisibleItems] = useState(0)

  function startScan() {
    setPhase("scanning")
    setVisibleItems(0)
  }

  useEffect(() => {
    if (phase !== "scanning") return
    if (visibleItems >= menuItems.length) {
      setPhase("done")
      return
    }
    const timer = setTimeout(() => setVisibleItems(v => v + 1), 400)
    return () => clearTimeout(timer)
  }, [phase, visibleItems])

  return (
    <section className="bg-[var(--cream)] border-t border-[var(--line)] py-[110px] max-sm:py-[80px]">
      <div className="max-w-[1280px] mx-auto px-7 max-sm:px-[18px]">
        <div className="max-w-[900px]">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[var(--teal-deep)] uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            <span className="w-6 h-[2px] bg-[var(--teal)]" />
            Dolor #3 · No tengo tiempo para esto
          </span>
          <h2 className="text-[clamp(40px,5.2vw,76px)] leading-[.95] tracking-[-0.025em] uppercase mt-[18px]" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Sacale una <span className="text-[var(--teal)]">foto</span>
            <br />
            al menú y <span className="text-[var(--clay)]">listo</span>.
          </h2>
          <p className="text-lg leading-relaxed text-[#2a2e2c] max-w-[620px] mt-[18px]">
            Sabemos que no tenés tiempo para sentarte a cargar 80 productos uno por uno. Sacá una foto, subí el PDF o mandanos el menú por WhatsApp — nuestra IA lee todo, arma las categorías, pone los precios y las descripciones. <b className="text-[var(--ink)]">Vos solo chequeás y aprobás.</b>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-10 mt-[60px] items-start">
          {/* Pain cards + flow */}
          <div>
            <div className="flex flex-wrap gap-2 mb-7">
              {["\"Después lo cargo\"", "\"Son 80 productos\"", "\"No tengo las fotos\"", "\"Cambio precios seguido\"", "\"No sé usar estas apps\""].map((chip, i) => (
                <span key={i} className="bg-white border border-[var(--line)] rounded-full px-3 py-[6px] text-xs font-semibold text-[#4a4e4c]">{chip}</span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { num: "01", title: "80 productos a mano", desc: "Cargar nombre, descripción, precio, foto, categoría... uno por uno. Se te va la noche entera." },
                { num: "02", title: "\"Después lo hago\"", desc: "Instalás la app, ves que hay que cargar todo, la cerrás y nunca volvés. Nos pasó mil veces." },
                { num: "03", title: "Precios que cambian", desc: "Subís los precios cada 2 semanas. Si el menú es difícil de editar, dejás de actualizarlo." },
                { num: "04", title: "Cero soporte", desc: "Te dan el panel vacío y arreglate. Acá te lo cargamos nosotros si preferís." },
              ].map(card => (
                <div key={card.num} className="bg-white border border-[var(--line)] rounded-[18px] p-[22px] relative overflow-hidden">
                  <div className="text-5xl text-[var(--clay)] leading-none tracking-[-0.03em]" style={{ fontFamily: "var(--font-display), sans-serif" }}>{card.num}</div>
                  <h4 className="mt-2 mb-[6px] font-extrabold text-lg" style={{ fontFamily: "var(--font-display), sans-serif" }}>{card.title}</h4>
                  <p className="text-sm leading-relaxed text-[#4a4e4c] m-0">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* Flow */}
            <div className="mt-8 p-6 bg-white border border-[var(--line)] rounded-2xl flex items-center gap-[18px]">
              <div className="w-[14px] h-[14px] rounded-full bg-[var(--teal)] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-lg tracking-tight" style={{ fontFamily: "var(--font-display), sans-serif" }}>Foto → IA → Menú listo.</div>
                <div className="text-[13px] text-[#4a4e4c] mt-[2px]">Subís la carta, la IA detecta productos, categorías y precios. Vos revisás, tocás publicar y salís a vender.</div>
              </div>
            </div>
          </div>

          {/* Interactive demo */}
          <div className="bg-[#0e1512] text-[var(--cream)] border border-white/[.08] rounded-3xl overflow-hidden shadow-[0_40px_80px_-30px_rgba(0,0,0,.4)]">
            <div className="px-5 py-4 border-b border-white/[.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[var(--teal)] text-white inline-flex items-center justify-center text-[10px] font-black">IA</span>
                <span className="font-extrabold text-sm">Escaneo de menú</span>
              </div>
              {phase === "done" && (
                <span className="text-[10px] font-extrabold uppercase tracking-[.06em] px-2 py-1 rounded-full bg-[var(--teal)]/20 text-[var(--teal)]">
                  {menuItems.length} productos
                </span>
              )}
            </div>

            {phase === "idle" && (
              <div className="p-5">
                <div className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/[.06] border border-white/[.08] mx-auto mb-3 inline-flex items-center justify-center text-[var(--cream)]/40 text-xl" style={{ fontFamily: "var(--font-display), sans-serif" }}>
                    PP
                  </div>
                  <div className="text-sm font-bold text-white/80">menú-pizzería-roma.jpg</div>
                  <div className="text-xs text-white/40 mt-1" style={{ fontFamily: "var(--font-mono), monospace" }}>2.4 MB · 3024 × 4032</div>
                  <button
                    onClick={startScan}
                    className="mt-5 bg-[var(--teal)] text-white px-6 py-3 rounded-xl font-extrabold text-sm tracking-[.04em] uppercase hover:translate-y-[-1px] transition-all shadow-[0_1px_0_rgba(0,0,0,.08),0_8px_22px_-10px_rgba(67,146,106,.7)]"
                  >
                    Escanear con IA →
                  </button>
                </div>
              </div>
            )}

            {phase !== "idle" && (
              <div className="p-4 max-h-[420px] overflow-y-auto">
                {phase === "scanning" && visibleItems < menuItems.length && (
                  <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-lg bg-[var(--teal)]/10 text-[var(--teal)] text-xs font-bold">
                    <span className="inline-block w-3 h-3 rounded-full border-2 border-[var(--teal)] border-t-transparent animate-spin" />
                    Leyendo productos... {visibleItems}/{menuItems.length}
                  </div>
                )}
                {menuItems.slice(0, visibleItems).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-[10px] border-b border-white/[.06] animate-[fadeIn_0.3s_ease]">
                    <div className="w-8 h-8 rounded-lg bg-[var(--teal)]/15 flex items-center justify-center text-[var(--teal)] text-[10px] font-black flex-shrink-0">
                      <span className="w-[10px] h-[10px] rounded-full bg-[var(--teal)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-xs font-bold text-white truncate">{item.name}</span>
                        <span className="text-xs font-bold text-[var(--teal)] flex-shrink-0" style={{ fontFamily: "var(--font-mono), monospace" }}>{item.price}</span>
                      </div>
                      <div className="text-[10px] text-white/40 truncate">{item.desc}</div>
                    </div>
                    <span className="text-[9px] px-2 py-[2px] rounded-full bg-white/[.06] text-white/50 font-bold flex-shrink-0">{item.cat}</span>
                  </div>
                ))}
                {phase === "done" && (
                  <div className="mt-4 p-4 rounded-xl bg-[var(--teal)]/10 border border-[var(--teal)]/20 text-center">
                    <div className="text-sm font-extrabold text-[var(--teal)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Menú completo</div>
                    <div className="text-xs text-white/50 mt-1">8 productos en 4 categorías · revisá y publicá</div>
                    <button
                      onClick={() => { setPhase("idle"); setVisibleItems(0) }}
                      className="mt-3 text-xs font-bold text-white/50 underline underline-offset-2"
                    >
                      Reiniciar demo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
