const towns = [
  { name: "Mercedes", pop: "BS.AS · 63.000 hab.", note: "✓ 12 locales activos", active: true },
  { name: "Pergamino", pop: "BS.AS · 104.000 hab.", note: "✓ 18 locales activos", active: true },
  { name: "Tandil", pop: "BS.AS · 131.000 hab.", note: "✓ 22 locales activos", active: true },
  { name: "Venado Tuerto", pop: "SANTA FE · 85.000 hab.", note: "✓ 14 locales activos", active: true },
  { name: "Villa Mercedes", pop: "SAN LUIS · 111.000 hab.", note: "✓ 9 locales activos", active: true },
  { name: "Chivilcoy", pop: "BS.AS · 70.000 hab.", note: "Listo para abrir", active: false },
  { name: "Resistencia", pop: "CHACO · 291.000 hab.", note: "✓ 28 locales activos", active: true },
  { name: "Gualeguaychú", pop: "ER · 84.000 hab.", note: "Listo para abrir", active: false },
  { name: "Tu ciudad", pop: "ARGENTINA · ??.000 hab.", note: "→ sos el próximo", active: true, highlight: true },
]

export function TargetCities() {
  return (
    <section className="bg-[var(--cream-2)] border-t border-[var(--line)] border-b border-b-[var(--line)] py-[110px] max-sm:py-[80px]">
      <div className="max-w-[1280px] mx-auto px-7 max-sm:px-[18px]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[var(--teal-deep)] uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              <span className="w-6 h-[2px] bg-[var(--teal)]" />
              Para quién es esto
            </span>
            <h2 className="text-[clamp(40px,5.2vw,76px)] leading-[.95] tracking-[-0.025em] uppercase mt-[18px]" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              Para el local
              <br />
              que es el <span className="text-[var(--teal)]">rey del pueblo</span>.
            </h2>
            <p className="text-lg leading-relaxed text-[#2a2e2c] max-w-[620px] mt-[18px]">
              No hablamos de cadenas de Palermo ni de restaurantes top de CABA. Hablamos de ese local que todos conocen en su ciudad, que tiene cola los viernes, y que ya tiene sus propios motoqueros.
            </p>
            <div className="flex gap-2 mt-[22px] flex-wrap">
              {["Pizzerías", "Rotiserías", "Heladerías", "Parrillas", "Cafeterías", "Sandwicherías"].map(t => (
                <span key={t} className="bg-white border border-[var(--line)] rounded-full px-3 py-[6px] text-xs font-semibold text-[#4a4e4c]">{t}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-[10px]">
            {towns.map((town) => (
              <div key={town.name} className="bg-white border border-[var(--line)] rounded-[14px] p-[18px_16px] relative overflow-hidden">
                <div className={`absolute top-[14px] right-[14px] w-2 h-2 rounded-full ${town.active ? "bg-[var(--teal)]" : "bg-[#d6d2c7]"}`} />
                <div className="text-xl leading-none uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>{town.name}</div>
                <div className="text-[11px] text-[#5a5e5c] mt-[6px]" style={{ fontFamily: "var(--font-mono), monospace" }}>{town.pop}</div>
                <div className={`text-[11px] mt-[10px] font-bold ${town.highlight ? "text-[var(--clay)]" : town.active ? "text-[var(--teal-deep)]" : "text-[#a8a49a]"}`}>
                  {town.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
