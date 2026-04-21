"use client"

import { useState } from "react"

const faqs = [
  { q: "¿De verdad 0% de comisión? ¿Dónde está la trampa?", a: "No hay trampa. Cobramos una suscripción mensual fija. Lo que vendas, es 100% tuyo. Nunca tocamos tu plata, nunca te retenemos 15 días, nunca te descontamos nada por pedido. Punto." },
  { q: "¿Cómo funcionan los 10 días gratis?", a: "Te registrás, subimos tu menú (lo hacemos nosotros), abrís tu tienda. 10 días para recibir pedidos reales y ver cómo te cambia la vida. Si no te convence, no pagás. Si te convence, cobramos el plan. Sin tarjeta al inicio." },
  { q: "Yo ya tengo mis motoqueros, ¿me sirve igual?", a: "Sobre todo si ya tenés motoqueros. PedidosPosta no te manda repartidores — te ordena los pedidos, te cobra online, y vos los despachás con tu flota. Justamente por eso no te cobramos 30%." },
  { q: "No tengo tiempo para cargar el menú, ¿me ayudan?", a: "Incluido en el plan. Nos mandás tu menú por WhatsApp, PDF o foto. Nuestro equipo lo carga, con fotos, categorías y precios. Empezás a vender con todo listo." },
  { q: "¿Cómo cobro a mis clientes?", a: "Tu cliente paga directo a tu MercadoPago (la plata cae al toque) o por transferencia con comprobante adjunto. También podés aceptar efectivo. Vos elegís." },
  { q: "Mi ciudad es chica, ¿tiene sentido?", a: "Tiene sentido justamente por eso. Las apps grandes no llegan bien al interior, y si llegan cobran una fortuna. Tenemos locales funcionando en pueblos de 20.000 habitantes facturando bárbaro. Tu ciudad probablemente ya tiene un local nuestro." },
  { q: "¿Y si dejo de usarlo?", a: "Cancelás cuando quieras desde el panel. Sin llamadas, sin trámites. Te exportamos tus datos en CSV y listo." },
]

export function FAQ() {
  const [open, setOpen] = useState<number>(0)

  return (
    <section className="bg-[var(--cream)] py-[110px] max-sm:py-[80px]" id="faq">
      <div className="max-w-[860px] mx-auto px-7 max-sm:px-[18px]">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[var(--teal-deep)] uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            <span className="w-6 h-[2px] bg-[var(--teal)]" />
            Preguntas frecuentes
          </span>
          <h2 className="text-[clamp(40px,5.2vw,76px)] leading-[.95] tracking-[-0.025em] uppercase mt-[18px]" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Las dudas
            <br />
            de siempre.
          </h2>
        </div>

        <div className="mt-10 border-t border-[var(--line-strong)]">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-[var(--line-strong)]">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex justify-between items-center py-[22px] text-left font-extrabold text-xl tracking-tight"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                <span>{faq.q}</span>
                <span className={`text-[26px] text-[var(--teal)] transition-transform duration-300 ${open === i ? "rotate-45" : ""}`} style={{ fontFamily: "var(--font-display), sans-serif" }}>+</span>
              </button>
              <div className={`overflow-hidden transition-all duration-400 ${open === i ? "max-h-[400px]" : "max-h-0"}`}>
                <p className="text-base leading-relaxed text-[#3a3e3c] pb-[22px] max-w-[720px] m-0">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
