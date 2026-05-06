"use client"

import Link from "next/link"
import { trackLead } from "@/lib/analytics/meta-pixel"

export function Header() {
  return (
    <div className="sticky top-0 z-50 bg-[var(--cream)] border-b border-[var(--line)]">
      <div className="max-w-[1280px] mx-auto px-7 max-sm:px-[18px] flex items-center justify-between h-[68px]">
        <Link href="/" className="flex items-center">
          <span className="text-[22px] tracking-tight text-[var(--plomo)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Pedidos</span>
          <span className="text-[22px] tracking-tight text-[var(--ink)]" style={{ fontFamily: "var(--font-display), sans-serif" }}>Posta</span>
          <span className="inline-block w-[10px] h-[10px] rounded-full bg-[var(--teal)] ml-[2px]" />
        </Link>

        <nav className="hidden md:flex gap-[34px]">
          <a href="#problema" className="text-sm font-medium text-[var(--ink)] opacity-70 hover:opacity-100 transition-opacity">El problema</a>
          <a href="#features" className="text-sm font-medium text-[var(--ink)] opacity-70 hover:opacity-100 transition-opacity">Funcionalidades</a>
          <a href="#pricing" className="text-sm font-medium text-[var(--ink)] opacity-70 hover:opacity-100 transition-opacity">Precios</a>
          <a href="#faq" className="text-sm font-medium text-[var(--ink)] opacity-70 hover:opacity-100 transition-opacity">FAQ</a>
        </nav>

        <div className="flex gap-[10px] items-center">
          <Link href="/login" className="hidden sm:inline-flex text-sm font-bold text-[var(--ink)] opacity-70 hover:opacity-100 px-5 py-3">
            Iniciar sesión
          </Link>
          <Link href="/register" onClick={() => trackLead("navbar")} className="inline-flex items-center px-5 py-3 rounded-full font-bold text-sm bg-[var(--teal)] text-white shadow-[0_1px_0_rgba(0,0,0,.08),0_8px_22px_-10px_rgba(67,146,106,.7)] hover:translate-y-[-1px] hover:shadow-[0_2px_0_rgba(0,0,0,.08),0_12px_26px_-10px_rgba(67,146,106,.8)] transition-all">
            Empezar ahora
          </Link>
        </div>
      </div>
    </div>
  )
}
