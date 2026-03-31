import Link from "next/link"
import { ArrowRight, Play, CheckCircle2 } from "lucide-react"

const stats = [
  { value: "500+", label: "Locales Activos" },
  { value: "2.4M", label: "Pedidos Procesados" },
  { value: "98%", label: "Clientes Satisfechos" },
]

export function Hero() {
  return (
    <section className="relative pt-28 pb-12 overflow-hidden bg-grid">
      {/* Gradient orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary">Nuevo</span>
              <span className="text-muted-foreground">Menu Builder con IA incluido</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-[1.1] tracking-tight text-balance">
              Deja de perder
              <br />
              <span className="text-gradient">pedidos</span> por WhatsApp.
            </h1>

            {/* Subheadline */}
            <p className="text-base text-muted-foreground max-w-md leading-relaxed">
              El sistema de pedidos online que tu local necesita.
              Profesional, con tu marca, y sin el caos de los mensajes.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full px-6 h-11 font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                Empezar gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                className="inline-flex items-center gap-2 rounded-full px-6 h-11 font-medium border border-border/50 hover:bg-secondary text-foreground transition-colors"
              >
                <Play className="w-4 h-4" />
                Ver demo
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-4 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Sin tarjeta requerida</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Setup en 5 minutos</span>
              </div>
            </div>
          </div>

          {/* Right - Phone mockup with store */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[280px] md:w-[320px]">
              {/* Phone frame */}
              <div className="relative rounded-[2.5rem] border-[8px] border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden glow-subtle">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-800 rounded-b-2xl z-10" />

                {/* Screen content - Store page */}
                <div className="relative aspect-[9/19.5] overflow-hidden">
                  <img
                    src="/checkout.png"
                    alt="Tienda de ejemplo - Checkout profesional"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>

              {/* Floating card - Order notification */}
              <div className="absolute -left-8 top-1/3 glass-strong rounded-xl p-3 shadow-xl max-w-[180px] animate-float">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm">+1</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Nuevo pedido</p>
                    <p className="text-[10px] text-muted-foreground">2x Cuarto de Libra</p>
                    <p className="text-xs font-semibold text-primary mt-1">$13.000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 pt-8 border-t border-border/30">
          <div className="flex flex-wrap justify-center gap-12 md:gap-20">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
