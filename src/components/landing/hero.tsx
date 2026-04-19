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

          {/* Right - Phone mockup with store (3D floating) */}
          <div className="relative flex justify-center lg:justify-end [perspective:1200px]">
            <div
              className="relative w-[280px] md:w-[320px]"
              style={{ transform: "rotateY(-6deg) rotateX(2deg)" }}
            >
              {/* ── Layer 0: Projected shadow (levitation) ── */}
              <div
                className="absolute inset-x-6 -bottom-8 h-24 rounded-[50%] pointer-events-none"
                style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.45) 0%, transparent 70%)", filter: "blur(18px)" }}
              />

              {/* ── Layer 1: Ambient glow (green, from left light source) ── */}
              <div className="absolute -inset-12 pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 40%, rgba(34,197,94,0.18) 0%, transparent 65%)" }} />

              {/* ── Layer 2: Phone frame ── */}
              <div className="relative rounded-[2.5rem] bg-zinc-900 p-[6px] shadow-2xl shadow-black/60 ring-1 ring-white/[0.06]">

                {/* Rim light — left edge green (light source interaction) */}
                <div
                  className="absolute -left-px top-12 bottom-12 w-[2px] rounded-full pointer-events-none z-30"
                  style={{ background: "linear-gradient(to bottom, transparent, rgba(34,197,94,0.5) 30%, rgba(34,197,94,0.6) 50%, rgba(34,197,94,0.4) 70%, transparent)" }}
                />

                {/* Inner bezel */}
                <div className="relative rounded-[2rem] bg-black overflow-hidden ring-1 ring-white/[0.04]">
                  {/* Dynamic Island */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-full z-20 ring-1 ring-white/[0.06]" />

                  {/* Screen content */}
                  <div className="relative aspect-[9/19.5] overflow-hidden">
                    <Image
                      src="/tienda.png"
                      alt="Tienda de ejemplo — Burger Pro"
                      fill
                      priority
                      sizes="(max-width: 768px) 280px, 320px"
                      className="object-cover object-top"
                    />

                    {/* Glass gloss / sheen (diagonal highlight across screen) */}
                    <div
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{ background: "linear-gradient(125deg, rgba(255,255,255,0.07) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)" }}
                    />

                    {/* Screen bottom fade */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Side buttons */}
                <div className="absolute -left-[2px] top-28 w-[3px] h-8 bg-zinc-700 rounded-l-sm" />
                <div className="absolute -left-[2px] top-40 w-[3px] h-14 bg-zinc-700 rounded-l-sm" />
                <div className="absolute -right-[2px] top-36 w-[3px] h-12 bg-zinc-700 rounded-r-sm" />
              </div>

              {/* ── Layer 3: Top reflection (specular highlight) ── */}
              <div
                className="absolute -inset-px rounded-[2.5rem] pointer-events-none"
                style={{
                  background: "linear-gradient(170deg, rgba(255,255,255,0.10) 0%, transparent 35%)",
                  maskImage: "linear-gradient(to bottom, black 0%, transparent 40%)",
                  WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 40%)",
                }}
              />

              {/* ── Layer 4: Floating notification (glassmorphism) ── */}
              <div className="absolute -left-12 top-[28%] rounded-2xl p-4 max-w-[200px] animate-float shadow-[0_8px_40px_-12px_rgba(0,0,0,0.7)]"
                style={{
                  background: "rgba(0,0,0,0.40)",
                  backdropFilter: "blur(24px) saturate(1.4)",
                  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                  border: "1px solid rgba(34,197,94,0.20)",
                  transform: "rotateY(6deg) rotateX(-2deg)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.30)" }}>
                    <span className="text-white text-sm font-bold">+1</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">Nuevo pedido</p>
                    <p className="text-[10px] text-white/70 mt-0.5">2x Cuarto de Libra</p>
                    <p className="text-xs font-bold text-white mt-1.5">$13.000</p>
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
