import { Upload, Palette, Share2, TrendingUp } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Subi tu menu",
    description: "Foto del menu o carga manual. Nuestra IA detecta productos, precios y descripciones automaticamente."
  },
  {
    number: "02",
    icon: Palette,
    title: "Personaliza tu tienda",
    description: "Logo, colores, banner. En 5 minutos tenes tu pagina de pedidos profesional con tu marca."
  },
  {
    number: "03",
    icon: Share2,
    title: "Comparti tu link",
    description: "tulocal.pedidosposta.com listo para recibir pedidos. Compartilo en redes, WhatsApp o donde quieras."
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Gestiona y crece",
    description: "Pedidos en tiempo real, analytics, zonas de entrega. Todo lo que necesitas para escalar."
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 relative bg-grid">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-primary text-sm font-medium mb-2">Como Funciona</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            De WhatsApp a profesional
            <br />
            <span className="text-gradient">en 4 pasos</span>
          </h2>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-primary/30 to-transparent" />
              )}

              <div className="glass rounded-2xl p-5 h-full relative group hover:border-primary/30 transition-colors">
                {/* Step number */}
                <span className="text-4xl font-bold text-primary/20 absolute top-4 right-4">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Customer view preview */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <p className="text-muted-foreground text-sm">Asi se ve tu tienda para tus clientes</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Store view */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="bg-secondary/50 px-4 py-2 border-b border-border/30">
                <p className="text-xs text-muted-foreground">tulocal.pedidosposta.com</p>
              </div>
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src="/tienda.png"
                  alt="Vista de tienda"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Checkout view */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="bg-secondary/50 px-4 py-2 border-b border-border/30">
                <p className="text-xs text-muted-foreground">Checkout profesional</p>
              </div>
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src="/checkout.png"
                  alt="Vista de checkout"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
