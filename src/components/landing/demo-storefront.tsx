"use client"

import { useState } from "react"
import { ShoppingCart, Plus, MapPin, Bike, Store, ChevronRight, Star, Minus, X, Check } from "lucide-react"

type Screen = "menu" | "product" | "cart" | "checkout"

const PRODUCTS = [
  { id: 1, name: "Cuarto de Libra", desc: "Carne 125g, cheddar, cebolla, pepinillo", price: 7200, rating: 4.9, emoji: "🍔" },
  { id: 2, name: "Big Burger Doble", desc: "Doble carne, lechuga, tomate, salsa especial", price: 9500, rating: 4.8, emoji: "🍔" },
  { id: 3, name: "Papas Cheddar Bacon", desc: "Papas fritas, cheddar fundido, panceta", price: 5200, rating: 4.7, emoji: "🍟" },
  { id: 4, name: "Nuggets x10", desc: "Nuggets de pollo con salsa BBQ", price: 6100, rating: 4.6, emoji: "🍗" },
  { id: 5, name: "Coca-Cola 1.5L", desc: "Coca-Cola original", price: 2800, rating: 4.5, emoji: "🥤" },
  { id: 6, name: "Brownie con Helado", desc: "Brownie tibio, helado de vainilla", price: 4800, rating: 4.9, emoji: "🍫" },
]

const CATEGORIES = ["Burgers", "Acompañamientos", "Bebidas", "Postres"]

