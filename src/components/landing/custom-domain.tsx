"use client"

import { Globe, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"

const domains = [
  { name: "www.burgerpro.com.ar", active: true },
  { name: "www.lafarola.com.ar", active: false },
  { name: "www.pizzeriaroma.com", active: false },
]

export function CustomDomain() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium mb-4">
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary">Feature Premium</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Tu propia tienda,
            <br />
            <span className="text-gradient">tu propia identidad.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Usa tu dominio propio. Tu cliente entra a www.tulocal.com.ar y ve tu marca, no la nuestra.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left — Browser mockup */}
          <div className="relative">
            {/* Outer glow frame */}
            <div className="relative rounded-2xl border border-white/10 bg-zinc-900/60 p-1.5 shadow-[0_0_60px_-15px_rgba(34,197,94,0.15)]">
              {/* Browser chrome */}
              <div className="bg-zinc-800/80 rounded-t-xl px-4 py-2.5 flex items-center gap-3">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                {/* URL bar */}
                <div className="flex-1 flex items-center gap-2 bg-zinc-900/80 rounded-lg px-3 py-1.5 border border-zinc-700/50">
                  <Lock className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-zinc-300 font-medium">www.burgerpro.com.ar</span>
                </div>
              </div>
              {/* Browser content */}
              <div className="bg-zinc-950 rounded-b-xl overflow-hidden">
                <img
                  src="/tienda.png"
                  alt="Tienda con dominio propio"
                  className="w-full aspect-[16/10] object-cover object-top"
                />
              </div>
            </div>

            {/* Floating domain cards */}
            <div className="absolute -right-4 top-6 space-y-2.5 hidden md:block">
              {domains.map((d) => (
                <div
                  key={d.name}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    d.active
                      ? "glass-strong border-primary/30 text-primary shadow-[0_0_20px_-5px_rgba(34,197,94,0.2)]"
                      : "glass text-zinc-400"
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 ${d.active ? "text-primary" : "text-zinc-600"}`} />
                  {d.name}
                  {d.active && (
                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Benefits */}
          <div className="space-y-6">
            <div className="space-y-4">
              {[
                {
                  title: "Tu dominio, cero marca nuestra",
                  desc: "Tu cliente ve www.tulocal.com.ar, no un subdominio generico. Profesionalismo total.",
                },
                {
                  title: "SSL incluido automaticamente",
                  desc: "Certificado HTTPS gratis. El candadito verde aparece sin que hagas nada.",
                },
                {
                  title: "Setup en 2 minutos",
                  desc: "Solo apunta tu dominio a nuestra IP y listo. Te guiamos paso a paso desde el panel.",
                },
                {
                  title: "SEO y redes sociales",
                  desc: "Google indexa tu dominio propio. Cuando compartas tu link en Instagram, se ve tu marca.",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">{i + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-0.5">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                Quiero mi propia tienda
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
