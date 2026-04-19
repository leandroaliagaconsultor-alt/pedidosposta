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

          {/* Right - Phone mockup — fresh flat-lay scene */}
          <div className="relative flex justify-center lg:justify-end">
            {/* ── Scene container: warm surface ── */}
            <div className="relative w-[340px] md:w-[400px] py-10">

              {/* Warm surface gradient (simulates light wood / marble) */}
              <div
                className="absolute inset-0 rounded-[2rem] pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 50% 40%, rgba(250,245,235,0.08) 0%, rgba(250,245,235,0.03) 40%, transparent 70%)",
                }}
              />

              {/* ── Decorative food elements (flat-lay scatter) ── */}
              {/* Pepper grains */}
              <div className="absolute top-14 right-8 w-1.5 h-1.5 rounded-full bg-amber-900/30 pointer-events-none" />
              <div className="absolute top-20 right-14 w-1 h-1 rounded-full bg-amber-900/20 pointer-events-none" />
              <div className="absolute top-24 right-6 w-1 h-1.5 rounded-full bg-amber-800/25 pointer-events-none rotate-45" />
              <div className="absolute bottom-28 left-10 w-1.5 h-1 rounded-full bg-amber-900/20 pointer-events-none" />
              <div className="absolute bottom-20 left-6 w-1 h-1 rounded-full bg-amber-800/30 pointer-events-none" />

              {/* Herb leaves (rúcula) */}
              <div
                className="absolute top-8 left-4 w-8 h-3 rounded-full pointer-events-none rotate-[-25deg]"
                style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.08))" }}
              />
              <div
                className="absolute top-16 left-8 w-6 h-2.5 rounded-full pointer-events-none rotate-[15deg]"
                style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(34,197,94,0.06))" }}
              />
              <div
                className="absolute bottom-16 right-4 w-7 h-2.5 rounded-full pointer-events-none rotate-[40deg]"
                style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.13), rgba(34,197,94,0.07))" }}
              />
              <div
                className="absolute bottom-24 right-10 w-5 h-2 rounded-full pointer-events-none rotate-[-10deg]"
                style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.10), rgba(34,197,94,0.05))" }}
              />

              {/* Oil drizzle accent */}
              <div
                className="absolute top-32 right-3 w-4 h-4 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(234,179,8,0.08) 0%, transparent 70%)" }}
              />
              <div
                className="absolute bottom-32 left-3 w-5 h-5 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(234,179,8,0.06) 0%, transparent 70%)" }}
              />

              {/* ── 1. CONTENEDOR PADRE — relative, SIN overflow-hidden ── */}
              <div className="relative mx-auto w-[260px] md:w-[280px]">

                {/* Soft drop shadow on surface */}
                <div
                  className="absolute inset-x-4 -bottom-6 h-16 rounded-[50%] pointer-events-none"
                  style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.20) 0%, transparent 70%)", filter: "blur(12px)" }}
                />

                {/* ── 3. MARCO DEL TELÉFONO (Phone Frame) ── */}
                <div className="relative rounded-[3rem] bg-zinc-900 border border-zinc-700/50 p-[3px] shadow-2xl shadow-black/30">
                  {/* Bisel Interno oscuro */}
                  <div className="rounded-[2.7rem] border-[8px] border-zinc-950 bg-zinc-950">
                    {/* Dynamic Island */}
                    <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-[70px] h-[18px] bg-zinc-950 rounded-full z-20" />

                    {/* ── 4. LA PANTALLA — AQUÍ va overflow-hidden ── */}
                    <div className="relative aspect-[9/19.5] rounded-[2rem] overflow-hidden">

                      {/* ── 5. IMAGEN ── */}
                      <Image
                        src="/tienda.png"
                        alt="Tienda de ejemplo — Burger Pro"
                        fill
                        priority
                        sizes="(max-width: 768px) 260px, 280px"
                        className="object-cover object-top"
                      />

                      {/* Glass sheen */}
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 45%)" }}
                      />

                      {/* Top fade — esfuma contra la barra superior */}
                      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none z-10" />

                      {/* ── 5. DEGRADADO DE FUSIÓN — fade to black en la base ── */}
                      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-10" />

                      {/* Inner shadow — glass depth */}
                      <div className="absolute inset-0 rounded-[2rem] pointer-events-none z-10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4),inset_0_0_20px_rgba(0,0,0,0.15)]" />
                    </div>
                  </div>
                </div>

                {/* ── 2. TARJETAS FLOTANTES — FUERA del marco, dentro del padre ── */}

                {/* Notification card */}
                <div className="absolute -left-14 top-[26%] z-30 rounded-2xl p-4 max-w-[210px] animate-float bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12),0_12px_40px_-8px_rgba(0,0,0,0.08)] border border-zinc-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                      <span className="text-emerald-600 text-sm font-bold">+1</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-zinc-900">Nuevo pedido</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">2x Cuarto de Libra</p>
                      <p className="text-sm font-extrabold text-emerald-600 mt-1.5">$13.000</p>
                    </div>
                  </div>
                </div>

                {/* Delivery badge */}
                <div className="absolute -right-8 bottom-[22%] z-30 rounded-xl px-3.5 py-2.5 animate-float bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.10)] border border-zinc-100" style={{ animationDelay: "1.5s" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛵</span>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-900">Delivery activo</p>
                      <p className="text-[9px] text-emerald-600 font-semibold">3 pedidos en curso</p>
                    </div>
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