export function DemoStorefront() {
  const [screen, setScreen] = useState<Screen>("menu")
  const [cartItems, setCartItems] = useState<{ id: number; qty: number }[]>([])
  const [showAddAnim, setShowAddAnim] = useState(false)
  const [deliveryMode, setDeliveryMode] = useState<"delivery" | "takeaway">("delivery")

  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0)
  const subtotal = cartItems.reduce((acc, item) => {
    const product = PRODUCTS.find((p) => p.id === item.id)
    return acc + (product?.price || 0) * item.qty
  }, 0)

  const addToCart = (productId: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === productId)
      if (existing) return prev.map((i) => (i.id === productId ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { id: productId, qty: 1 }]
    })
    setShowAddAnim(true)
    setTimeout(() => setShowAddAnim(false), 600)
  }

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === productId)
      if (!existing) return prev
      if (existing.qty <= 1) return prev.filter((i) => i.id !== productId)
      return prev.map((i) => (i.id === productId ? { ...i, qty: i.qty - 1 } : i))
    })
  }

  const handleStep = (step: number) => {
    if (step === 1) {
      setScreen("menu")
    } else if (step === 2) {
      setScreen("menu")
      setTimeout(() => {
        addToCart(1) // Cuarto de Libra
        setScreen("menu")
      }, 200)
    } else if (step === 3) {
      if (cartItems.length === 0) addToCart(1)
      setScreen("checkout")
    }
  }

  // ── Phone Screen Content ───────────────────────────────────────────
  const renderScreen = () => {
    if (screen === "checkout") {
      return (
        <div className="h-full flex flex-col bg-[#09090b]">
          {/* Checkout header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
            <button onClick={() => setScreen("menu")} className="text-zinc-400">
              <ChevronRight size={16} className="rotate-180" />
            </button>
            <span className="text-xs font-bold text-white">Finalizar Pedido</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Delivery toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeliveryMode("delivery")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                  deliveryMode === "delivery" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                <Bike size={12} /> Delivery
              </button>
              <button
                onClick={() => setDeliveryMode("takeaway")}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                  deliveryMode === "takeaway" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                <Store size={12} /> Retiro
              </button>
            </div>

            {/* Address */}
            {deliveryMode === "delivery" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-zinc-400">Dirección de entrega</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700">
                  <MapPin size={12} className="text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-white">Calle 13 N° 34, Mercedes, Buenos Aires</span>
                </div>
              </div>
            )}

            {/* Order items */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-zinc-400">Tu pedido</label>
              <div className="rounded-xl border border-zinc-800 divide-y divide-zinc-800/50">
                {cartItems.map((item) => {
                  const product = PRODUCTS.find((p) => p.id === item.id)
                  if (!product) return null
                  return (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">{product.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-white truncate">{product.name}</p>
                          <p className="text-[10px] text-zinc-500">{item.qty}x ${product.price.toLocaleString("es-AR")}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-white shrink-0">
                        ${(product.price * item.qty).toLocaleString("es-AR")}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Costs breakdown */}
            <div className="rounded-xl border border-zinc-800 px-3 py-2.5 space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-400">Subtotal</span>
                <span className="text-zinc-300">${subtotal.toLocaleString("es-AR")}</span>
              </div>
              {deliveryMode === "delivery" && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-400">Envío (2.1 km)</span>
                  <span className="text-zinc-300">$1.250</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-zinc-800">
                <span className="text-white">Total</span>
                <span className="text-emerald-400">
                  ${(subtotal + (deliveryMode === "delivery" ? 1250 : 0)).toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-zinc-400">Método de pago</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-emerald-500/30">
                <div className="w-5 h-5 rounded-md bg-sky-500 flex items-center justify-center text-[8px] font-black text-white">MP</div>
                <span className="text-[11px] text-white font-medium">MercadoPago</span>
                <Check size={12} className="text-emerald-400 ml-auto" />
              </div>
            </div>
          </div>

          {/* Checkout CTA */}
          <div className="px-4 pb-4 pt-2">
            <div className="rounded-xl bg-emerald-500 py-3 text-center text-[11px] font-black text-white uppercase tracking-wider">
              Confirmar Pedido · ${(subtotal + (deliveryMode === "delivery" ? 1250 : 0)).toLocaleString("es-AR")}
            </div>
          </div>
        </div>
      )
    }

    // ── Menu Screen ────────────────────────────────────────────────────
    return (
      <div className="h-full flex flex-col bg-[#09090b]">
        {/* Store header */}
        <div className="relative h-24 overflow-hidden bg-gradient-to-b from-emerald-500/20 to-transparent">
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">
              BP
            </div>
            <div>
              <p className="text-xs font-bold text-white">Burger Pro</p>
              <p className="text-[9px] text-zinc-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Abierto ahora
              </p>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-3 py-2 border-b border-zinc-800 overflow-x-auto">
          {CATEGORIES.map((cat, i) => (
            <span
              key={cat}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold whitespace-nowrap ${
                i === 0 ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {PRODUCTS.map((product) => {
            const inCart = cartItems.find((i) => i.id === product.id)
            return (
              <div key={product.id} className="flex gap-2.5 p-2 rounded-xl border border-zinc-800 bg-zinc-900/40">
                <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center text-xl shrink-0">
                  {product.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">{product.name}</p>
                  <p className="text-[9px] text-zinc-500 truncate">{product.desc}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-black text-emerald-400">
                      ${product.price.toLocaleString("es-AR")}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star size={9} className="fill-amber-400 text-amber-400" />
                      <span className="text-[9px] text-zinc-500">{product.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  {inCart ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-[10px] font-bold text-white w-4 text-center">{inCart.qty}</span>
                      <button
                        onClick={() => addToCart(product.id)}
                        className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product.id)}
                      className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Floating cart */}
        {totalItems > 0 && (
          <div className="px-3 pb-3 pt-1">
            <button
              onClick={() => setScreen("checkout")}
              className="w-full flex items-center justify-between rounded-xl bg-emerald-500 px-4 py-3 transition-all hover:bg-emerald-600"
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ShoppingCart size={14} className="text-white" />
                  <span className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-white text-emerald-600 text-[8px] font-black flex items-center justify-center ${showAddAnim ? "animate-bounce" : ""}`}>
                    {totalItems}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-white">Ver carrito</span>
              </div>
              <span className="text-[11px] font-black text-white">${subtotal.toLocaleString("es-AR")}</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  const steps = [
    {
      num: 1,
      label: "Ver Mi Menú",
      desc: "Grilla de productos con precios",
      active: screen === "menu" && cartItems.length === 0,
    },
    {
      num: 2,
      label: "Agregar un Cuarto de Libra",
      desc: "Simula un cliente agregando al carrito",
      active: screen === "menu" && cartItems.length > 0,
    },
    {
      num: 3,
      label: "Ir al Checkout",
      desc: "Dirección, envío y método de pago",
      active: screen === "checkout",
    },
  ]

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium mb-4">
            <ShoppingCart className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary">Experiencia de Compra</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Probá el menú y el checkout
            <br />
            <span className="text-gradient">dinámico en vivo.</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto">
            Así ven tus clientes tu tienda. Tocá los botones y mirá cómo reacciona en tiempo real.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
          {/* Left — Controls */}
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2">Controles</p>

            {steps.map((step) => (
              <button
                key={step.num}
                onClick={() => handleStep(step.num)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  step.active
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                    : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                    step.active ? "bg-primary text-zinc-950" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {step.num}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${step.active ? "text-white" : "text-zinc-300"}`}>{step.label}</p>
                  <p className="text-[11px] text-zinc-500">{step.desc}</p>
                </div>
                <ChevronRight size={16} className={`ml-auto shrink-0 ${step.active ? "text-primary" : "text-zinc-600"}`} />
              </button>
            ))}

            {/* Reset */}
            {cartItems.length > 0 && (
              <button
                onClick={() => {
                  setCartItems([])
                  setScreen("menu")
                }}
                className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-1"
              >
                <X size={12} />
                Reiniciar demo
              </button>
            )}

            {/* Info */}
            <p className="text-[10px] text-zinc-600 px-1">
              También podés interactuar directamente con el celular: tocá productos, cambiá cantidades o explorá el checkout.
            </p>
          </div>

          {/* Right — Phone mockup */}
          <div className="flex justify-center">
            <div className="relative">
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-3 text-center">Vista en Vivo</p>
              <div className="relative w-[280px] md:w-[300px]">
                <div className="rounded-[2.5rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-800 rounded-b-2xl z-10" />
                  {/* Screen */}
                  <div className="h-[580px] overflow-hidden">
                    {renderScreen()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
