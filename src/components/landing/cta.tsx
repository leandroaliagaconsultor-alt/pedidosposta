import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 relative text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-balance">
          Listo para dejar de perder
          <br />
          <span className="text-gradient">pedidos por WhatsApp?</span>
        </h2>

        <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-8">
          Unite a los +500 locales que ya profesionalizaron su sistema de pedidos. Setup en 5 minutos, gratis para empezar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          >
            Crear mi tienda gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Sin tarjeta de credito requerida
        </p>
      </div>
    </section>
  )
}
