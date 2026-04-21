"use client"

import { useEffect, useRef } from "react"

const chats = [
  { n: "María Rodríguez", m: "Hola quiero pedir", t: "23:45", u: 3, urgent: true },
  { n: "Juan Pérez", m: "🎤 Audio (0:47)", t: "23:42", u: 1, audio: true },
  { n: "Carla Gómez", m: "me pasas el menú??", t: "23:38", u: 2 },
  { n: "Pedro Martínez", m: "hola estás?", t: "23:35", u: 5, urgent: true },
  { n: "Laura Sánchez", m: "🎤 Audio (1:23)", t: "23:30", audio: true },
  { n: "Diego Fernández", m: "quiero 2 hamburguesas", t: "23:28", u: 1 },
  { n: "Ana López", m: "cuánto sale el envío?", t: "23:25", u: 4 },
  { n: "Martín Silva", m: "??", t: "23:20", u: 2, urgent: true },
  { n: "Sofía Torres", m: "🎤 Audio (0:34)", t: "23:15", audio: true },
  { n: "Lucas Díaz", m: "todavía están abiertos?", t: "23:10" },
  { n: "Valentina Ruiz", m: "🎤 Audio (2:14)", t: "23:05", audio: true, urgent: true },
  { n: "Gonzalo Paz", m: "hola?", t: "23:00", u: 3, urgent: true },
]

const painCards = [
  { num: "01", title: "Pedidos perdidos", desc: "Se mezclan con reservas, consultas y spam. Uno se cae al scroll y adiós $12.000." },
  { num: "02", title: "Errores a cocina", desc: "Transcribís mal la dirección, te olvidás del \"sin cebolla\", rehacés la pizza." },
  { num: "03", title: "Cero historial", desc: "Tu mejor cliente vuelve mañana y tenés que preguntarle todo otra vez. Horrible." },
  { num: "04", title: "Cero datos", desc: "No sabés qué plato vende, qué hora pega más, ni quién te deja el 40% de la plata." },
]

export function ProblemSection() {
  return (
    <section className="bg-[var(--cream)] border-t border-[var(--line)] py-[110px] max-sm:py-[80px]" id="problema">
      <div className="max-w-[1280px] mx-auto px-7 max-sm:px-[18px]">
        {/* Head */}
        <div className="max-w-[900px]">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[var(--teal-deep)] uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            <span className="w-6 h-[2px] bg-[var(--teal)]" />
            Dolor #1 · El caos del WhatsApp
          </span>
          <h2 className="text-[clamp(40px,5.2vw,76px)] leading-[.95] tracking-[-0.025em] uppercase mt-[18px]" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Son las 21:47,
            <br />
            tenés <span className="text-[var(--clay)]">147 mensajes</span> sin leer
            <br />
            y <span className="text-[var(--teal)]">3 pedidos perdidos</span>.
          </h2>
          <p className="text-lg leading-relaxed text-[#2a2e2c] max-w-[620px] mt-[18px]">
            Audios eternos, direcciones mal escritas, &quot;hola?&quot; a los gritos, y al final del día no tenés ni idea de cuánto vendiste. Así trabaja el 80% de los gastronómicos del interior.
          </p>
        </div>

        {/* Grid: chat + pain cards */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-10 mt-[60px] items-start">
          {/* Chat panel */}
          <div className="bg-[#0b1410] rounded-3xl overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,.5)]">
            <div className="bg-[#0c2a20] text-[#e9edef] px-[18px] py-[14px] flex items-center justify-between text-[13px] font-bold">
              <span>WhatsApp · Delivery</span>
              <span className="bg-[var(--clay)] text-white px-2 py-[2px] rounded-full text-[11px] font-black tracking-[.04em]">147 sin leer</span>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {chats.map((c, i) => {
                const initials = c.n.split(" ").map(x => x[0]).join("").slice(0, 2)
                return (
                  <div key={i} className={`flex gap-3 px-4 py-3 border-b border-white/5 items-center ${c.urgent ? "bg-[rgba(226,90,43,.08)]" : ""}`}>
                    <div className="w-[38px] h-[38px] rounded-full bg-[#2a3942] text-[#8ea3ad] inline-flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#e9edef] text-[13px] font-bold flex justify-between gap-2">
                        <span>{c.n}</span>
                        <span className="text-[10px] text-[#8696a0] font-medium">{c.t}</span>
                      </div>
                      <div className="text-[#8696a0] text-xs mt-[2px] flex items-center gap-[6px]">
                        {c.audio && <span className="w-[6px] h-[6px] rounded-full bg-[var(--teal)] inline-block" />}
                        <span>{c.m}</span>
                        {c.u && (
                          <span className="bg-[var(--teal)] text-[#0b1410] text-[10px] font-extrabold min-w-[18px] h-[18px] rounded-full inline-flex items-center justify-center px-[6px] ml-auto">
                            {c.u}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pain cards side */}
          <div>
            <div className="flex flex-wrap gap-2 mb-7">
              {["🎤 \"Audio 2:34\"", "📍 \"Calle 24 entre...\"", "❓ \"hola?\"", "❓ \"siguen abiertos?\"", "💬 \"me pasas el menú??\"", "🔁 \"ya salió mi pedido?\"", "🙄 \"y el mío?\""].map((chip, i) => (
                <span key={i} className="bg-white border border-[var(--line)] rounded-full px-3 py-[6px] text-xs font-semibold text-[#4a4e4c]">{chip}</span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {painCards.map((card) => (
                <div key={card.num} className="bg-white border border-[var(--line)] rounded-[18px] p-[22px] relative overflow-hidden">
                  <div className="text-5xl text-[var(--clay)] leading-none tracking-[-0.03em]" style={{ fontFamily: "var(--font-display), sans-serif" }}>{card.num}</div>
                  <h4 className="mt-2 mb-[6px] font-extrabold text-lg" style={{ fontFamily: "var(--font-display), sans-serif" }}>{card.title}</h4>
                  <p className="text-sm leading-relaxed text-[#4a4e4c] m-0">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* Solution teaser */}
            <div className="mt-8 p-6 bg-white border border-[var(--line)] rounded-2xl flex items-center gap-[18px]">
              <div className="w-[14px] h-[14px] rounded-full bg-[var(--teal)] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-lg tracking-tight" style={{ fontFamily: "var(--font-display), sans-serif" }}>Con PedidosPosta, se acabó.</div>
                <div className="text-[13px] text-[#4a4e4c] mt-[2px]">Tu cliente entra a tu link, arma su pedido, paga, y vos lo ves ordenado en pantalla tipo cocina.</div>
              </div>
              <a href="#features" className="hidden sm:inline-flex items-center px-5 py-3 rounded-full font-bold text-sm bg-[var(--teal)] text-white flex-shrink-0">Mostrame</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
