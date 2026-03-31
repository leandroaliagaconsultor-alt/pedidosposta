import { Instagram, Twitter, Linkedin, Mail } from "lucide-react"

const links = {
  producto: [
    { label: "Funcionalidades", href: "#features" },
    { label: "Precios", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
    { label: "Roadmap", href: "#" },
  ],
  recursos: [
    { label: "Blog", href: "#" },
    { label: "Guias", href: "#" },
    { label: "Casos de exito", href: "#" },
    { label: "Soporte", href: "#" },
  ],
  legal: [
    { label: "Privacidad", href: "#" },
    { label: "Terminos", href: "#" },
    { label: "Cookies", href: "#" },
  ],
}

const social = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "mailto:hola@pedidosposta.com", label: "Email" },
]

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-card/30">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="/" className="flex items-center gap-1.5 mb-4">
              <span className="text-lg font-semibold text-foreground">Pedidos</span>
              <span className="text-lg font-semibold text-primary">Posta</span>
              <span className="text-primary text-xl">.</span>
            </a>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              El sistema de pedidos online para gastronomicos que quieren dejar de perder ventas por WhatsApp.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {social.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label={item.label}
                >
                  <item.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-medium text-sm mb-3">Producto</h4>
            <ul className="space-y-2">
              {links.producto.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3">Recursos</h4>
            <ul className="space-y-2">
              {links.recursos.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border/30 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            2024 PedidosPosta. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Hecho con cafe en Argentina
          </p>
        </div>
      </div>
    </footer>
  )
}
