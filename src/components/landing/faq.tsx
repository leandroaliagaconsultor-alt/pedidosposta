"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "Cuanto tarda configurar mi tienda?",
    answer: "En promedio, 5 a 10 minutos. Subis tu menu (o lo cargas manual), personalizas colores y logo, y ya estas listo para recibir pedidos."
  },
  {
    question: "Puedo usar mi propio dominio?",
    answer: "Si, en el plan Pro podes conectar tu propio dominio (ej: pedidos.tumarca.com) sin costo adicional."
  },
  {
    question: "Como reciben los pagos mis clientes?",
    answer: "Podes aceptar efectivo, transferencia bancaria, o integrar MercadoPago para pagos con tarjeta. Todo configurable desde el panel."
  },
  {
    question: "Que pasa si supero los 50 pedidos del plan gratis?",
    answer: "Te avisamos cuando estes cerca del limite. Podes upgradear al plan Pro en cualquier momento sin perder datos ni configuracion."
  },
  {
    question: "Tienen soporte tecnico?",
    answer: "Si, todos los planes incluyen soporte. El plan Starter por email, Pro con respuesta prioritaria, y Business con account manager dedicado."
  },
  {
    question: "Puedo probarlo antes de pagar?",
    answer: "El plan Starter es gratis para siempre con hasta 50 pedidos/mes. Ademas, el plan Pro tiene 14 dias de prueba sin tarjeta."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 relative">
      <div className="max-w-2xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-primary text-sm font-medium mb-2">FAQ</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Preguntas frecuentes
          </h2>
          <p className="text-muted-foreground text-sm">
            Si no encontras tu respuesta, escribinos a soporte@pedidosposta.com
          </p>
        </div>

        {/* FAQ items */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`glass rounded-xl overflow-hidden transition-all ${
                openIndex === i ? "border-primary/30" : ""
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${
                openIndex === i ? "max-h-40" : "max-h-0"
              }`}>
                <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
