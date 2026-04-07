"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { BlurredInfiniteSlider } from "@/components/ui/infinite-slider"

const RESTAURANTS = [
  "BURGER BROS",
  "LA FAROLA",
  "LA COCINA EXPRESS",
  "PIZZERIA ROMA",
  "PANCHO PREMIUM",
  "CERVECERIA BARRACA",
  "SANTORINI EMPANADAS",
  "PARRILLA DON JULIO",
  "TACO LOCO",
  "HELADOS CHIVILCOY",
]

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

            {/* CTA */}
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full px-6 h-11 font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                Empezar mis 10 dias gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>0% Comisiones</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>Setup en 5 minutos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>Sin tarjeta de credito</span>
              </div>
            </div>
          </div>

          {/* Right - Phone mockup with store */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[280px] md:w-[320px]">
              {/* Phone frame with premium glow */}
              <div className="relative rounded-3xl border border-white/10 p-2 bg-zinc-900/80 shadow-[0_0_80px_-20px_rgba(34,197,94,0.2)]">
                <div className="relative rounded-[2rem] border-[6px] border-zinc-800 bg-zinc-900 overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-800 rounded-b-2xl z-10" />

                  {/* Screen content - Store page */}
                  <div className="relative aspect-[9/19.5] overflow-hidden">
                    <Image
                      src="/tienda.png"
                      alt="Tienda de ejemplo - Catalogo de productos"
                      fill
                      priority
                      sizes="(max-width: 768px) 280px, 320px"
                      className="rounded-2xl object-cover object-top"
                    />
                  </div>
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

        {/* Logo cloud marquee */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <div className="flex flex-col items-center md:flex-row">
            <div className="flex-shrink-0 text-center md:text-right md:max-w-44 md:border-r md:border-border/30 md:pr-6 mb-4 md:mb-0">
              <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
                Ya confian en nosotros
              </p>
            </div>
            <div className="w-full md:w-auto md:flex-1">
              <BlurredInfiniteSlider
                speedOnHover={20}
                speed={40}
                gap={80}
                fadeWidth={80}
              >
                {RESTAURANTS.map((name) => (
                  <div key={name} className="flex items-center shrink-0">
                    <span className="text-lg font-black text-zinc-500 whitespace-nowrap tracking-wide">
                      {name}
                    </span>
                  </div>
                ))}
              </BlurredInfiniteSlider>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
