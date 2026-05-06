import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-[var(--ink)] text-[var(--cream)] pt-[60px] pb-[30px] border-t border-white/[.06]">
      <div className="max-w-[1280px] mx-auto px-7 max-sm:px-[18px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <span className="text-[22px] tracking-tight text-[var(--cream)]/55" style={{ fontFamily: "var(--font-display), sans-serif" }}>Pedidos</span>
              <span className="text-[22px] tracking-tight text-[var(--cream)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Posta</span>
              <span className="inline-block w-[10px] h-[10px] rounded-full bg-[var(--teal)] ml-[2px]" />
            </Link>
            <p className="text-sm text-[var(--cream)]/60 max-w-[320px] leading-relaxed">
              El sistema de pedidos online para el gastronómico del interior que quiere dejar de trabajar para otras apps.
            </p>
            <div className="flex gap-[10px] mt-4">
              <a href="#" className="w-9 h-9 rounded-[10px] bg-white/[.06] inline-flex items-center justify-center text-sm">IG</a>
              <a href="https://wa.me/541125077824" className="w-9 h-9 rounded-[10px] bg-white/[.06] inline-flex items-center justify-center text-sm">WA</a>
              <a href="mailto:hola@pedidosposta.com" className="w-9 h-9 rounded-[10px] bg-white/[.06] inline-flex items-center justify-center text-sm">@</a>
            </div>
          </div>

          {/* Producto */}
          <div>
            <h5 className="text-[13px] tracking-[.08em] uppercase m-0 mb-[14px]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Producto</h5>
            <a href="#features" className="block text-sm text-[var(--cream)]/65 py-1 hover:text-white">Funcionalidades</a>
            <a href="#pricing" className="block text-sm text-[var(--cream)]/65 py-1 hover:text-white">Precios</a>
            <a href="#faq" className="block text-sm text-[var(--cream)]/65 py-1 hover:text-white">FAQ</a>
          </div>

          {/* Soporte */}
          <div>
            <h5 className="text-[13px] tracking-[.08em] uppercase m-0 mb-[14px]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Soporte</h5>
            <a href="mailto:hola@pedidosposta.com" className="block text-sm text-[var(--cream)]/65 py-1 hover:text-white">hola@pedidosposta.com</a>
            <a href="https://wa.me/541125077824" className="block text-sm text-[var(--cream)]/65 py-1 hover:text-white">WhatsApp</a>
          </div>

          {/* Legal */}
          <div>
            <h5 className="text-[13px] tracking-[.08em] uppercase m-0 mb-[14px]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Legal</h5>
            <a href="#" className="block text-sm text-[var(--cream)]/65 py-1 hover:text-white">Privacidad</a>
            <a href="#" className="block text-sm text-[var(--cream)]/65 py-1 hover:text-white">Términos</a>
          </div>
        </div>

        <div className="flex justify-between border-t border-white/[.08] mt-10 pt-6 text-xs text-[var(--cream)]/50 flex-wrap gap-[10px]">
          <span>2026 PedidosPosta<span className="inline-block w-2 h-2 rounded-full bg-[var(--teal)] mx-1" /> Todos los derechos reservados.</span>
          <span>Hecho con 🧉 en Argentina</span>
        </div>
      </div>
    </footer>
  )
}
