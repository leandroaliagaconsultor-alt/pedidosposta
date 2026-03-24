"use client";

import React from "react";
import { ArrowRight, Zap, Ban, CheckCircle2, Smartphone, HelpCircle } from "lucide-react";

export default function LandingPage() {
    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white selection:bg-[#FF5A00] selection:text-white">
            {/* ─── IMPORTACIÓN DE FUENTE PREMIUM (Syne & Inter) ─── */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;800&family=Inter:wght@400;500&display=swap');
        
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        
        /* Textura de ruido (Grain) para un look orgánico/premium */
        .bg-grain {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        /* Animación flotante personalizada */
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 6s ease-in-out 3s infinite; }
      `}} />

            {/* Capa de Ruido y Glow de fondo */}
            <div className="bg-grain pointer-events-none"></div>
            <div className="absolute -top-[20%] left-[20%] z-0 h-[500px] w-[500px] rounded-full bg-[#FF5A00] opacity-20 blur-[120px]"></div>

            {/* ─── NAVBAR MINIMALISTA ─── */}
            <nav className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-5 md:px-12">
                <div className="font-display text-2xl font-extrabold tracking-tighter">
                    Pedidos<span className="text-[#FF5A00]">Posta.</span>
                </div>
                <div className="flex items-center gap-6 font-body text-sm font-medium">
                    <a href="#demo" className="hidden text-zinc-400 transition-colors hover:text-white md:block">Ver Demo</a>
                    <a href="#pricing" className="hidden text-zinc-400 transition-colors hover:text-white md:block">Precios</a>
                    <button className="rounded-full bg-white px-5 py-2.5 text-black transition-transform hover:scale-105 active:scale-95">
                        Ingresar
                    </button>
                </div>
            </nav>

            {/* ─── HERO SECTION (ASIMÉTRICO Y AGRESIVO) ─── */}
            <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-between gap-16 px-6 pt-20 pb-32 lg:flex-row lg:px-12 lg:pt-32">

                {/* Columna Izquierda: Copywriting de Guerra */}
                <div className="flex max-w-2xl flex-col items-start text-left lg:w-1/2">

                    {/* Badge */}
                    <div className="mb-6 flex items-center gap-2 rounded-full border border-[#FF5A00]/30 bg-[#FF5A00]/10 px-4 py-1.5 font-body text-xs font-semibold text-[#FF5A00] backdrop-blur-md">
                        <Zap size={14} fill="currentColor" />
                        <span>El fin de los audios de WhatsApp los viernes a la noche.</span>
                    </div>

                    {/* Título Principal */}
                    <h1 className="font-display text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl">
                        Tu local merece <br />
                        algo mejor que <br />
                        <span className="relative inline-block text-zinc-600 line-through decoration-red-500/80 decoration-[4px] opacity-70">
                            WhatsApp
                        </span>
                    </h1>

                    {/* Subtítulo */}
                    <p className="font-body mt-8 max-w-lg text-lg leading-relaxed text-zinc-400">
                        Olvidate de los sistemas prehistóricos y de regalarle el 30% a las apps de delivery.
                        <strong className="text-white font-medium"> PedidosPosta</strong> es tu propio sistema premium: checkout ultra-rápido, gestión en vivo y <span className="text-emerald-400">cero comisiones</span>.
                    </p>

                    {/* CTA & Oferta */}
                    <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <button className="group flex items-center gap-3 rounded-full bg-[#FF5A00] px-8 py-4 font-body text-base font-bold text-black shadow-[0_0_40px_-10px_#FF5A00] transition-all hover:scale-105 hover:shadow-[0_0_60px_-15px_#FF5A00] active:scale-95">
                            Probar 7 días Gratis
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </button>
                        <div className="flex flex-col text-left font-body text-xs text-zinc-500 sm:ml-4">
                            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-[#FF5A00]" /> Configurás hoy, vendés esta noche.</span>
                            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-[#FF5A00]" /> Luego <strong className="text-zinc-300">$99.999 ARS/mes</strong> final. TODO incluido.</span>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Composición Visual (Mockups Flotantes) */}
                <div className="relative w-full lg:w-1/2 flex justify-center lg:justify-end">
                    {/* Círculo decorativo */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-white/5 bg-zinc-900/20 backdrop-blur-3xl"></div>

                    {/* Card Flotante 1: Problema */}
                    <div className="animate-float absolute -left-4 top-10 z-20 flex w-64 flex-col gap-2 rounded-2xl border border-red-500/20 bg-black/60 p-4 shadow-2xl backdrop-blur-xl md:-left-12">
                        <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                            <Ban size={14} /> AUDIO DE WHATSAPP (0:45)
                        </div>
                        <p className="font-body text-sm text-zinc-300">"Hola máster, mandame 3 promos, una sin tomate, y te transfiero pero a nombre de mi novia..."</p>
                    </div>

                    {/* Teléfono Mockup Principal */}
                    <div className="relative z-10 h-[550px] w-[280px] rounded-[2.5rem] border-[6px] border-zinc-800 bg-[#0a0a0b] p-2 shadow-2xl">
                        {/* Notch */}
                        <div className="mx-auto h-4 w-20 rounded-b-xl bg-zinc-800"></div>
                        {/* Pantalla App (Checkout de PedidosPosta) */}
                        <div className="mt-4 flex flex-col gap-4 px-3">
                            <div className="h-20 w-full rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                                <div className="h-3 w-1/2 rounded bg-zinc-700 mb-2"></div>
                                <div className="h-2 w-3/4 rounded bg-zinc-800"></div>
                            </div>
                            <div className="h-12 w-full rounded-xl bg-[#FF5A00]/20 border border-[#FF5A00]/50 p-3 flex items-center gap-2">
                                <Smartphone size={16} className="text-[#FF5A00]" />
                                <div className="h-3 w-2/3 rounded bg-[#FF5A00]/80"></div>
                            </div>
                            <div className="mt-10 h-12 w-full rounded-xl bg-[#FF5A00] shadow-[0_0_15px_rgba(255,90,0,0.4)]"></div>
                        </div>
                    </div>

                    {/* Card Flotante 2: Solución */}
                    <div className="animate-float-delayed absolute -right-4 bottom-20 z-20 flex w-56 flex-col gap-1 rounded-2xl border border-emerald-500/20 bg-black/80 p-4 shadow-2xl backdrop-blur-xl md:-right-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                            <CheckCircle2 size={14} /> PEDIDO CONFIRMADO
                        </div>
                        <p className="font-display text-lg font-bold text-white">$17.800 ARS</p>
                        <p className="font-body text-xs text-zinc-400">Pagado vía MercadoPago. Etiqueta impresa en cocina.</p>
                    </div>

                </div>
            </section>

            {/* ─── ARSENAL DE PEDIDOSPOSTA (FEATURE SHOWROOM) ─── */}
            <section className="relative z-10 border-t border-white/5 bg-black py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-12">

                    {/* Encabezado de Sección */}
                    <div className="mb-20">
                        <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
                            El Arsenal <span className="text-[#FF5A00]">Premium</span> <br />
                            para ganar la guerra.
                        </h2>
                    </div>

                    <div className="flex flex-col gap-32">

                        {/* Bloque A: Checkout GPS */}
                        <div className="flex flex-col items-center gap-12 lg:flex-row">
                            <div className="max-w-xl lg:w-1/2">
                                <span className="font-body mb-4 inline-block text-xs font-bold uppercase tracking-widest text-[#FF5A00]">EL CEREBRO</span>
                                <h3 className="font-display mb-6 text-3xl font-extrabold leading-tight md:text-4xl">
                                    Checkout en 3 Clics <br /> con GPS Inteligente.
                                </h3>
                                <p className="font-body text-lg leading-relaxed text-zinc-400">
                                    Tus clientes no se pierden al pedir, tus repartidores no se pierden al entregar.
                                    Nuestro sistema detecta <strong className="text-white">"Entre Calles"</strong> automáticamente y calcula el costo exacto por KM.
                                </p>
                            </div>
                            <div className="relative aspect-video w-full lg:w-1/2 overflow-hidden rounded-3xl border border-white/5 bg-zinc-950 p-8 shadow-2xl">
                                <div className="absolute inset-x-0 top-0 h-1 bg-[#FF5A00]/50 shadow-[0_0_20px_#FF5A00]"></div>
                                {/* Visual representativo del Mapa */}
                                <div className="h-full w-full opacity-40 grayscale-[0.5] contrast-125 saturate-0">
                                    <div className="h-full w-full rounded-xl bg-orange-950/20 border-2 border-orange-500/20 relative overflow-hidden">
                                        {/* Líneas de mapa ficticias */}
                                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20">
                                            {Array.from({ length: 36 }).map((_, i) => (
                                                <div key={i} className="border border-white/20"></div>
                                            ))}
                                        </div>
                                        {/* Pin de GPS */}
                                        <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2">
                                            <div className="absolute inset-0 animate-ping rounded-full bg-[#FF5A00] opacity-30"></div>
                                            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#FF5A00] text-black">
                                                <Smartphone size={24} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bloque B: Pagos Validados (Alternado) */}
                        <div className="flex flex-col items-center gap-12 lg:flex-row-reverse">
                            <div className="max-w-xl lg:w-1/2">
                                <span className="font-body mb-4 inline-block text-xs font-bold uppercase tracking-widest text-[#FF5A00]">LA PLATA</span>
                                <h3 className="font-display mb-6 text-3xl font-extrabold leading-tight md:text-4xl">
                                    Cobrá más rápido <br /> y sin errores.
                                </h3>
                                <p className="font-body text-lg leading-relaxed text-zinc-400">
                                    Integración nativa con <strong className="text-white">MercadoPago</strong> y validación automática de transferencias adjuntando comprobante.
                                    Los pedidos no entran a cocina hasta que el pago está confirmado. Cero timos.
                                </p>
                            </div>
                            <div className="relative aspect-video w-full lg:w-1/2 overflow-hidden rounded-3xl border border-white/5 bg-zinc-950 p-12 shadow-2xl">
                                <div className="flex flex-col gap-6 justify-center h-full">
                                    <div className="w-full rounded-2xl bg-[#009EE3] p-6 text-center text-white font-bold text-xl flex items-center justify-center gap-3">
                                        <span className="h-8 w-8 rounded-full bg-white text-[#009EE3] flex items-center justify-center text-xs italic">MP</span>
                                        Mercado Pago
                                    </div>
                                    <div className="w-full rounded-2xl border-2 border-dashed border-zinc-800 p-6 flex items-center justify-center gap-4 text-zinc-500 transition-colors hover:border-[#FF5A00]/50 hover:text-[#FF5A00]">
                                        <CheckCircle2 size={24} />
                                        <span className="font-body font-semibold">Adjuntar Comprobante</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bloque C: Live Order Panel */}
                        <div className="flex flex-col items-center gap-12 lg:flex-row">
                            <div className="max-w-xl lg:w-1/2">
                                <span className="font-body mb-4 inline-block text-xs font-bold uppercase tracking-widest text-[#FF5A00]">EL CONTROL</span>
                                <h3 className="font-display mb-6 text-3xl font-extrabold leading-tight md:text-4xl">
                                    Tu cocina a la <br /> velocidad de la luz.
                                </h3>
                                <p className="font-body text-lg leading-relaxed text-zinc-400">
                                    Visualizá cada pedido en vivo en nuestro <strong className="text-white">panel de cajero táctil</strong>.
                                    Cero papel, cero Excel, 100% control del local desde cualquier dispositivo.
                                </p>
                            </div>
                            <div className="relative aspect-video w-full lg:w-1/2 overflow-hidden rounded-3xl border border-white/5 bg-zinc-900 p-6 shadow-2xl">
                                {/* Pantalla Manager */}
                                <div className="grid grid-cols-3 gap-3 h-full">
                                    <div className="space-y-3">
                                        <div className="h-6 w-full rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center px-2 uppercase">Pendientes</div>
                                        <div className="h-20 w-full rounded-lg bg-black border border-white/5 p-2 space-y-2">
                                            <div className="h-2 w-1/2 rounded bg-zinc-800"></div>
                                            <div className="h-2 w-full rounded bg-zinc-900"></div>
                                            <div className="h-2 w-1/3 rounded bg-zinc-900"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-6 w-full rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center px-2 uppercase">Cocina</div>
                                        <div className="h-20 w-full rounded-lg bg-zinc-800 border border-[#FF5A00]/30 p-2 space-y-2 animate-pulse">
                                            <div className="h-2 w-1/2 rounded bg-zinc-600"></div>
                                            <div className="h-2 w-full rounded bg-zinc-700"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-6 w-full rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center px-2 uppercase">Envío</div>
                                        <div className="h-20 w-full rounded-lg bg-black border border-white/5 opacity-50"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
            {/* ─── LA BATALLA: DEJA DE TRABAJAR PARA LAS APPS ─── */}
            <section className="relative z-10 bg-[#050505] py-32 border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-12 text-center">
                    <h2 className="font-display mb-16 text-4xl font-extrabold uppercase tracking-tight md:text-6xl">
                        Dejá de trabajar para <br />
                        <span className="text-zinc-600">las Apps de Delivery.</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-8">

                        {/* El Enemigo: Apps Tradicionales */}
                        <div className="group relative rounded-[2.5rem] border border-red-500/20 bg-zinc-900/30 p-10 backdrop-blur-xl transition-all hover:bg-zinc-900/50">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                                <Ban size={28} />
                            </div>
                            <h3 className="font-display mb-8 text-3xl font-bold text-white">Apps Tradicionales</h3>
                            <ul className="space-y-6 text-left font-body text-zinc-400">
                                <li className="flex items-start gap-3">
                                    <span className="mt-1 text-red-500/80">✕</span>
                                    <span>Hasta <strong className="text-zinc-200">30% de comisión</strong> por venta.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1 text-red-500/80">✕</span>
                                    <span>Te pagan a <strong className="text-zinc-200">15 o 30 días</strong> (si tenés suerte).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1 text-red-500/80">✕</span>
                                    <span>No tenés los datos de tus clientes. <strong className="text-zinc-200">No son "tuyos"</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1 text-red-500/80">✕</span>
                                    <span>Sos un local más en su lista interminable.</span>
                                </li>
                            </ul>
                            {/* Overlay de "Perdedor" */}
                            <div className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity bg-red-500 rounded-[2.5rem]"></div>
                        </div>

                        {/* La Solución: PedidosPosta */}
                        <div className="group relative rounded-[2.5rem] border-2 border-[#FF5A00] bg-black p-10 shadow-[0_0_60px_-15px_#FF5A00] transition-all hover:scale-[1.02]">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF5A00] text-black font-display text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_#FF5A00]">
                                RECOMENDADO
                            </div>
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF5A00]/10 text-[#FF5A00]">
                                <Zap size={28} fill="currentColor" />
                            </div>
                            <h3 className="font-display mb-8 text-3xl font-bold text-white">Pedidos<span className="text-[#FF5A00]">Posta.</span></h3>
                            <ul className="space-y-6 text-left font-body text-zinc-300">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="mt-1 text-[#FF5A00]" />
                                    <span><strong className="text-white">0% de comisiones</strong> por cada venta.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="mt-1 text-[#FF5A00]" />
                                    <span>Plata <strong className="text-white">en el acto</strong> en tu MercadoPago.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="mt-1 text-[#FF5A00]" />
                                    <span>Base de datos <strong className="text-white">100% tuya</strong> por siempre.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="mt-1 text-[#FF5A00]" />
                                    <span>Tu marca, tus reglas y <strong className="text-white">tu diseño premium</strong>.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── PRICING: LA OFERTA IRRESISTIBLE ─── */}
            <section id="pricing" className="relative z-10 py-32 bg-black overflow-hidden">
                {/* Glow de fondo para el precio */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF5A00]/10 blur-[150px] rounded-full pointer-events-none"></div>

                <div className="mx-auto max-w-4xl px-6 text-center">
                    <h2 className="font-display mb-4 text-3xl font-bold uppercase tracking-widest text-[#FF5A00]">EL PLAN TODO INCLUIDO</h2>
                    <h3 className="font-display mb-16 text-4xl font-extrabold leading-tight md:text-6xl text-white">
                        Un único precio.<br />Cero sorpresas.
                    </h3>

                    {/* Card de Precio XXL */}
                    <div className="relative rounded-[3rem] border border-white/10 bg-zinc-950/70 p-12 md:p-20 backdrop-blur-3xl shadow-2xl">
                        <div className="inline-block rounded-full bg-white/10 px-6 py-2 font-body text-xs font-bold uppercase tracking-widest text-white mb-10 border border-white/5">
                            Suscripción Pro Mensual
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-2">
                            <span className="font-display text-7xl md:text-9xl font-black text-white">$99.999</span>
                            <div className="flex flex-col items-start font-body text-zinc-500 uppercase font-black text-xl tracking-tighter">
                                <span>ARS</span>
                                <span>/MES</span>
                            </div>
                        </div>

                        <p className="font-body text-zinc-400 text-lg mb-12">
                            Menos de lo que te cuesta el sueldo de un solo día de un empleado. <br />
                            Tu negocio abierto <strong className="text-white">24/7</strong> procesando pedidos.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-16 font-body text-sm text-zinc-300">
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Tienda Online de Clase Mundial</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Checkout con GPS Inteligente</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Panel de Gestión en Vivo</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Soporte Directo vía WhatsApp</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Actualizaciones Semanales</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Multitenant & Branding Studio</div>
                        </div>

                        <button className="group relative w-full rounded-2xl bg-[#FF5A00] py-6 font-display text-2xl font-black uppercase text-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-5px_#FF5A00]">
                            Empezar mis 7 Días Gratis
                            <ArrowRight size={24} className="absolute right-8 top-1/2 -translate-y-1/2 transition-transform group-hover:translate-x-2" />
                        </button>

                        <p className="mt-8 font-body text-zinc-600 text-xs font-medium uppercase tracking-[0.2em]">
                            No pedimos tarjeta de crédito para empezar a probar.
                        </p>
                    </div>
                </div>
            </section>
            {/* ─── FAQ: PREGUNTAS FRECUENTES ─── */}
            <section className="relative z-10 py-32 bg-[#050505] border-t border-white/5">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="text-center mb-20">
                        <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
                            ¿Tenés dudas? <br />
                            <span className="text-zinc-600">Te las respondemos.</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">

                        {/* Q1 */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#FF5A00]">
                                <HelpCircle size={20} />
                                <h4 className="font-display font-bold text-xl text-white">¿Cobran comisión por venta?</h4>
                            </div>
                            <p className="font-body text-zinc-400 leading-relaxed pl-8">
                                No, absolutamente nada. El <strong className="text-zinc-200">100% de la plata</strong> va directo a tu cuenta de MercadoPago o a tu bolsillo si es efectivo. Solo pagás tu suscripción fija mensual de $99.999 ARS.
                            </p>
                        </div>

                        {/* Q2 */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#FF5A00]">
                                <HelpCircle size={20} />
                                <h4 className="font-display font-bold text-xl text-white">¿Necesito saber de programación?</h4>
                            </div>
                            <p className="font-body text-zinc-400 leading-relaxed pl-8">
                                Cero. Te entregamos un panel de control intuitivo donde podés cargar tus fotos, productos y precios de forma visual. Es <strong className="text-zinc-200">tan fácil como subir una story</strong> a Instagram.
                            </p>
                        </div>

                        {/* Q3 */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#FF5A00]">
                                <HelpCircle size={20} />
                                <h4 className="font-display font-bold text-xl text-white">¿Cómo funciona la prueba de 7 días?</h4>
                            </div>
                            <p className="font-body text-zinc-400 leading-relaxed pl-8">
                                Te registrás sin tarjeta de crédito, configurás tu local y podés recibir pedidos reales. Si te gusta, pagás la mensualidad el día 8. Si no, <strong className="text-zinc-200">se da de baja sin compromisos ni letra chica</strong>.
                            </p>
                        </div>

                        {/* Q4 */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#FF5A00]">
                                <HelpCircle size={20} />
                                <h4 className="font-display font-bold text-xl text-white">¿Mis clientes bajan una App?</h4>
                            </div>
                            <p className="font-body text-zinc-400 leading-relaxed pl-8">
                                No, es una <strong className="text-zinc-200">WebApp premium</strong>. Entran desde un link en tu biografía, ven el menú y piden directo desde el navegador del celular en segundos. <strong className="text-zinc-200">Sin instalaciones</strong> ni fricción.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ─── FOOTER PROFESIONAL ─── */}
            <footer className="relative z-10 py-20 bg-black border-t border-zinc-900">
                <div className="mx-auto max-w-7xl px-6 lg:px-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-16">
                        {/* Logo */}
                        <div className="font-display text-3xl font-extrabold tracking-tighter">
                            Pedidos<span className="text-[#FF5A00]">Posta.</span>
                        </div>

                        {/* Links */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 font-body text-xs font-bold uppercase tracking-widest text-zinc-500">
                            <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
                            <a href="/angus" className="hover:text-white transition-colors">Ver Demo</a>
                            <a href="/login-posta" className="hover:text-white transition-colors">Ingresar</a>
                            <a href="#" className="hover:text-white transition-colors">Términos</a>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5">
                        <p className="font-body text-zinc-600 text-xs font-medium uppercase tracking-[0.2em] text-center md:text-left">
                            © 2026 PedidosPosta. El fin de los audios de WhatsApp. <br className="md:hidden" /> Hecho en Argentina.
                        </p>
                    </div>
                </div>
            </footer>
        </main>
    );
}