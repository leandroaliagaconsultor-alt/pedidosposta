"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Shield, ArrowRight, Zap } from "lucide-react"

const features = [
  "Pedidos ilimitados (0% comisiones)",
  "Dominio propio (www.tumarca.com.ar)",
  "Carga de menu automatizada con IA",
  "Panel de Live Orders en tiempo real",
  "Setup inicial bonificado (Te cargamos el menu nosotros)",
  "Soporte prioritario 24/7",
]

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section id="pricing" className="py-20 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 relative">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-primary text-sm font-medium mb-2">Precios</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Simple y transparente.
            <br />
            <span className="text-gradient">Sin letra chica.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Un solo plan con todo incluido. Todos los precios en ARS.
          </p>
        </div>

        {/* Toggle mensual / anual */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Mensual
          </span>
          <button
            type="button"
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isAnnual ? "bg-primary" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isAnnual ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Anual
          </span>
          {isAnnual && (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Ahorra 2 meses
            </span>
          )}
        </div>

        {/* Single premium card */}
        <div className="relative rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl p-8 md:p-10 shadow-[0_0_80px_-20px_rgba(34,197,94,0.12)]">
          {/* Trial badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <Zap className="w-3.5 h-3.5" />
              10 DIAS GRATIS
            </div>
          </div>

          {/* Plan header */}
          <div className="text-center mb-8 pt-2">
            <h3 className="text-2xl font-bold mb-1">Plan Full Commerce</h3>
            <p className="text-sm text-muted-foreground">
              Todo lo que necesitas para escalar tu local, sin comisiones.
            </p>
          </div>

          {/* Price */}
          <div className="text-center mb-8">
            {isAnnual ? (
              <div>
                <div className="mb-1">
                  <span className="text-base text-zinc-500 line-through">$720.000</span>
                </div>
                <span className="text-5xl font-extrabold tracking-tight">$600.000</span>
                <span className="text-muted-foreground text-sm ml-1">/ año</span>
                <p className="text-xs text-primary font-medium mt-2">
                  Equivale a $50.000/mes — te ahorras $120.000
                </p>
              </div>
            ) : (
              <div>
                <span className="text-5xl font-extrabold tracking-tight">$60.000</span>
                <span className="text-muted-foreground text-sm ml-1">/ mes</span>
              </div>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8 max-w-sm mx-auto">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/80">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 w-full max-w-sm rounded-full py-3.5 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.25)]"
            >
              Empezar mis 10 dias gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Guarantee */}
          <div className="mt-6 flex items-start gap-2.5 justify-center max-w-md mx-auto">
            <Shield className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-500 leading-relaxed text-center">
              Garantia de ROI: Si el primer mes no ahorras mas de $60.000 en comisiones comparado con las apps tradicionales, te devolvemos el 100% de tu dinero.
            </p>
          </div>
        </div>

        {/* Trust note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Cancela cuando quieras. Sin contratos. Sin sorpresas.
        </p>
      </div>
    </section>
  )
}
