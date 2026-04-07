"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "¿Cobran comision por los pedidos o envios?",
    answer: "No. A diferencia de las apps tradicionales, en PedidosPosta cobramos 0% de comision por venta. Solo pagas tu suscripcion mensual fija. Todo lo que vendas, es 100% tuyo."
  },
  {
    question: "¿Como funcionan los 10 dias gratis?",
    answer: "Te registras y empezas a usar el sistema completo al instante, sin poner tarjeta de credito. Tenes 10 dias para recibir pedidos, probar el panel y ver como te facilita la vida. Recien cuando se cumple el plazo, decidis si queres pagar la suscripcion."
  },
  {
    question: "¿Como me pagan mis clientes?",
    answer: "Tus clientes te pagan directamente a vos. Podes configurar pagos en Efectivo, Transferencia Bancaria o conectar tu propio MercadoPago. Nosotros nunca tocamos tu dinero ni lo retenemos 15 dias."
  },
  {
    question: "¿Puedo usar mi propio dominio (www.mimarca.com.ar)?",
    answer: "Si! Tu suscripcion incluye la conexion de tu propio dominio personalizado. Vos compras el dominio (ej. en Nic.ar) y nosotros te damos un instructivo super simple para conectarlo a tu tienda en 5 minutos, con certificado de seguridad (HTTPS) incluido."
  },
  {
    question: "No tengo tiempo de cargar todos mis productos, ¿me ayudan?",
    answer: "Totalmente! Sabemos que estas a mil en el local. Tu plan incluye Setup Bonificado. Nos pasas tu menu por WhatsApp o PDF y nuestro equipo te lo deja cargado y listo para empezar a vender."
  }
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
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
                aria-expanded={openIndex === i}
                aria-controls={`faq-answer-${i}`}
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

              <div
                id={`faq-answer-${i}`}
                role="region"
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-60" : "max-h-0"
                }`}
              >
                <p className="px-4 pb-4 text-sm text-zinc-400 leading-relaxed">
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
