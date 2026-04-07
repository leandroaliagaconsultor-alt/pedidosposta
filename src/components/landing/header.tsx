"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "Funcionalidades", href: "#features" },
  { label: "Como Funciona", href: "#how-it-works" },
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
          <a href="/" className="flex items-center gap-1.5">
            <span className="text-lg font-semibold text-foreground">Pedidos</span>
            <span className="text-lg font-semibold text-primary">Posta</span>
            <span className="text-primary text-xl">.</span>
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

        {/* Mobile menu */}
        {isMenuOpen && (
          <div id="mobile-nav" className="md:hidden pt-4 pb-3 border-t border-border/30 mt-3">
            <nav aria-label="Navegacion mobile" className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors py-2.5 text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border/30">
                <Link
                  href="/login"
                  className="w-full text-center py-2 text-sm border border-border/50 rounded-md text-foreground hover:bg-secondary transition-colors"
                >
                  Iniciar sesion
                </Link>
                <Link
                  href="/register"
                  className="w-full text-center py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Empezar ahora
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  )
}
