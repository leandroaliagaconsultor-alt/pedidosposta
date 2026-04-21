import Link from "next/link"

export function Hero() {
  return (
    <section className="relative py-[60px] pb-[40px] overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-7 max-sm:px-[18px]">
        <span className="inline-flex items-center gap-[10px] px-3 py-[6px] border border-[var(--line-strong)] rounded-full text-[11px] font-bold tracking-[.08em] uppercase">
          <span className="w-[6px] h-[6px] rounded-full bg-[var(--clay)] animate-[blink_1.6s_infinite]" />
          Para gastronómicos del interior · Argentina
        </span>

        <div className="max-w-[900px] mt-7">
          <h1 className="text-[clamp(56px,9vw,136px)] leading-[.88] tracking-[-0.035em] uppercase" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Dejá
            <br />
            de perder
            <br />
            <span className="text-[var(--teal)]">
              pedidos
              <span className="inline-block w-[.35em] h-[.35em] rounded-full bg-[var(--teal)] align-baseline translate-y-[.02em]" />
            </span>
            <br />
            <span className="relative inline-block" style={{ textDecoration: "none" }}>
              por WhatsApp
              <span className="absolute left-[-4%] right-[-4%] bottom-[0.38em] h-[0.07em] bg-[var(--clay)] -rotate-[2deg] rounded-sm shadow-[0_0_0_3px_var(--cream)]" />
            </span>
          </h1>

          <p className="max-w-[520px] mt-[22px] text-lg leading-relaxed text-[#2a2e2c]">
            Dejá el caos del WhatsApp y las comisiones del 1 al 30%. <b className="text-[var(--ink)]">PedidosPosta</b> es tu propia tienda online, tu marca, tus clientes, tus repartidores. <b className="text-[var(--ink)]">Precio fijo mensual.</b> Pensado para Mercedes, Pergamino, Tandil, Venado Tuerto — no para Palermo.
          </p>

          <div className="flex gap-[14px] items-center flex-wrap mt-[26px]">
            <Link href="/register" className="inline-flex items-center px-5 py-3 rounded-full font-bold text-sm bg-[var(--teal)] text-white shadow-[0_1px_0_rgba(0,0,0,.08),0_8px_22px_-10px_rgba(67,146,106,.7)] hover:translate-y-[-1px] hover:shadow-[0_2px_0_rgba(0,0,0,.08),0_12px_26px_-10px_rgba(67,146,106,.8)] transition-all">
              Empezar mis 10 días gratis →
            </Link>
            <a href="#problema" className="text-sm font-bold text-[var(--ink)] opacity-70 hover:opacity-100 px-5 py-3">
              Ver cómo funciona
            </a>
          </div>

          <div className="flex gap-[22px] flex-wrap mt-[22px] text-[13px] text-[#3a3e3c]">
            <span className="inline-flex items-center gap-[6px]">
              <span className="w-4 h-4 rounded-full bg-[var(--teal)] text-white inline-flex items-center justify-center text-[10px] font-black">✓</span>
              0% comisiones
            </span>
            <span className="inline-flex items-center gap-[6px]">
              <span className="w-4 h-4 rounded-full bg-[var(--teal)] text-white inline-flex items-center justify-center text-[10px] font-black">✓</span>
              Setup en 5 minutos
            </span>
            <span className="inline-flex items-center gap-[6px]">
              <span className="w-4 h-4 rounded-full bg-[var(--teal)] text-white inline-flex items-center justify-center text-[10px] font-black">✓</span>
              Sin tarjeta de crédito
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
