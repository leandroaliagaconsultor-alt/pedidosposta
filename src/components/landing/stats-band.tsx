export function StatsBand() {
  const restaurants = [
    "Burger Bros", "La Farola · Pergamino", "Pizzería Roma", "Pancho Premium",
    "Cervecería Barraca", "Santorini Empanadas", "Parrilla Don Julio",
    "Taco Loco · Mercedes", "Heladería Chivilcoy", "La Cocina Express",
  ]

  return (
    <>
      {/* Stats */}
      <section className="bg-[var(--ink)] text-[var(--cream)] py-10 border-t border-white/[.06]">
        <div className="max-w-[1280px] mx-auto px-7 max-sm:px-[18px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[30px]">
            {[
              { num: "500", label: "Locales del interior" },
              { num: "2,4M", label: "Pedidos procesados" },
              { num: "0%", label: "Comisiones por pedido" },
              { num: "98%", label: "Clientes que renuevan" },
            ].map(s => (
              <div key={s.num}>
                <div className="text-[clamp(36px,10vw,56px)] leading-none tracking-[-0.03em] whitespace-nowrap" style={{ fontFamily: "var(--font-display), sans-serif" }}>
                  {s.num}<span className="inline-block w-[.3em] h-[.3em] rounded-full bg-[var(--teal)] align-middle ml-[2px]" />
                </div>
                <div className="text-[11px] tracking-[.1em] uppercase text-[var(--cream)]/60 mt-[10px]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-[var(--teal)] text-white border-t border-black/[.06] border-b border-b-black/[.06] overflow-hidden">
        <div className="flex gap-[60px] items-center py-[18px] animate-[scrollX_35s_linear_infinite] whitespace-nowrap text-[22px] tracking-[.02em] uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          {[...restaurants, ...restaurants].map((name, i) => (
            <span key={i} className="flex items-center gap-[60px]">
              <span>{name}</span>
              <span className="text-white/55">●</span>
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
