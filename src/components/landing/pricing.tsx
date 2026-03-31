import Link from "next/link"
import { Check, Sparkles } from "lucide-react"

const plans = [
  {
    name: "Starter",
    description: "Para empezar a recibir pedidos online",
    price: "0",
    period: "gratis para siempre",
    features: [
      "Hasta 50 pedidos/mes",
      "Tienda personalizada basica",
      "Live Orders",
      "Checkout con delivery/takeaway",
      "Soporte por email"
    ],
    cta: "Empezar gratis",
    href: "/register",
    popular: false
  },
  {
    name: "Pro",
    description: "Para locales que quieren crecer",
    price: "14.990",
    period: "/mes",
    features: [
      "Pedidos ilimitados",
      "Brand Studio completo",
      "Analytics Dashboard",
      "Zonas de entrega por radio",
      "Integracion MercadoPago",
      "Dominio personalizado",
      "Soporte prioritario"
    ],
    cta: "Probar 14 dias gratis",
    href: "/register",
    popular: true
  },
  {
    name: "Business",
    description: "Para cadenas y franquicias",
    price: "Contactar",
    period: "",
    features: [
      "Todo lo de Pro",
      "Multiples sucursales",
      "API para integraciones",
      "Reportes avanzados",
      "Account manager dedicado",
      "SLA garantizado",
      "Onboarding personalizado"
    ],
    cta: "Hablar con ventas",
    href: "#",
    popular: false
  }
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 relative">
      <div className="max-w-5xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-primary text-sm font-medium mb-2">Precios</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Simple y transparente.
            <br />
            <span className="text-gradient">Sin letra chica.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Empeza gratis, escala cuando lo necesites. Todos los precios en ARS.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? "glass-strong border-primary/30 glow-subtle"
                  : "glass"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    Mas popular
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-5">
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-5">
                {plan.price === "Contactar" ? (
                  <span className="text-2xl font-bold">Contactar</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={`block w-full text-center rounded-full py-2.5 text-sm font-medium transition-colors ${
                  plan.popular
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Trust note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Cancela cuando quieras. Sin contratos. Sin sorpresas.
        </p>
      </div>
    </section>
  )
}
