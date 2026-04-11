"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "Funcionalidades", href: "#features" },
  { label: "Precios", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-bold">
      Saltar al contenido
    </a>
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div
        className={`max-w-6xl mx-auto rounded-2xl px-4 py-2.5 transition-all duration-300 ${
          scrolled ? "glass-strong shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="PedidosPosta"
              width={220}
              height={48}
              className="h-12 w-auto object-contain"
              priority
            />
          </a>

          {/* Desktop Nav */}
          <nav aria-label="Navegacion principal" className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
            >
              Iniciar sesion
            </Link>
            <Link
              href="/register"
              className="rounded-full px-5 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
              Empezar ahora
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label="Menu de navegacion"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile menu — outside glass container, solid bg */}
      {isMenuOpen && (
        <div id="mobile-nav" className="md:hidden absolute top-full left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800 shadow-2xl">
          <nav aria-label="Navegacion mobile" className="flex flex-col gap-1 px-6 py-5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-zinc-300 hover:text-white transition-colors py-3 text-sm font-medium border-b border-zinc-800/50 last:border-0"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-5 mt-3 border-t border-zinc-800">
              <Link
                href="/login"
                className="w-full text-center py-3 text-sm font-medium border border-zinc-700 rounded-xl text-zinc-300 hover:bg-zinc-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar sesion
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-3 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Empezar ahora
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
    </>
  )
}
