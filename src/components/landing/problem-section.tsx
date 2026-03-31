"use client"

import { MessageCircle, Clock, AlertTriangle, Ban, Mic, CheckCheck } from "lucide-react"

const painPoints = [
  { icon: MessageCircle, text: "Pedidos perdidos en el scroll infinito" },
  { icon: Clock, text: "Audios de 2 minutos para pedir una pizza" },
  { icon: AlertTriangle, text: "Errores de interpretacion constantes" },
  { icon: Ban, text: "Sin historial ni metricas de ventas" },
]

const chatList = [
  { name: "Maria Rodriguez", message: "Hola quiero pedir", time: "23:45", unread: 3, urgent: true },
  { name: "Juan Perez", message: "Audio (0:47)", time: "23:42", unread: 1, isAudio: true },
  { name: "Carla Gomez", message: "me pasas el menu??", time: "23:38", unread: 2 },
  { name: "Pedro Martinez", message: "hola estas?", time: "23:35", unread: 5, urgent: true },
  { name: "Laura Sanchez", message: "Audio (1:23)", time: "23:30", isAudio: true },
  { name: "Diego Fernandez", message: "quiero 2 hamburguesas", time: "23:28", unread: 1 },
  { name: "Ana Lopez", message: "cuanto sale el envio?", time: "23:25", unread: 4 },
  { name: "Martin Silva", message: "??", time: "23:20", unread: 2, urgent: true },
  { name: "Sofia Torres", message: "Audio (0:34)", time: "23:15", isAudio: true },
  { name: "Lucas Diaz", message: "todavia estan abiertos?", time: "23:10" },
]

const openChat = {
  name: "Maria Rodriguez",
  messages: [
    { text: "Hola", time: "23:40", sent: false },
    { text: "Quiero hacer un pedido", time: "23:40", sent: false },
    { text: "Tienen delivery?", time: "23:41", sent: false },
    { text: "Audio (0:52)", time: "23:42", sent: false, isAudio: true },
    { text: "Para la calle 24 entre 15 y 16", time: "23:43", sent: false },
    { text: "Quiero una clasica", time: "23:43", sent: false },
    { text: "Con cheddar extra", time: "23:44", sent: false },
    { text: "Y papas grandes", time: "23:44", sent: false },
    { text: "Audio (0:23)", time: "23:44", sent: false, isAudio: true },
    { text: "Ah y una coca", time: "23:45", sent: false },
    { text: "De litro", time: "23:45", sent: false },
    { text: "Cuanto sale todo?", time: "23:45", sent: false },
    { text: "??", time: "23:47", sent: false },
    { text: "Hola?", time: "23:50", sent: false },
  ]
}

export function ProblemSection() {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-primary text-sm font-medium mb-2">El Problema</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-balance">
            Esto pasa cuando usas WhatsApp
            <br />
            <span className="text-muted-foreground">para recibir pedidos</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* WhatsApp simulation */}
          <div className="glass rounded-2xl overflow-hidden max-w-md mx-auto lg:mx-0">
            {/* WhatsApp header */}
            <div className="bg-[#075e54] px-4 py-3 flex items-center justify-between">
              <span className="text-white font-medium text-sm">WhatsApp Business</span>
              <div className="flex items-center gap-1">
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">32</span>
              </div>
            </div>

            {/* Chat list */}
            <div className="bg-[#111b21] max-h-[400px] overflow-y-auto">
              {chatList.map((chat, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-[#222d34] hover:bg-[#202c33] transition-colors ${
                    chat.urgent ? "bg-[#1a2c25]" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center shrink-0">
                    <span className="text-[#8696a0] text-sm font-medium">
                      {chat.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[#e9edef] text-sm font-medium truncate">{chat.name}</span>
                      <span className={`text-[10px] ${chat.unread ? "text-[#00a884]" : "text-[#8696a0]"}`}>
                        {chat.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1.5 text-[#8696a0] text-xs truncate">
                        {chat.isAudio && <Mic className="w-3 h-3 text-[#00a884]" />}
                        <span className="truncate">{chat.message}</span>
                      </div>
                      {chat.unread && (
                        <span className="bg-[#00a884] text-[#111b21] text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-medium">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open chat + Pain points */}
          <div className="space-y-6">
            {/* Open chat simulation */}
            <div className="glass rounded-2xl overflow-hidden">
              {/* Chat header */}
              <div className="bg-[#202c33] px-4 py-2.5 flex items-center gap-3 border-b border-[#222d34]">
                <div className="w-8 h-8 rounded-full bg-[#2a3942] flex items-center justify-center">
                  <span className="text-[#8696a0] text-xs font-medium">MR</span>
                </div>
                <div>
                  <p className="text-[#e9edef] text-sm font-medium">{openChat.name}</p>
                  <p className="text-[#8696a0] text-[10px]">en linea</p>
                </div>
              </div>

              {/* Messages */}
              <div className="bg-[#0b141a] p-3 max-h-[280px] overflow-y-auto space-y-1">
                {openChat.messages.map((msg, i) => (
                  <div key={i} className="flex justify-start">
                    <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${
                      msg.sent ? "bg-[#005c4b]" : "bg-[#202c33]"
                    }`}>
                      {msg.isAudio ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center">
                            <Mic className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex gap-0.5">
                              {[8, 12, 6, 14, 10, 8, 16, 7, 11, 9, 13, 8].map((h, j) => (
                                <div
                                  key={j}
                                  className="w-0.5 bg-[#8696a0] rounded-full"
                                  style={{ height: `${h}px` }}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-[#8696a0] ml-1">{msg.text.match(/\((.*?)\)/)?.[1]}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#e9edef] text-xs">{msg.text}</p>
                      )}
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className="text-[8px] text-[#8696a0]">{msg.time}</span>
                        {msg.sent && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pain points */}
            <div className="grid grid-cols-2 gap-3">
              {painPoints.map((point, i) => (
                <div key={i} className="glass rounded-xl p-3 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <point.icon className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{point.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
