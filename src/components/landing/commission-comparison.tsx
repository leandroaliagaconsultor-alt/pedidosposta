export function CommissionComparison() {
  return (
    <section className="bg-[var(--ink)] text-[var(--cream)] py-[110px] max-sm:py-[80px] relative overflow-hidden">
      {/* Bleed glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(600px 200px at 20% 120%, rgba(226,90,43,.18), transparent 70%)" }} />

      <div className="max-w-[1280px] mx-auto px-7 max-sm:px-[18px] relative">
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[#F7C4AE] uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          <span className="w-6 h-[2px] bg-[var(--clay)]" />
          Dolor #2 · El costo oculto
        </span>
        <h2 className="text-[clamp(40px,5.2vw,76px)] leading-[.95] tracking-[-0.025em] uppercase mt-[18px] text-white" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Dejá de trabajar
          <br />
          para <span className="text-[var(--clay)]">otras apps</span>.
        </h2>
        <p className="text-lg leading-relaxed text-[var(--cream)]/75 max-w-[620px] mt-[18px]">
          Las apps de delivery te cobran del 1 al 30% por pedido, te roban la relación con tus clientes, te cobran a los 15 días y encima ni siquiera tienen repartidores en tu ciudad. <b className="text-white">La plata que haces, tiene que ser tuya.</b>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mt-14 items-stretch">
          {/* Loss column */}
          <div className="rounded-3xl p-9 relative overflow-hidden flex flex-col bg-[#261612] border border-[rgba(226,90,43,.25)]">
            <div className="flex items-center gap-[10px] mb-[18px]">
              <span className="px-[10px] py-1 rounded-full text-[11px] font-extrabold tracking-[.06em] uppercase bg-[rgba(226,90,43,.2)] text-[#FFBFA8]">Las otras apps</span>
            </div>
            <h3 className="text-[32px] tracking-[-0.02em] uppercase m-0" style={{ fontFamily: "var(--font-display), sans-serif" }}>Apps tradicionales</h3>
            <div className="opacity-70 text-sm mt-1">Apps de delivery tradicionales</div>
            <ul className="list-none p-0 mt-6 flex flex-col gap-3">
              {[
                "Te cobran del 1 al 30% por pedido",
                "Los clientes son de ellos, no tuyos",
                "Cobrás a los 15+ días",
                "Sin acceso a tus propias métricas",
                "Te meten en guerra de promos que te fundan",
                "En tu ciudad ni tienen repartidores",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 items-start text-[15px] leading-snug">
                  <span className="w-[22px] h-[22px] rounded-full bg-[var(--clay)] text-white inline-flex items-center justify-center text-xs font-black flex-shrink-0 mt-[2px]">✕</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-[26px] border-t border-dashed border-[rgba(226,90,43,.25)]">
              <div className="text-[clamp(36px,8vw,54px)] tracking-[-0.03em] leading-[.95] text-[var(--clay)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>-$300.000</div>
              <div className="flex justify-between items-baseline mt-[6px]">
                <div className="text-xs opacity-70">vendiendo $1.000.000/mes</div>
                <div className="text-[11px] tracking-[.1em] uppercase opacity-70 text-right">Se lo lleva la app cada mes.</div>
              </div>
            </div>
          </div>

          {/* Win column */}
          <div className="rounded-3xl p-9 relative overflow-hidden flex flex-col bg-[var(--teal)] text-white">
            <span className="absolute top-3 right-3 rotate-[10deg] bg-white text-[var(--teal-deep)] px-[14px] py-[6px] rounded-full text-xs tracking-[.06em] shadow-[0_10px_30px_-10px_rgba(0,0,0,.4)] z-10" style={{ fontFamily: "var(--font-display), sans-serif" }}>★ POSTA ★</span>
            <div className="flex items-center gap-[10px] mb-[18px]">
              <span className="px-[10px] py-1 rounded-full text-[11px] font-extrabold tracking-[.06em] uppercase bg-white/[.18] text-white">PedidosPosta</span>
            </div>
            <h3 className="text-[32px] tracking-[-0.02em] uppercase m-0" style={{ fontFamily: "var(--font-display), sans-serif" }}>Plan Full Commerce</h3>
            <div className="opacity-70 text-sm mt-1">Todo incluido, sin letra chica.</div>
            <ul className="list-none p-0 mt-6 flex flex-col gap-3">
              {[
                "0% de comisión, siempre",
                "Los clientes son tuyos, 100%",
                "Cobrás al toque en tu MercadoPago",
                "Panel con métricas reales",
                "Usás tus propios repartidores",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 items-start text-[15px] leading-snug">
                  <span className="w-[22px] h-[22px] rounded-full bg-white text-[var(--teal-deep)] inline-flex items-center justify-center text-xs font-black flex-shrink-0 mt-[2px]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-[26px] border-t border-dashed border-white/20">
              <div className="text-[clamp(36px,8vw,54px)] tracking-[-0.03em] leading-[.95] text-white" style={{ fontFamily: "var(--font-display), sans-serif" }}>+$300.000</div>
              <div className="flex justify-between items-baseline mt-[6px]">
                <div className="text-xs opacity-85">te quedan en el bolsillo</div>
                <div className="text-[11px] tracking-[.1em] uppercase opacity-70 text-right">Con el mismo volumen de ventas.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
