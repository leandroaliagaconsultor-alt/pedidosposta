"use client"

import { useState, useEffect } from "react"

const ORDER_STATES = [
  { cls: "bg-[rgba(67,146,106,.18)] text-[#78D3A3]", label: "● Nuevo" },
  { cls: "bg-[rgba(255,194,84,.18)] text-[#FFD78A]", label: "🔥 Preparando" },
  { cls: "bg-[rgba(110,180,255,.15)] text-[#9CCDFF]", label: "🛵 En camino" },
  { cls: "bg-[rgba(200,200,200,.1)] text-[#aaa]", label: "✓ Entregado" },
]

function LiveOrdersDemo() {
  const [orderStates, setOrderStates] = useState({ 1: 0, 2: 1 })

  function advanceOrder(id: number) {
    setOrderStates(prev => ({ ...prev, [id]: ((prev[id as keyof typeof prev] || 0) + 1) % 4 }))
  }

  return (
    <div className="relative bg-[#0e1512] text-[var(--cream)] rounded-3xl border border-white/[.08] p-[22px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.18)] overflow-hidden">
      <div className="flex gap-[6px] overflow-x-auto pb-[10px] mb-[10px] border-b border-white/[.08]">
        <div className="inline-flex items-center gap-[6px] px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-[.04em] uppercase whitespace-nowrap bg-[rgba(67,146,106,.18)] text-[#78D3A3]">● Nuevo <span className="bg-white/10 px-[6px] rounded-md ml-[2px]">2</span></div>
        <div className="inline-flex items-center gap-[6px] px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-[.04em] uppercase whitespace-nowrap bg-[rgba(255,194,84,.18)] text-[#FFD78A]">🔥 Preparando <span className="bg-white/10 px-[6px] rounded-md ml-[2px]">1</span></div>
        <div className="inline-flex items-center gap-[6px] px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-[.04em] uppercase whitespace-nowrap bg-[rgba(110,180,255,.15)] text-[#9CCDFF]">🛵 En camino</div>
        <div className="inline-flex items-center gap-[6px] px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-[.04em] uppercase whitespace-nowrap bg-[rgba(200,200,200,.1)] text-[#aaa]">✓ Entregado <span className="bg-white/10 px-[6px] rounded-md ml-[2px]">12</span></div>
      </div>

      {[{ id: 1, num: "#48", name: "Juan P.", items: "1× Pizza Muzza + Fainá", total: "$9.800", time: "hace 30s" },
        { id: 2, num: "#47", name: "María R.", items: "2× Burger + Papas cheddar", total: "$18.500", time: "hace 2min" }
      ].map(order => (
        <div key={order.id} className="border border-white/[.08] rounded-[14px] p-[14px] mt-[10px] bg-white/[.02]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#bdbdbd]" style={{ fontFamily: "var(--font-mono), monospace" }}>{order.num}</span>
            <span className={`text-[10px] px-2 py-1 rounded-xl font-extrabold uppercase ${ORDER_STATES[orderStates[order.id as keyof typeof orderStates]].cls}`}>
              {ORDER_STATES[orderStates[order.id as keyof typeof orderStates]].label}
            </span>
            <span className="text-[#8a948e] text-[11px] ml-auto">{order.time}</span>
          </div>
          <div className="font-extrabold text-white mt-2">{order.name}</div>
          <div className="text-[#8a948e] text-xs">{order.items}</div>
          <div className="flex justify-between items-center mt-[10px]">
            <span className="text-[var(--teal)] text-lg" style={{ fontFamily: "var(--font-display), sans-serif" }}>{order.total}</span>
            <button onClick={() => advanceOrder(order.id)} className="bg-[rgba(67,146,106,.15)] text-[#78D3A3] px-3 py-[6px] rounded-lg text-[11px] font-extrabold uppercase tracking-[.04em]">Avanzar →</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function BrandStudioDemo() {
  const [color, setColor] = useState("#43926A")
  const colors = ["#43926A", "#E25A2B", "#3b82f6", "#a855f7", "#0F1210"]

  return (
    <div className="relative bg-white rounded-3xl border border-[var(--line)] p-[22px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.18)] overflow-hidden">
      <div className="flex justify-between items-center mb-[14px]">
        <div className="flex gap-[10px] items-center">
          {colors.map(c => (
            <div key={c} onClick={() => setColor(c)} className={`w-[30px] h-[30px] rounded-lg cursor-pointer transition-transform ${color === c ? "scale-110 shadow-[0_0_0_2px_#fff,0_0_0_4px_currentColor] border-2 border-transparent" : "border-2 border-transparent"}`} style={{ background: c, color: c }} />
          ))}
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden border border-[var(--line)]">
        <div className="px-[14px] py-[14px] text-white flex items-center gap-2" style={{ background: color, fontFamily: "var(--font-display), sans-serif", fontSize: "15px" }}>
          <span className="w-7 h-7 rounded-lg bg-white text-black inline-flex items-center justify-center text-[11px] font-black">BP</span>
          <div>
            <div>Burger Pro</div>
            <div className="text-[10px] font-medium opacity-85">Hamburguesería artesanal</div>
          </div>
        </div>
        {[{ name: "Hamburguesa Clásica", sub: "Cheddar + panceta", price: "$6.500" },
          { name: "Pizza Muzzarella", sub: "Masa artesanal", price: "$7.800" },
          { name: "Papas Cheddar", sub: "Con panceta crocante", price: "$4.200" }
        ].map(item => (
          <div key={item.name} className="flex gap-[10px] items-center px-[14px] py-[10px] border-b border-[var(--line)] bg-white">
            <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: color + "26" }} />
            <div>
              <div className="text-xs font-bold">{item.name}</div>
              <div className="text-[10px] text-[#8a948e]">{item.sub}</div>
            </div>
            <div className="ml-auto text-[13px] font-bold" style={{ color, fontFamily: "var(--font-display), sans-serif" }}>{item.price}</div>
          </div>
        ))}
        <div className="mx-[14px] my-[14px] p-[10px] rounded-[10px] text-white text-center font-black text-xs tracking-[.04em] uppercase" style={{ background: color }}>
          Checkout · $18.500
        </div>
      </div>
    </div>
  )
}

function CheckoutDemo() {
  const [payMethod, setPayMethod] = useState(1)

  return (
    <div className="relative bg-[#0e1512] text-[var(--cream)] rounded-3xl border border-white/[.08] p-[22px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.18)] overflow-hidden">
      <div className="mb-[14px]">
        <label className="text-[10px] tracking-[.1em] uppercase text-[#8a948e] font-bold">Dirección de entrega</label>
        <div className="flex items-center gap-2 mt-[6px] bg-white/[.04] border border-white/[.08] rounded-[10px] px-3 py-[10px] text-[13px] text-white">📍 Av. 25 de Mayo 1450 · Mercedes</div>
      </div>
      <div className="mb-[14px]">
        <label className="text-[10px] tracking-[.1em] uppercase text-[#8a948e] font-bold">Método de pago</label>
        <div className="grid grid-cols-2 gap-[10px] mt-[6px]">
          <div onClick={() => setPayMethod(1)} className={`p-3 rounded-[10px] text-center text-xs font-extrabold border cursor-pointer ${payMethod === 1 ? "bg-[rgba(67,146,106,.15)] text-[#78D3A3] border-[rgba(67,146,106,.4)]" : "bg-white/[.03] text-[#bdbdbd] border-white/[.08]"}`}>MercadoPago</div>
          <div onClick={() => setPayMethod(2)} className={`p-3 rounded-[10px] text-center text-xs font-extrabold border cursor-pointer ${payMethod === 2 ? "bg-[rgba(67,146,106,.15)] text-[#78D3A3] border-[rgba(67,146,106,.4)]" : "bg-white/[.03] text-[#bdbdbd] border-white/[.08]"}`}>Transferencia</div>
        </div>
        {payMethod === 2 && (
          <div className="mt-[10px] p-[14px] border border-dashed border-[rgba(226,194,87,.4)] rounded-[10px] bg-[rgba(226,194,87,.05)] text-xs text-[#F3D27A]">
            📎 Adjuntá el comprobante (JPG, PNG o PDF · máx 5MB)
          </div>
        )}
      </div>
      <div className="bg-white/[.04] border border-white/[.08] rounded-[10px] p-3 mt-[14px]">
        <div className="flex justify-between text-xs text-[#bdbdbd] py-[3px]"><span>Subtotal</span><span>$14.300</span></div>
        <div className="flex justify-between text-xs text-[#bdbdbd] py-[3px]"><span>Envío · Zona Centro</span><span>$1.500</span></div>
        <div className="flex justify-between text-sm font-black text-[var(--cream)] pt-2 border-t border-dashed border-white/15 mt-[6px]">
          <span>Total</span>
          <b className="text-[var(--teal)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>$15.800</b>
        </div>
      </div>
      <div className="mt-[14px] bg-[var(--teal)] text-white p-[14px] rounded-xl text-center font-black text-xs tracking-[.06em] uppercase">Confirmar pedido</div>
    </div>
  )
}

function TrackingDemo() {
  const [step, setStep] = useState(0)
  const msgs = [
    "Tu pedido fue recibido por el local · ~25 min",
    "¡Están preparando tu comida! 🔥",
    "Tu pedido va en camino 🛵",
    "¡Pedido entregado! Buen provecho 🎉",
  ]

  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s + 1) % 4), 3500)
    return () => clearInterval(interval)
  }, [])

  const icons = ["📦", "🔥", "🛵", "✓"]

  return (
    <div className="relative bg-[#0e1512] text-[var(--cream)] rounded-3xl border border-white/[.08] p-[22px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.18)] overflow-hidden">
      <div className="flex justify-between items-center pb-3 border-b border-white/[.08] mb-[14px]">
        <div>
          <div className="font-black text-[13px]">Pedido #47</div>
          <div className="text-[10px] text-[#8a948e] mt-[2px]">hace 12 min</div>
        </div>
        <div className="text-[var(--teal)] text-base" style={{ fontFamily: "var(--font-display), sans-serif" }}>$18.500</div>
      </div>
      <div className="py-2 px-1">
        <div className="flex justify-between relative mx-2 my-[10px]">
          <div className="absolute left-4 right-4 top-4 h-[2px] bg-white/10" />
          <div className="absolute left-4 top-4 h-[2px] bg-[var(--teal)] transition-all duration-600" style={{ width: `${(step / 3) * 94}%` }} />
          {icons.map((icon, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-[6px] w-16">
              <div className={`w-[34px] h-[34px] rounded-full inline-flex items-center justify-center text-sm transition-all ${i <= step ? "bg-[var(--teal)] text-white shadow-[0_0_0_6px_rgba(67,146,106,.15)]" : "bg-white/[.08] text-[#8a948e]"}`}>
                {icon}
              </div>
              <div className={`text-[10px] font-extrabold text-center uppercase tracking-[.04em] ${i <= step ? "text-[var(--teal)]" : "text-[#8a948e]"}`}>
                {["Recibido", "Cocina", "En camino", "Entregado"][i]}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-[14px] p-3 rounded-[10px] bg-[rgba(67,146,106,.12)] text-[var(--teal)] text-xs text-center font-bold">
        {msgs[step]}
      </div>
    </div>
  )
}

function AnalyticsDemo() {
  const [range, setRange] = useState<"w" | "m">("w")
  const weekData = { days: ["L", "M", "X", "J", "V", "S", "D"], vals: [65, 45, 80, 55, 90, 70, 85], stats: { ing: "$2,45M", tic: "$12.800", ped: "191" } }
  const monthData = { days: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"], vals: [40, 55, 70, 45, 85, 60, 75, 90, 50, 65, 80, 95], stats: { ing: "$9,8M", tic: "$11.200", ped: "875" } }
  const data = range === "w" ? weekData : monthData
  const max = Math.max(...data.vals)

  return (
    <div className="relative bg-[#0e1512] text-[var(--cream)] rounded-3xl border border-white/[.08] p-[22px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.18)] overflow-hidden">
      <div className="flex justify-between items-center mb-[14px]">
        <div className="font-black text-[13px]">Analytics · {range === "w" ? "Semana" : "Mes"}</div>
        <div className="flex border border-white/[.08] rounded-lg overflow-hidden text-[11px]">
          <button onClick={() => setRange("w")} className={`px-[10px] py-1 font-extrabold ${range === "w" ? "bg-[rgba(67,146,106,.18)] text-[var(--teal)]" : "text-[#8a948e]"}`}>Semana</button>
          <button onClick={() => setRange("m")} className={`px-[10px] py-1 font-extrabold ${range === "m" ? "bg-[rgba(67,146,106,.18)] text-[var(--teal)]" : "text-[#8a948e]"}`}>Mes</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/[.04] border border-white/[.08] rounded-[10px] p-[10px] text-center">
          <div className="text-[9px] tracking-[.1em] uppercase text-[#8a948e] font-extrabold">Ingresos</div>
          <div className="text-lg mt-1 text-[var(--teal)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>{data.stats.ing}</div>
        </div>
        <div className="bg-white/[.04] border border-white/[.08] rounded-[10px] p-[10px] text-center">
          <div className="text-[9px] tracking-[.1em] uppercase text-[#8a948e] font-extrabold">Ticket prom.</div>
          <div className="text-lg mt-1" style={{ fontFamily: "var(--font-display), sans-serif" }}>{data.stats.tic}</div>
        </div>
        <div className="bg-white/[.04] border border-white/[.08] rounded-[10px] p-[10px] text-center">
          <div className="text-[9px] tracking-[.1em] uppercase text-[#8a948e] font-extrabold">Pedidos</div>
          <div className="text-lg mt-1" style={{ fontFamily: "var(--font-display), sans-serif" }}>{data.stats.ped}</div>
        </div>
      </div>
      <div className="flex items-end gap-[6px] h-[130px] mt-[14px] py-1">
        {data.vals.map((v, i) => (
          <div key={i} className="flex-1 rounded-t-md min-h-[6px]" style={{ height: `${(v / max) * 100}%`, background: "linear-gradient(180deg, var(--teal), rgba(67,146,106,.4))" }} />
        ))}
      </div>
      <div className="flex gap-[6px] mt-[6px]">
        {data.days.map(d => (
          <span key={d} className="flex-1 text-center text-[10px] text-[#8a948e] font-bold">{d}</span>
        ))}
      </div>
      <div className="mt-3 p-[10px] rounded-[10px] bg-[rgba(67,146,106,.08)] border border-[rgba(67,146,106,.2)] text-xs flex items-center gap-2">
        ↗ <span className="text-[var(--teal)] font-black">+18%</span> <span className="text-[#8a948e]">vs semana anterior</span>
      </div>
    </div>
  )
}

const features = [
  { num: "01", badge: "⚡ Panel de cocina", title: <>Los pedidos<br />entran <span className="text-[var(--teal)]">solos</span>.</>, desc: "Cada pedido aparece como una tarjeta en tu pantalla. Nuevo → Preparando → En camino → Entregado. Tocá, avanzá, listo. Tu cocina nunca más mira el celular.", tags: ["Auto-refresh en vivo", "Sonido de campana nuevo pedido", "Imprime ticket automático"], demo: <LiveOrdersDemo /> },
  { num: "02", badge: "🎨 Estudio de marca", title: <>Tu tienda, con<br />tu <span className="text-[var(--teal)]">identidad</span>.</>, desc: "No sos \"un local más\" dentro de una app ajena. Elegí el color, subí el logo, modo claro u oscuro — tu cliente ve tu marca, tu carta, tu estilo.", tags: ["5 paletas base + color libre", "Modo claro / oscuro", "Logo + portada propios"], demo: <BrandStudioDemo />, reverse: true },
  { num: "03", badge: "💳 Checkout pro", title: <>Pagos flexibles,<br />envíos <span className="text-[var(--teal)]">inteligentes</span>.</>, desc: "Cobrá con MercadoPago o transferencia (con comprobante adjunto). Envío calculado por zona. Todo claro para tu cliente — y la plata entra directo a tu cuenta.", tags: ["MercadoPago integrado", "Transferencia + comprobante", "Zonas de envío custom"], demo: <CheckoutDemo /> },
  { num: "04", badge: "🛵 Seguimiento en vivo", title: <>Se acabó el<br />&quot;<span className="text-[var(--teal)]">¿ya salió mi pedido?</span>&quot;</>, desc: "Tu cliente ve en tiempo real dónde está su pedido. Recibido → Preparando → En camino → Entregado. Menos mensajes, menos ansiedad, más buena onda.", tags: ["Barra de progreso en vivo", "Notificación por WhatsApp / SMS", "Tiempo estimado automático"], demo: <TrackingDemo />, reverse: true },
  { num: "05", badge: "📊 Datos que importan", title: <>Decidí con<br />datos, no con<br /><span className="text-[var(--teal)]">onda</span>.</>, desc: "Ingresos, ticket promedio, mejores días, productos top. Filtrá por semana o mes, exportá a Excel. Dejá de adivinar si la promo de los miércoles funciona.", tags: ["Dashboard en tiempo real", "Export a CSV / Excel", "Top productos y clientes"], demo: <AnalyticsDemo /> },
]

export function FeaturesInteractive() {
  return (
    <section className="bg-[var(--cream)] py-[110px] max-sm:py-[80px]" id="features">
      <div className="max-w-[1280px] mx-auto px-7 max-sm:px-[18px]">
        {/* Header */}
        <div className="flex justify-between items-end flex-wrap gap-[30px]">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[var(--teal-deep)] uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              <span className="w-6 h-[2px] bg-[var(--teal)]" />
              Lo que hay adentro
            </span>
            <h2 className="text-[clamp(40px,5.2vw,76px)] leading-[.95] tracking-[-0.025em] uppercase mt-[18px]" style={{ fontFamily: "var(--font-display), sans-serif" }}>
              Todo lo que necesitás
              <br />
              para no volver
              <br />
              al <span className="text-[var(--teal)]">WhatsApp</span>.
            </h2>
          </div>
          <div className="max-w-[380px] text-right max-sm:text-left text-[15px] text-[#4a4e4c] leading-relaxed">
            Cada función fue hecha para un gastronómico que cobra caja, maneja motoqueros y tiene poco tiempo. Probalas acá abajo — son reales, no dibujitos.
          </div>
        </div>

        {/* Features list */}
        <div className="mt-[80px] flex flex-col gap-[140px] max-md:gap-[80px]">
          {features.map((feat) => (
            <div key={feat.num} className={`grid grid-cols-1 lg:grid-cols-2 gap-[60px] max-md:gap-10 items-center ${feat.reverse ? "lg:direction-rtl" : ""}`} style={feat.reverse ? { direction: "rtl" } : undefined}>
              <div style={feat.reverse ? { direction: "ltr" } : undefined}>
                <div className="text-[160px] leading-[.85] tracking-[-0.05em] text-[var(--teal-soft)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>{feat.num}</div>
                <div className="inline-flex items-center gap-2 px-3 py-[6px] bg-[var(--teal-soft)] text-[var(--teal-deep)] rounded-full text-[11px] font-extrabold tracking-[.08em] uppercase mb-[18px]">{feat.badge}</div>
                <h3 className="text-[44px] max-md:text-[32px] tracking-[-0.025em] leading-none m-0 uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>{feat.title}</h3>
                <p className="text-base leading-relaxed text-[#2a2e2c] mt-4 max-w-[420px]">{feat.desc}</p>
                <ul className="list-none p-0 mt-[18px] flex flex-wrap gap-2">
                  {feat.tags.map(tag => (
                    <li key={tag} className="bg-white border border-[var(--line)] px-3 py-[6px] rounded-full text-xs font-semibold">{tag}</li>
                  ))}
                </ul>
              </div>
              <div style={feat.reverse ? { direction: "ltr" } : undefined}>
                {feat.demo}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
