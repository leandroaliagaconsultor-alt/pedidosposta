"use client";

import React from "react";
import Link from "next/link";
import {
    ArrowRight, Zap, Ban, CheckCircle2, Smartphone, HelpCircle,
    ShieldCheck, Palette, Timer, ChefHat, CreditCard, LayoutDashboard,
} from "lucide-react";

export default function LandingPage() {
    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white selection:bg-[#FF5A00] selection:text-white">
            {/* ─── FUENTES Y ANIMACIONES ─── */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;800&family=Inter:wght@400;500;600&display=swap');

        .font-display { font-family: 'Syne', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }

        .bg-grain {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

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

            {/* ─── NAVBAR ─── */}
            <nav className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-5 md:px-12">
                <div className="font-display text-2xl font-extrabold tracking-tighter">
                    Pedidos<span className="text-[#FF5A00]">Posta.</span>
                </div>
                <div className="flex items-center gap-6 font-body text-sm font-medium">
                    <Link href="/angus" className="hidden text-zinc-400 transition-colors hover:text-white md:block">Ver Demo</Link>
                    <a href="#pricing" className="hidden text-zinc-400 transition-colors hover:text-white md:block">Precios</a>
                    <Link href="/login-posta" className="rounded-full bg-white px-5 py-2.5 text-black transition-transform hover:scale-105 active:scale-95">
                        Ingresar
                    </Link>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════════════════════════
                HERO: El dolor de WhatsApp + la solución profesional
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-between gap-16 px-6 pt-20 pb-32 lg:flex-row lg:px-12 lg:pt-32">

                {/* Columna Izquierda */}
                <div className="flex max-w-2xl flex-col items-start text-left lg:w-1/2">

                    {/* Badge */}
                    <div className="mb-6 flex items-center gap-2 rounded-full border border-[#FF5A00]/30 bg-[#FF5A00]/10 px-4 py-1.5 font-body text-xs font-semibold text-[#FF5A00] backdrop-blur-md">
                        <Zap size={14} fill="currentColor" />
                        <span>Chau audios de WhatsApp. Hola pedidos que se entienden.</span>
                    </div>

                    {/* Título Principal */}
                    <h1 className="font-display text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl">
                        Tu comida es <br />
                        increíble. Tu sistema <br />
                        de pedidos,{" "}
                        <span className="relative inline-block text-zinc-600 line-through decoration-red-500/80 decoration-[4px] opacity-70">
                            no.
                        </span>
                    </h1>

                    {/* Subtítulo */}
                    <p className="font-body mt-8 max-w-lg text-lg leading-relaxed text-zinc-400">
                        Audios interminables, pedidos que se pierden, cocina al borde del colapso cada viernes.
                        <strong className="text-white font-medium"> PedidosPosta</strong> le da a tu local un sistema de pedidos profesional: menú digital propio, checkout en 3 clics, cobro automático y panel de cocina en tiempo real. <span className="text-emerald-400 font-medium">Sin comisiones, sin intermediarios.</span>
                    </p>

                    {/* CTA */}
                    <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <Link href="/register" className="group flex items-center gap-3 rounded-full bg-[#FF5A00] px-8 py-4 font-body text-base font-bold text-black shadow-[0_0_40px_-10px_#FF5A00] transition-all hover:scale-105 hover:shadow-[0_0_60px_-15px_#FF5A00] active:scale-95">
                            Crear Mi Tienda Gratis
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                        <div className="flex flex-col text-left font-body text-xs text-zinc-500 sm:ml-4">
                            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-[#FF5A00]" /> Configurás en 5 minutos, vendés esta noche.</span>
                            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-[#FF5A00]" /> Sin tarjeta. Sin contratos. Cancelás cuando quieras.</span>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Mockups Flotantes */}
                <div className="relative w-full lg:w-1/2 flex justify-center lg:justify-end">
                    {/* Círculo decorativo */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-white/5 bg-zinc-900/20 backdrop-blur-3xl"></div>

                    {/* Card Flotante: El Problema */}
                    <div className="animate-float absolute -left-4 top-10 z-20 flex w-64 flex-col gap-2 rounded-2xl border border-red-500/20 bg-black/60 p-4 shadow-2xl backdrop-blur-xl md:-left-12">
                        <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                            <Ban size={14} /> AUDIO DE WHATSAPP (0:47)
                        </div>
                        <p className="font-body text-sm text-zinc-300">&quot;Hola maestro, mandame 3 promos, una sin tomate, otra con doble cheddar, y te transfiero a nombre de mi novia...&quot;</p>
                    </div>

                    {/* Teléfono Mockup */}
                    <div className="relative z-10 h-[550px] w-[280px] rounded-[2.5rem] border-[6px] border-zinc-800 bg-[#0a0a0b] p-2 shadow-2xl">
                        <div className="mx-auto h-4 w-20 rounded-b-xl bg-zinc-800"></div>
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

                    {/* Card Flotante: La Solución */}
                    <div className="animate-float-delayed absolute -right-4 bottom-20 z-20 flex w-56 flex-col gap-1 rounded-2xl border border-emerald-500/20 bg-black/80 p-4 shadow-2xl backdrop-blur-xl md:-right-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                            <CheckCircle2 size={14} /> PEDIDO #47 CONFIRMADO
                        </div>
                        <p className="font-display text-lg font-bold text-white">$17.800</p>
                        <p className="font-body text-xs text-zinc-400">Pagado con MercadoPago. Listo para marchar.</p>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                SOCIAL PROOF / LOGOS
                TODO: Reemplazar con componente 21st.dev (LogoCloud o MarqueeTicker)
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 border-t border-white/5 bg-black/50 py-12">
                <div className="mx-auto max-w-5xl px-6 text-center">
                    <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600 mb-6">
                        Locales que ya dejaron los audios atrás
                    </p>
                    {/* Placeholder: inyectar logos reales o marquee de 21st.dev */}
                    <div className="flex flex-wrap items-center justify-center gap-8 opacity-30">
                        {["Burger Pro", "La Birra Bar", "Morfi House", "Don Taco", "Pizza Lab"].map((name) => (
                            <span key={name} className="font-display text-lg font-bold tracking-tight text-zinc-500">{name}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                CÓMO FUNCIONA: 3 pasos claros
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 bg-[#050505] py-28 border-t border-white/5">
                <div className="mx-auto max-w-5xl px-6 lg:px-12">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
                            Arrancá en <span className="text-[#FF5A00]">3 pasos.</span>
                        </h2>
                        <p className="font-body mt-4 text-lg text-zinc-500">Sin código, sin diseñadores, sin complicaciones.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "01",
                                title: "Creá tu local",
                                desc: "Registrate gratis, elegí el nombre de tu tienda y personalizá los colores de tu marca.",
                                icon: Palette,
                            },
                            {
                                step: "02",
                                title: "Cargá tu menú",
                                desc: "Subí tus productos con fotos, precios y modificadores. Tan fácil como armar una story de Instagram.",
                                icon: ChefHat,
                            },
                            {
                                step: "03",
                                title: "Empezá a vender",
                                desc: "Compartí el link de tu tienda y recibí pedidos organizados, pagados y listos para cocinar.",
                                icon: CreditCard,
                            },
                        ].map(({ step, title, desc, icon: Icon }) => (
                            <div key={step} className="relative rounded-2xl border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-xl">
                                <span className="font-display text-5xl font-black text-[#FF5A00]/15">{step}</span>
                                <div className="mt-2 mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF5A00]/10 text-[#FF5A00]">
                                    <Icon size={22} />
                                </div>
                                <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
                                <p className="font-body text-sm text-zinc-400 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link href="/register" className="group inline-flex items-center gap-2 rounded-full border border-[#FF5A00]/40 bg-[#FF5A00]/10 px-8 py-3.5 font-body text-sm font-bold text-[#FF5A00] transition-all hover:bg-[#FF5A00]/20 hover:scale-105 active:scale-95">
                            Crear mi tienda ahora
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                FEATURES: Los 4 pilares del producto
                TODO: Reemplazar con BentoGrid de 21st.dev para layout más dinámico
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 border-t border-white/5 bg-black py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-12">

                    <div className="mb-20">
                        <span className="font-body mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#FF5A00]">Por qué PedidosPosta</span>
                        <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
                            Tu local funcionando como <br />
                            <span className="text-[#FF5A00]">una máquina.</span>
                        </h2>
                    </div>

                    <div className="flex flex-col gap-32">

                        {/* Feature 1: Checkout ultra-rápido */}
                        <div className="flex flex-col items-center gap-12 lg:flex-row">
                            <div className="max-w-xl lg:w-1/2">
                                <div className="mb-4 inline-flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A00]/10 text-[#FF5A00]"><Timer size={16} /></div>
                                    <span className="font-body text-xs font-bold uppercase tracking-widest text-[#FF5A00]">Checkout Ultra-Rápido</span>
                                </div>
                                <h3 className="font-display mb-6 text-3xl font-extrabold leading-tight md:text-4xl">
                                    Tu cliente pide en <br /> 3 clics. No en 3 audios.
                                </h3>
                                <p className="font-body text-lg leading-relaxed text-zinc-400">
                                    Menú visual, GPS que detecta la dirección y entre-calles automáticamente, cálculo de envío al instante.
                                    Tu cliente elige, paga y listo. <strong className="text-white">Cero idas y vueltas por chat.</strong>
                                </p>
                            </div>
                            <div className="relative aspect-video w-full lg:w-1/2 overflow-hidden rounded-3xl border border-white/5 bg-zinc-950 p-8 shadow-2xl">
                                <div className="absolute inset-x-0 top-0 h-1 bg-[#FF5A00]/50 shadow-[0_0_20px_#FF5A00]"></div>
                                <div className="h-full w-full opacity-40 grayscale-[0.5] contrast-125 saturate-0">
                                    <div className="h-full w-full rounded-xl bg-orange-950/20 border-2 border-orange-500/20 relative overflow-hidden">
                                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20">
                                            {Array.from({ length: 36 }).map((_, i) => (
                                                <div key={i} className="border border-white/20"></div>
                                            ))}
                                        </div>
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

                        {/* Feature 2: Panel de Cocina */}
                        <div className="flex flex-col items-center gap-12 lg:flex-row-reverse">
                            <div className="max-w-xl lg:w-1/2">
                                <div className="mb-4 inline-flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A00]/10 text-[#FF5A00]"><LayoutDashboard size={16} /></div>
                                    <span className="font-body text-xs font-bold uppercase tracking-widest text-[#FF5A00]">Panel de Cocina</span>
                                </div>
                                <h3 className="font-display mb-6 text-3xl font-extrabold leading-tight md:text-4xl">
                                    Cada pedido llega claro, <br /> ordenado y ya pagado.
                                </h3>
                                <p className="font-body text-lg leading-relaxed text-zinc-400">
                                    Panel táctil donde ves <strong className="text-white">qué se pidió, con qué modificaciones y en qué orden preparar</strong>.
                                    Se acabaron los papelitos, los gritos a la cocina y los errores del viernes a la noche.
                                </p>
                            </div>
                            <div className="relative aspect-video w-full lg:w-1/2 overflow-hidden rounded-3xl border border-white/5 bg-zinc-900 p-6 shadow-2xl">
                                <div className="grid grid-cols-3 gap-3 h-full">
                                    <div className="space-y-3">
                                        <div className="h-6 w-full rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center px-2 uppercase">Recibidos</div>
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
                                        <div className="h-6 w-full rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center px-2 uppercase">Listo</div>
                                        <div className="h-20 w-full rounded-lg bg-black border border-white/5 opacity-50"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3: Cobros integrados */}
                        <div className="flex flex-col items-center gap-12 lg:flex-row">
                            <div className="max-w-xl lg:w-1/2">
                                <div className="mb-4 inline-flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A00]/10 text-[#FF5A00]"><ShieldCheck size={16} /></div>
                                    <span className="font-body text-xs font-bold uppercase tracking-widest text-[#FF5A00]">Cobros Integrados</span>
                                </div>
                                <h3 className="font-display mb-6 text-3xl font-extrabold leading-tight md:text-4xl">
                                    Cobrá antes de cocinar. <br /> Plata en tu cuenta, al toque.
                                </h3>
                                <p className="font-body text-lg leading-relaxed text-zinc-400">
                                    Integración directa con <strong className="text-white">MercadoPago</strong> y validación de transferencias con comprobante adjunto.
                                    Ningún pedido entra a cocina sin pago confirmado. <strong className="text-white">0% de comisiones sobre tus ventas.</strong>
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
                                        <span className="font-body font-semibold">Comprobante Validado</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 4: Marca propia */}
                        <div className="flex flex-col items-center gap-12 lg:flex-row-reverse">
                            <div className="max-w-xl lg:w-1/2">
                                <div className="mb-4 inline-flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A00]/10 text-[#FF5A00]"><Palette size={16} /></div>
                                    <span className="font-body text-xs font-bold uppercase tracking-widest text-[#FF5A00]">Tu Marca, Tus Reglas</span>
                                </div>
                                <h3 className="font-display mb-6 text-3xl font-extrabold leading-tight md:text-4xl">
                                    Tu tienda con tu logo, <br /> tus colores y tu dominio.
                                </h3>
                                <p className="font-body text-lg leading-relaxed text-zinc-400">
                                    Cada local tiene su URL propia (<strong className="text-white">tulocal.pedidosposta.com</strong>) y un Brand Studio donde elegís
                                    colores, fuentes, modo claro u oscuro. Tus clientes ven <strong className="text-white">tu marca, no la nuestra</strong>.
                                </p>
                            </div>
                            <div className="relative aspect-video w-full lg:w-1/2 overflow-hidden rounded-3xl border border-white/5 bg-zinc-950 p-8 shadow-2xl">
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    {/* Mini mockup de Brand Studio */}
                                    <div className="flex gap-3">
                                        {["#FF5A00", "#10B981", "#3B82F6", "#F59E0B", "#EC4899"].map((color) => (
                                            <div key={color} className="h-10 w-10 rounded-full border-2 border-white/10 transition-transform hover:scale-110 cursor-pointer" style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                    <div className="w-full max-w-xs rounded-xl border border-white/10 bg-black p-4 text-center">
                                        <div className="font-display text-lg font-bold text-white mb-1">Tu Local</div>
                                        <div className="font-body text-xs text-zinc-500">tulocal.pedidosposta.com</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                COMPARACIÓN: El método viejo vs PedidosPosta
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 bg-[#050505] py-32 border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-12 text-center">
                    <h2 className="font-display mb-6 text-4xl font-extrabold uppercase tracking-tight md:text-6xl">
                        Dejá de improvisar. <br />
                        <span className="text-zinc-600">Empezá a gestionar posta.</span>
                    </h2>
                    <p className="font-body text-lg text-zinc-500 mb-16 max-w-2xl mx-auto">
                        Tu comida es de primera. Que tu operación esté a la altura.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-8">

                        {/* El Método Viejo */}
                        <div className="group relative rounded-[2.5rem] border border-red-500/20 bg-zinc-900/30 p-10 backdrop-blur-xl transition-all hover:bg-zinc-900/50">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                                <Ban size={28} />
                            </div>
                            <h3 className="font-display mb-8 text-3xl font-bold text-white">WhatsApp + Caos</h3>
                            <ul className="space-y-6 text-left font-body text-zinc-400">
                                <li className="flex items-start gap-3">
                                    <span className="mt-1 text-red-500/80">&#x2715;</span>
                                    <span>Audios de 2 minutos que <strong className="text-zinc-200">nadie escucha completos</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1 text-red-500/80">&#x2715;</span>
                                    <span>Pedidos mal tomados, errores en cocina, <strong className="text-zinc-200">clientes enojados</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1 text-red-500/80">&#x2715;</span>
                                    <span>&quot;Te transfiero después&quot; y <strong className="text-zinc-200">la plata nunca llega</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1 text-red-500/80">&#x2715;</span>
                                    <span>Apps que se llevan <strong className="text-zinc-200">hasta el 30% de cada venta</strong>.</span>
                                </li>
                            </ul>
                            <div className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity bg-red-500 rounded-[2.5rem]"></div>
                        </div>

                        {/* PedidosPosta */}
                        <div className="group relative rounded-[2.5rem] border-2 border-[#FF5A00] bg-black p-10 shadow-[0_0_60px_-15px_#FF5A00] transition-all hover:scale-[1.02]">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF5A00] text-black font-display text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_#FF5A00]">
                                LA SOLUCIÓN
                            </div>
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF5A00]/10 text-[#FF5A00]">
                                <Zap size={28} fill="currentColor" />
                            </div>
                            <h3 className="font-display mb-8 text-3xl font-bold text-white">Pedidos<span className="text-[#FF5A00]">Posta.</span></h3>
                            <ul className="space-y-6 text-left font-body text-zinc-300">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="mt-1 text-[#FF5A00] shrink-0" />
                                    <span>Pedidos estandarizados, <strong className="text-white">claros y sin errores de interpretación</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="mt-1 text-[#FF5A00] shrink-0" />
                                    <span>Cocina ordenada: <strong className="text-white">sabés qué preparar, en qué orden y para quién</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="mt-1 text-[#FF5A00] shrink-0" />
                                    <span>Cobro confirmado <strong className="text-white">antes de encender la plancha</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="mt-1 text-[#FF5A00] shrink-0" />
                                    <span><strong className="text-white">0% de comisiones</strong>. La plata va directo a tu MercadoPago.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                PRICING
            ═══════════════════════════════════════════════════════════════ */}
            <section id="pricing" className="relative z-10 py-32 bg-black overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF5A00]/10 blur-[150px] rounded-full pointer-events-none"></div>

                <div className="mx-auto max-w-4xl px-6 text-center">
                    <h2 className="font-display mb-4 text-3xl font-bold uppercase tracking-widest text-[#FF5A00]">PRECIO SIMPLE</h2>
                    <h3 className="font-display mb-16 text-4xl font-extrabold leading-tight md:text-6xl text-white">
                        Un plan. Todo adentro.<br />Sin comisiones ocultas.
                    </h3>

                    <div className="relative rounded-[3rem] border border-white/10 bg-zinc-950/70 p-12 md:p-20 backdrop-blur-3xl shadow-2xl">
                        <div className="inline-block rounded-full bg-white/10 px-6 py-2 font-body text-xs font-bold uppercase tracking-widest text-white mb-10 border border-white/5">
                            Plan Pro Mensual
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-2">
                            <span className="font-display text-7xl md:text-9xl font-black text-white">$99.999</span>
                            <div className="flex flex-col items-start font-body text-zinc-500 uppercase font-black text-xl tracking-tighter">
                                <span>ARS</span>
                                <span>/MES</span>
                            </div>
                        </div>

                        <p className="font-body text-zinc-400 text-lg mb-12">
                            Menos que el jornal de un empleado. <br />
                            Tu local recibiendo pedidos <strong className="text-white">24/7</strong>, incluso cuando dormís.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-16 font-body text-sm text-zinc-300">
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Menú digital con tu marca</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Checkout con GPS integrado</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Panel de pedidos en vivo</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Cobros con MercadoPago</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Brand Studio personalizable</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF5A00]" /> Soporte directo por WhatsApp</div>
                        </div>

                        <Link href="/register" className="group relative flex w-full items-center justify-center rounded-2xl bg-[#FF5A00] py-6 font-display text-2xl font-black uppercase text-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-5px_#FF5A00]">
                            Crear Mi Tienda Gratis
                            <ArrowRight size={24} className="absolute right-8 top-1/2 -translate-y-1/2 transition-transform group-hover:translate-x-2" />
                        </Link>

                        <p className="mt-8 font-body text-zinc-600 text-xs font-medium uppercase tracking-[0.2em]">
                            Sin tarjeta. Sin contratos. Cancelás cuando quieras.
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                FAQ
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 py-32 bg-[#050505] border-t border-white/5">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="text-center mb-20">
                        <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
                            Antes de arrancar, <br />
                            <span className="text-zinc-600">seguro te preguntás...</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#FF5A00]">
                                <HelpCircle size={20} />
                                <h4 className="font-display font-bold text-xl text-white">¿Cobran comisión por venta?</h4>
                            </div>
                            <p className="font-body text-zinc-400 leading-relaxed pl-8">
                                No. Cero. Nada. El <strong className="text-zinc-200">100% de cada venta</strong> va directo a tu cuenta de MercadoPago o a tu bolsillo si cobrás en efectivo. Solo pagás la suscripción fija mensual.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#FF5A00]">
                                <HelpCircle size={20} />
                                <h4 className="font-display font-bold text-xl text-white">¿Necesito saber de programación?</h4>
                            </div>
                            <p className="font-body text-zinc-400 leading-relaxed pl-8">
                                Para nada. Cargás productos, subís fotos y ponés precios desde un panel visual. <strong className="text-zinc-200">Si sabés usar Instagram, sabés usar PedidosPosta.</strong>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#FF5A00]">
                                <HelpCircle size={20} />
                                <h4 className="font-display font-bold text-xl text-white">¿Mis clientes tienen que bajar una app?</h4>
                            </div>
                            <p className="font-body text-zinc-400 leading-relaxed pl-8">
                                No. Es una web-app: tu cliente entra desde un link (en tu bio de Instagram, en un QR, en un sticker), ve el menú y pide directo <strong className="text-zinc-200">desde el navegador del celular</strong>. Sin descargas.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#FF5A00]">
                                <HelpCircle size={20} />
                                <h4 className="font-display font-bold text-xl text-white">¿Y si no me convence?</h4>
                            </div>
                            <p className="font-body text-zinc-400 leading-relaxed pl-8">
                                Te registrás gratis, armás tu tienda y probás con pedidos reales. Si no te sirve, <strong className="text-zinc-200">desactivás tu cuenta sin compromisos ni letra chica</strong>. No pedimos tarjeta para arrancar.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#FF5A00]">
                                <HelpCircle size={20} />
                                <h4 className="font-display font-bold text-xl text-white">¿Puedo seguir usando PedidosYa o Rappi?</h4>
                            </div>
                            <p className="font-body text-zinc-400 leading-relaxed pl-8">
                                Por supuesto. PedidosPosta no compite con las apps de delivery, <strong className="text-zinc-200">las complementa</strong>. Es tu canal propio donde no pagás comisiones y tenés el control total de la experiencia.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#FF5A00]">
                                <HelpCircle size={20} />
                                <h4 className="font-display font-bold text-xl text-white">¿Funciona para mi rubro?</h4>
                            </div>
                            <p className="font-body text-zinc-400 leading-relaxed pl-8">
                                Si vendés comida y recibís pedidos, sí. Hamburgueserías, pizzerías, cervecerías, empanadas, sushi, heladerías... <strong className="text-zinc-200">cualquier local gastronómico.</strong>
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                TESTIMONIOS
                TODO: Reemplazar con componente 21st.dev (TestimonialCards / Carousel)
            ═══════════════════════════════════════════════════════════════ */}
            {/* <section className="relative z-10 py-32 bg-black border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-12">
                    Inyectar carrusel de testimonios aquí
                </div>
            </section> */}

            {/* ═══════════════════════════════════════════════════════════════
                CTA FINAL: Último empujón antes del footer
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 py-28 bg-black border-t border-white/5 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF5A00]/8 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="relative mx-auto max-w-3xl px-6 text-center">
                    <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl mb-6">
                        Tu comida ya es de primera. <br />
                        <span className="text-[#FF5A00]">Que tu sistema esté a la altura.</span>
                    </h2>
                    <p className="font-body text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
                        Dejá de perder pedidos entre audios y empezá a gestionarlos como un profesional. En 5 minutos tenés tu tienda lista.
                    </p>
                    <Link href="/register" className="group inline-flex items-center gap-3 rounded-full bg-[#FF5A00] px-10 py-5 font-body text-lg font-bold text-black shadow-[0_0_50px_-10px_#FF5A00] transition-all hover:scale-105 hover:shadow-[0_0_70px_-15px_#FF5A00] active:scale-95">
                        Crear Mi Tienda Gratis
                        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="relative z-10 py-20 bg-[#050505] border-t border-zinc-900">
                <div className="mx-auto max-w-7xl px-6 lg:px-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-16">
                        <div className="font-display text-3xl font-extrabold tracking-tighter">
                            Pedidos<span className="text-[#FF5A00]">Posta.</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 font-body text-xs font-bold uppercase tracking-widest text-zinc-500">
                            <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
                            <Link href="/angus" className="hover:text-white transition-colors">Ver Demo</Link>
                            <Link href="/login-posta" className="hover:text-white transition-colors">Ingresar</Link>
                            <Link href="/register" className="hover:text-white transition-colors">Registrarse</Link>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5">
                        <p className="font-body text-zinc-600 text-xs font-medium uppercase tracking-[0.2em] text-center md:text-left">
                            &copy; 2026 PedidosPosta. El fin de los audios de WhatsApp. <br className="md:hidden" /> Hecho en Argentina.
                        </p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
