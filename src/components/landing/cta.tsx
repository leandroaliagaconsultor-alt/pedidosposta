import Link from "next/link"

export function CTA() {
  return (
    <section className="bg-[var(--ink)] text-[var(--cream)] relative overflow-hidden py-[140px] max-sm:py-[100px]">
      {/* Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(67,146,106,.3), transparent 60%)" }} />

      <div className="max-w-[1280px] mx-auto px-7 max-sm:px-[18px] relative">
        <h2 className="text-[clamp(56px,9vw,140px)] leading-[.88] tracking-[-0.035em] uppercase m-0 text-center" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Dale,
          <br />
          <span className="text-[var(--teal)]">dejá<span className="inline-block w-[.35em] h-[.35em] rounded-full bg-[var(--teal)]" /></span> de perder
          <br />
          pedidos.
        </h2>
        <p className="text-center text-lg max-w-[560px] mx-auto mt-6 text-[var(--cream)]/70">
          10 días gratis. Sin tarjeta. Te cargamos el menú nosotros. En 5 minutos estás vendiendo.
        </p>
        <div className="flex gap-[14px] justify-center mt-10 flex-wrap">
          <Link href="/register" className="inline-flex items-center px-7 py-4 rounded-full font-bold text-[15px] bg-[var(--teal)] text-white shadow-[0_1px_0_rgba(0,0,0,.08),0_8px_22px_-10px_rgba(67,146,106,.7)] hover:translate-y-[-1px] transition-all">
            Crear mi tienda gratis →
          </Link>
          <a href="https://wa.me/542324627679" className="inline-flex items-center px-7 py-4 rounded-full font-bold text-[15px] bg-[var(--cream)]/[.08] text-[var(--cream)] border border-[var(--cream)]/20">
            Hablar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
