"use client"

import { useState, useEffect, useCallback } from "react"
import { Package, ChefHat, Bike, CheckCircle2, Clock, MapPin, Phone, X, Receipt } from "lucide-react"

const STATUSES = ["pending", "preparing", "on_the_way", "delivered"] as const
type Status = (typeof STATUSES)[number]

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: "NUEVO", color: "text-emerald-400", bg: "bg-emerald-500/15 ring-emerald-500/30", icon: Package },
  preparing: { label: "PREPARANDO", color: "text-amber-400", bg: "bg-amber-500/15 ring-amber-500/30", icon: ChefHat },
  on_the_way: { label: "EN CAMINO", color: "text-sky-400", bg: "bg-sky-500/15 ring-sky-500/30", icon: Bike },
  delivered: { label: "ENTREGADO", color: "text-zinc-400", bg: "bg-zinc-500/15 ring-zinc-500/30", icon: CheckCircle2 },
}

const MOCK_ORDERS = [
  {
    id: 1,
    number: 47,
    name: "Maria Rodriguez",
    phone: "+54 9 221 555-1234",
    address: "Calle 22 N° 1207, entre 24 y 26",
    time: "Hace 2 min",
    method: "Delivery",
    payment: "MercadoPago",
    total: 18500,
    items: [
      { name: "Hamburguesa Clasica", qty: 2, price: 6500 },
      { name: "Papas Grandes", qty: 1, price: 3500 },
      { name: "Coca-Cola 1.5L", qty: 1, price: 2000 },
    ],
  },
  {
    id: 2,
    number: 48,
    name: "Juan Perez",
    phone: "+54 9 221 555-5678",
    address: "Retiro en local",
    time: "Hace 30 seg",
    method: "Take Away",
    payment: "Efectivo",
    total: 9800,
    items: [
      { name: "Pizza Muzzarella", qty: 1, price: 7800 },
      { name: "Faina", qty: 1, price: 2000 },
    ],
  },
]

export function DemoLiveOrders() {
  const [statuses, setStatuses] = useState<Record<number, Status>>({
    1: "pending",
    2: "pending",
  })
  const [receiptOrder, setReceiptOrder] = useState<(typeof MOCK_ORDERS)[0] | null>(null)
  const [cycleActive, setCycleActive] = useState(true)

  const advanceStatus = useCallback((orderId: number) => {
    setStatuses((prev) => {
      const current = prev[orderId]
      const idx = STATUSES.indexOf(current)
      if (idx < STATUSES.length - 1) {
        return { ...prev, [orderId]: STATUSES[idx + 1] }
      }
      return { ...prev, [orderId]: "pending" }
    })
  }, [])

  // Auto-cycle order 1
  useEffect(() => {
    if (!cycleActive) return
    const interval = setInterval(() => advanceStatus(1), 3000)
    return () => clearInterval(interval)
  }, [cycleActive, advanceStatus])

  // Auto-cycle order 2 offset
  useEffect(() => {
    if (!cycleActive) return
    const timeout = setTimeout(() => {
      const interval = setInterval(() => advanceStatus(2), 3000)
      return () => clearInterval(interval)
    }, 1500)
    return () => clearTimeout(timeout)
  }, [cycleActive, advanceStatus])

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium mb-4">
            <Package className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary">Demo Interactiva</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Toma el control de tus
            <br />
            <span className="text-gradient">pedidos en vivo.</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto">
            Asi se ve tu panel cuando llegan pedidos. Los estados cambian automaticamente o podes hacer clic para avanzarlos.
          </p>
        </div>

        {/* Demo panel */}
        <div className="max-w-3xl mx-auto">
          {/* Tab bar */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {(["pending", "preparing", "on_the_way", "delivered"] as Status[]).map((s) => {
              const cfg = STATUS_CONFIG[s]
              const Icon = cfg.icon
              const count = Object.values(statuses).filter((st) => st === s).length
              return (
                <div
                  key={s}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color} ring-1 ring-inset`}
                >
                  <Icon size={14} />
                  {cfg.label}
                  {count > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-white/10 text-[10px]">
                      {count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Order cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {MOCK_ORDERS.map((order) => {
              const status = statuses[order.id]
              const cfg = STATUS_CONFIG[status]
              const Icon = cfg.icon
              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border bg-zinc-900/40 backdrop-blur-md overflow-hidden transition-all duration-500 ${
                    status === "pending" ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-zinc-800"
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/80 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-zinc-300">#{order.number}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ring-1 ring-inset ${cfg.bg} ${cfg.color}`}>
                        <Icon size={10} />
                        {cfg.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{order.time}</span>
                  </div>

                  {/* Card body */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      {order.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <MapPin size={11} />
                      {order.address}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock size={11} />
                      {order.method} · {order.payment}
                    </div>

                    {/* Items */}
                    <div className="border-t border-zinc-800/50 pt-2 space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-zinc-400">{item.qty}x {item.name}</span>
                          <span className="text-zinc-500 font-mono">${item.price.toLocaleString("es-AR")}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50">
                      <span className="text-lg font-black text-primary font-mono">${order.total.toLocaleString("es-AR")}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReceiptOrder(order)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-400 bg-amber-500/10 ring-1 ring-inset ring-amber-500/20 hover:bg-amber-500/20 transition"
                        >
                          Ver Recibo
                        </button>
                        <button
                          onClick={() => { setCycleActive(false); advanceStatus(order.id); }}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-primary bg-primary/10 ring-1 ring-inset ring-primary/20 hover:bg-primary/20 transition"
                        >
                          Avanzar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Receipt modal */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setReceiptOrder(null)}>
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt size={16} className="text-amber-400" />
                Recibo Digital
              </h3>
              <button onClick={() => setReceiptOrder(null)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="text-center border-b border-dashed border-zinc-800 pb-3">
                <p className="text-sm font-bold text-white">PEDIDOSPOSTA</p>
                <p className="text-zinc-500">Pedido #{receiptOrder.number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-400">Cliente: <span className="text-white">{receiptOrder.name}</span></p>
                <p className="text-zinc-400">Tel: <span className="text-white">{receiptOrder.phone}</span></p>
                <p className="text-zinc-400">Direccion: <span className="text-white">{receiptOrder.address}</span></p>
              </div>
              <div className="border-t border-dashed border-zinc-800 pt-3 space-y-1.5">
                {receiptOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-zinc-300">{item.qty}x {item.name}</span>
                    <span className="text-zinc-400">${(item.price * item.qty).toLocaleString("es-AR")}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-zinc-800 pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-white">TOTAL</span>
                <span className="text-lg font-black text-primary">${receiptOrder.total.toLocaleString("es-AR")}</span>
              </div>
              <div className="text-center text-zinc-600 pt-2">
                <p>Pago: {receiptOrder.payment}</p>
                <p>Gracias por tu compra!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
