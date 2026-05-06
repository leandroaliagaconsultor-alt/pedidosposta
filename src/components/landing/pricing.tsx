"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { trackPricingView, trackLead } from "@/lib/analytics/meta-pixel"

export function Pricing() {
  const [billing, setBilling] = useState<"m" | "a">("m")
  const sectionRef = useRef<HTMLElement>(null)

  // ViewContent — se dispara una sola vez cuando pricing entra al viewport
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const fired = sessionStorage.getItem("px_pricing_viewed")
    if (fired) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackPricingView()
          sessionStorage.setItem("px_pricing_viewed", "1")
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="bg-[var(--teal)] text-white py-[110px] max-sm:py-[80px] relative overflow-hidden" id="pricing">
      <div className="max-w-[1280px] mx-auto px-7 max-sm:px-[18px] text-center">
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[#D7E9DE] uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          <span className="w-6 h-[2px] bg-white" />
          Precios
        </span>
        <h2 className="text-[clamp(40px,5.2vw,76px)] leading-[.95] tracking-[-0.025em] uppercase mt-[18px] text-white" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Un precio.
          <br />
          Todo <span className="text-[var(--ink)]">incluido</span>.
        </h2>
        <p className="text-lg leading-relaxed text-white/85 max-w-[620px] mx-auto mt-[18px]">
          Sin comisiones por pedido. Sin sorpresas. Sin letra chica. Te cobramos lo que dice y nada más.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-[10px] bg-white/15 p-1 rounded-full mt-[22px]">
          <button onClick={() => setBilling("m")} className={`px-4 py-2 rounded-full font-extrabold text-xs tracking-[.04em] uppercase ${billing === "m" ? "bg-white text-[var(--teal-deep)]" : "text-white opacity-75"}`}>Mensual</button>
          <button onClick={() => setBilling("a")} className={`px-4 py-2 rounded-full font-extrabold text-xs tracking-[.04em] uppercase ${billing === "a" ? "bg-white text-[var(--teal-deep)]" : "text-white opacity-75"}`}>Anual · 2 meses gratis</button>
        </div>

        {/* Ticket card */}
        <div className="mt-[50px] bg-[var(--cream)] text-[var(--ink)] rounded-3xl p-12 max-sm:p-[30px] max-w-[640px] mx-auto shadow-[0_40px_80px_-30px_rgba(0,0,0,.3)] relative text-left">
          {/* Ticket punch holes */}
          <span className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--teal)]" />
          <span className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--teal)]" />

          <div className="flex justify-between items-center mb-5">
            <span className="text-xs tracking-[.1em] text-[#5a5e5c]" style={{ fontFamily: "var(--font-mono), monospace" }}>PLAN FULL COMMERCE · 01/01</span>
            <span className="bg-[var(--ink)] text-[var(--cream)] px-3 py-[6px] rounded-full text-[11px] font-extrabold tracking-[.06em] uppercase">⚡ 10 días gratis</span>
          </div>

          <div className="text-4xl tracking-[-0.02em] uppercase leading-none" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Todo lo que necesitás<span className="inline-block w-[.4em] h-[.4em] rounded-full bg-[var(--teal)] ml-1" />
          </div>
          <div className="text-sm text-[#4a4e4c] mt-[6px]">Pedidos ilimitados · soporte 24/7 · cero comisiones</div>

          <div className="text-[120px] max-sm:text-[80px] leading-[.9] tracking-[-0.04em] mt-6 mb-2" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            <span className="text-[32px] text-[var(--teal-deep)] align-top ml-1">$</span>
            {billing === "m" ? "60.000" : "50.000"}
            <span className="inline-block w-[.25em] h-[.25em] rounded-full bg-[var(--teal)]" />
          </div>
          <div className="text-sm text-[#4a4e4c]">
            {billing === "m"
              ? "por mes · ARS · IVA incluido"
              : <><b className="text-[var(--teal-deep)]">por mes</b> pagando anual · equivale a $600.000/año · te ahorrás $120.000</>
            }
          </div>

          <div className="border-t border-dashed border-[var(--line-strong)] my-[26px]" />

          <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
            {[
              "Pedidos ilimitados (0% comisiones)",
              "Cobrás directo en tu MercadoPago",
              "Menú cargado con IA (de foto a tienda)",
              "Panel de pedidos en vivo",
              "Setup bonificado — te lo cargamos nosotros",
              "Soporte prioritario 24/7 (WhatsApp)",
              "Analytics + export a Excel",
            ].map(item => (
              <li key={item} className="flex gap-[10px] items-center text-sm">
                <span className="w-[22px] h-[22px] rounded-full bg-[var(--teal)] text-white inline-flex items-center justify-center text-xs font-black flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <Link href="/register" onClick={() => trackLead("pricing")} className="mt-[26px] block w-full bg-[var(--ink)] text-[var(--cream)] p-[18px] rounded-[14px] text-center font-black text-[15px] tracking-[.06em] uppercase">
            Empezar mis 10 días gratis →
          </Link>

          <div className="flex gap-[10px] p-[14px] border border-dashed border-[var(--line-strong)] rounded-xl mt-[18px] text-xs leading-relaxed text-[#4a4e4c]">
            🛡 <div><b className="text-[var(--ink)]">Garantía POSTA:</b> si el primer mes no te ahorrás más de $60.000 en comisiones comparado con las apps, te devolvemos el 100%. Sin preguntas.</div>
          </div>
        </div>

        <p className="mt-6 text-[13px] text-white/80">Cancelás cuando quieras · Sin contratos · Sin sorpresas</p>
      </div>
    </section>
  )
}
