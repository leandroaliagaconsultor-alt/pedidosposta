import { Zap, Palette, TrendingUp, Truck, CheckCircle2 } from "lucide-react"

const features = [
  {
    id: "live-orders",
    badge: "Gestion en Tiempo Real",
    icon: Zap,
    title: "Live Orders",
    subtitle: "Control total de tus pedidos",
    description: "Ve todos los pedidos entrantes en tiempo real. Confirma, prepara y despacha con un click. Tu cliente ve el estado actualizado automaticamente.",
    image: "/live-orders.png",
    benefits: [
      "Estados: Recibido, Confirmado, Despachado, Entregado",
      "Notificaciones push al cliente",
      "Historial completo de cada pedido",
      "Filtros por estado, fecha y tipo"
    ],
    reverse: false
  },
  {
    id: "brand-studio",
    badge: "Tu Marca, Tu Estilo",
    icon: Palette,
    title: "Brand Studio",
    subtitle: "Personaliza tu tienda",
    description: "Tu local se ve como un negocio serio. Logo, colores, banner y mas. Modo claro u oscuro. Preview en vivo mientras editas.",
    image: "/brand-studio.png",
    benefits: [
      "Logo y banner personalizados",
      "Color de marca en toda la tienda",
      "Modo claro / oscuro",
      "Vista previa en tiempo real"
    ],
    reverse: true
  },
  {
    id: "analytics",
    badge: "Datos que Importan",
    icon: TrendingUp,
    title: "Analytics Dashboard",
    subtitle: "Conoce tu negocio",
    description: "Ingresos totales, ticket promedio, ratio delivery vs takeaway. Exporta a CSV, filtra por fecha, busca por cliente.",
    image: "/analytics-dashboard.png",
    benefits: [
      "Ingresos y pedidos totales",
      "Ticket promedio por venta",
      "Ratio Delivery vs Take Away",
      "Exportacion CSV con un click"
    ],
    reverse: false
  },
  {
    id: "delivery-zones",
    badge: "Logistica Inteligente",
    icon: Truck,
    title: "Zonas de Entrega",
    subtitle: "Configura tu cobertura",
    description: "Costo fijo o por distancia. Define tu radio de entrega, precio base y precio extra por km. Visualiza tu zona en el mapa.",
    image: "/envios.png",
    benefits: [
      "Costo fijo o por distancia",
      "Radio de entrega configurable",
      "Integracion con Google Maps",
      "KMs base incluidos + extra/km"
    ],
    reverse: true
  }
]

export function FeaturesShowcase() {
  return (
    <section id="features" className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-medium mb-2">Funcionalidades</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Todo lo que necesitas para
            <br />
            <span className="text-gradient">gestionar tu local</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Cada feature fue pensada para resolver problemas reales de gastronomicos como vos.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-24">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                feature.reverse ? "lg:grid-flow-dense" : ""
              }`}
            >
              {/* Content */}
              <div className={`space-y-5 ${feature.reverse ? "lg:col-start-2" : ""}`}>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium">
                  <feature.icon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary">{feature.badge}</span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-xl md:text-2xl font-bold mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.subtitle}</p>
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Benefits list */}
                <ul className="space-y-2.5">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/80">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Image */}
              <div className={`${feature.reverse ? "lg:col-start-1" : ""}`}>
                <div className="relative rounded-2xl overflow-hidden glass glow-subtle">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
