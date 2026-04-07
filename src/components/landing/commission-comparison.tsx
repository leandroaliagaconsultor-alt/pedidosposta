import { X, Check, ArrowRight, Zap, Clock, Users, Banknote, BarChart3, Globe } from "lucide-react"
import Link from "next/link"

const enemyPoints = [
  { icon: Banknote, text: "Te cobran hasta 30% por pedido" },
  { icon: Users, text: "Se quedan con los datos de tus clientes" },
  { icon: Clock, text: "Cobras a los 15 dias o mas" },
  { icon: BarChart3, text: "Sin acceso a tus propias metricas" },
]

const heroPoints = [
  { icon: Banknote, text: "0% de comision, siempre" },
  { icon: Users, text: "Tus clientes son tuyos" },
  { icon: Zap, text: "La plata va directo a tu MercadoPago" },
  { icon: Globe, text: "Tu dominio, tu marca, tu negocio" },
]

export function CommissionComparison() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 relative">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-red-400 text-sm font-medium mb-2">El costo oculto</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-balance">
            Deja de trabajar
            <br />
            <span className="text-red-400">para otras apps.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Las apps de delivery se llevan hasta el 30% de tu esfuerzo. Con PedidosPosta, la plata que haces es tuya.
          </p>
        </div>

        {/* Comparison cards */}
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {/* Enemy card */}
          <div className="relative rounded-2xl border border-red-500/15 bg-red-950/10 backdrop-blur-sm p-6 md:p-7">
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 mb-3">
                Otras Apps
              </div>
              <p className="text-xl font-bold text-foreground/90">Apps tradicionales</p>
              <p className="text-sm text-zinc-400 mt-1">PedidosYa, Rappi, etc.</p>
            </div>

            {/* Points */}
            <ul className="space-y-4">
              {enemyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <span className="text-sm text-zinc-400 leading-relaxed">{point.text}</span>
                </li>
              ))}
            </ul>

            {/* Simulated cost */}
            <div className="mt-6 pt-5 border-t border-red-500/10">
              <p className="text-xs text-zinc-400 mb-1">Si vendes $1.000.000/mes</p>
              <p className="text-lg font-bold text-red-400">-$300.000 <span className="text-xs font-normal text-zinc-400">en comisiones</span></p>
            </div>
          </div>

          {/* PedidosPosta card */}
          <div className="relative rounded-2xl border border-primary/20 bg-zinc-900/40 backdrop-blur-xl p-6 md:p-7 shadow-[0_0_60px_-15px_rgba(34,197,94,0.12)]">
            {/* Recommended badge */}
            <div className="absolute -top-3 right-5">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tracking-wide shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <Zap className="w-3 h-3" />
                TU MEJOR OPCION
              </div>
            </div>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-3">
                PedidosPosta
              </div>
              <p className="text-xl font-bold text-foreground">Plan Full Commerce</p>
              <p className="text-sm text-zinc-400 mt-1">Todo incluido, sin sorpresas.</p>
            </div>

            {/* Points */}
            <ul className="space-y-4">
              {heroPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground/80 leading-relaxed">{point.text}</span>
                </li>
              ))}
            </ul>

            {/* Simulated cost */}
            <div className="mt-6 pt-5 border-t border-primary/10">
              <p className="text-xs text-zinc-400 mb-1">Si vendes $1.000.000/mes</p>
              <p className="text-lg font-bold text-primary">$0 <span className="text-xs font-normal text-zinc-400">en comisiones — te queda todo</span></p>
            </div>

            {/* CTA */}
            <Link
              href="/register"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.25)]"
            >
              Empezar mis 10 dias gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
