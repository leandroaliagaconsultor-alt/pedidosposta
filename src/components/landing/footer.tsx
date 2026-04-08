import Image from "next/image"
import { Globe, MessageCircle, Mail } from "lucide-react"

const links = {
  producto: [
    { label: "Funcionalidades", href: "#features" },
    { label: "Precios", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  soporte: [
    { label: "Soporte", href: "mailto:hola@pedidosposta.com" },
    { label: "WhatsApp", href: "https://wa.me/5491100000000", external: true },
  ],
  legal: [
    { label: "Privacidad", href: "/legal/privacidad" },
    { label: "Términos", href: "/legal/terminos" },
  ],
}

const social = [
  { icon: Globe, href: "#", label: "Instagram" },
  { icon: MessageCircle, href: "#", label: "Twitter" },
  { icon: Mail, href: "mailto:hola@pedidosposta.com", label: "Email" },
]

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-card/30">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="/" className="inline-block mb-4">
              <Image
                src="/logo-pedidoposta.png"
                alt="PedidosPosta"
                width={160}
                height={36}
                className="h-8 w-auto object-contain"
              />
            </a>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              El sistema de pedidos online para gastronómicos que quieren dejar de perder ventas por WhatsApp.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {social.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label={item.label}
                >
                  <item.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Producto */}
          <div>
            <h4 className="font-medium text-sm mb-3">Producto</h4>
            <ul className="space-y-2">
              {links.producto.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h4 className="font-medium text-sm mb-3">Soporte</h4>
            <ul className="space-y-2">
              {links.soporte.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    {...("external" in link && link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
            2026 PedidosPosta. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Hecho en Argentina
          </p>
        </div>
      </div>
    </footer>
  )
}
