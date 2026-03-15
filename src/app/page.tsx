"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowRight,
    Code2,
    Cpu,
    Sparkles,
    Wrench,
} from 'lucide-react';

// --- Logo Component: Recreated from user image ---
const Logo = ({ className = "", isLight = false }: { className?: string, isLight?: boolean }) => (
    <Link href="/" className={`flex items-baseline tracking-tighter ${className}`}>
        <span className="text-[#9CA3AF] font-bold text-3xl">Pedidos</span>
        <span className={`${isLight ? 'text-zinc-800' : 'text-white'} font-bold text-3xl`}>Posta</span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#65b981] ml-1 shadow-[0_0_10px_rgba(101,185,129,0.5)]"></span>
    </Link>
);

// --- UI Components ---
const ScreenshotFrame = ({ title, description, badge, children, isMobile = false }: { title: string, description: string, badge: string, children: React.ReactNode, isMobile?: boolean }) => (
    <div className="flex flex-col gap-6 group">
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                {badge}
            </div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md">{description}</p>
        </div>

        <div className={`relative bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] ${isMobile ? 'max-w-[280px] aspect-[9/19.5]' : 'aspect-video'}`}>
            {!isMobile && (
                <div className="h-8 bg-zinc-800/50 border-b border-white/5 flex items-center px-4 gap-1.5 z-10 relative">
                    <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                    <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                    <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                </div>
            )}
            <div className="relative w-full h-full bg-[#050505] flex items-center justify-center">
                {children}
            </div>
        </div>
    </div>
);

export default function App() {
    return (
        <div className="bg-black min-h-screen text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Logo className="scale-90 md:scale-100 origin-left" />
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <a href="#experiencia" className="hover:text-white transition-colors">Experiencia</a>
                        <a href="#herramientas" className="hover:text-white transition-colors">Herramientas</a>
                        <a href="#especial" className="hover:text-white transition-colors">A Medida</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login-posta" className="hidden sm:block text-sm font-semibold text-zinc-300 hover:text-white transition-colors">
                            Iniciar Sesión
                        </Link>
                        <Link href="/register" className="bg-emerald-500 text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-400 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                            Crear tienda gratis
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 md:pt-56 md:pb-32 px-6 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 mb-8">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] uppercase font-bold tracking-wider">MARCA BLANCA TOTAL</span>
                        Impulsado por la tecnología de PedidosPosta.
                    </div>

                    <h1 className="text-6xl md:text-[80px] lg:text-[100px] font-extrabold tracking-tighter mb-8 leading-[0.85] uppercase">
                        WhatsApp es caos.<br />
                        Nosotros somos <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                            Paz Mental.
                        </span>
                    </h1>

                    <p className="text-lg md:text-2xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed italic">
                        "No vendemos un sistema de pedidos, vendemos tranquilidad para el gastronómico."
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/angus" className="w-full sm:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-full transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 text-xl uppercase tracking-tight">
                            Probar demo gratis <ArrowRight size={22} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Showcase Section */}
            <section id="herramientas" className="py-24 px-6 relative z-10">
                <div className="max-w-7xl mx-auto space-y-32">

                    <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
                        <ScreenshotFrame
                            badge="Personalización"
                            title="Brand Studio V2"
                            description="Personalizá la experiencia visual completa. Colores, logos, banners y tipografías. Tu local no es uno más, es ÚNICO."
                        >
                            <Image src="/brand-studio.png" alt="Brand Studio Real" fill className="object-cover object-left-top" unoptimized />
                        </ScreenshotFrame>

                        <ScreenshotFrame
                            badge="Control"
                            title="Analytics Dashboard"
                            description="Historial de pedidos, métricas y exportación en tiempo real. Entendé tus ingresos y ticket promedio al instante."
                        >
                            <Image src="/analytics-dashboard.png" alt="Analytics Dashboard Real" fill className="object-cover object-left-top" unoptimized />
                        </ScreenshotFrame>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
                        <ScreenshotFrame
                            badge="Flexibilidad"
                            title="Menu Builder"
                            description="Gestioná categorías, productos y modificadores. Prendé o apagá platos según el stock de tu cocina con un solo clic."
                        >
                            <Image src="/menu-builder.png" alt="Menu Builder Real" fill className="object-cover object-left-top" unoptimized />
                        </ScreenshotFrame>

                        <ScreenshotFrame
                            badge="Operación"
                            title="Live Orders"
                            description="Monitor de operaciones en tiempo real. Recibidos, confirmados y despachados. Privacidad total: datos sensibles protegidos."
                        >
                            <div className="relative w-full h-full">
                                <Image src="/live-orders.png" alt="Live Orders con Blur" fill className="object-cover object-left-top blur-[4px] opacity-80" unoptimized />
                                <div className="absolute top-[30%] left-0 w-full h-[40%] backdrop-blur-md border-y border-white/10 flex items-center justify-center z-10">
                                    <span className="bg-black/95 text-emerald-500 font-mono text-xs md:text-sm px-4 py-2 flex items-center gap-2 rounded border border-emerald-500/30">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        DATOS DE CLIENTES CONFIDENCIALES
                                    </span>
                                </div>
                            </div>
                        </ScreenshotFrame>
                    </div>

                    <div id="experiencia" className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div className="space-y-16">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">Logística Precisa</div>
                                <h3 className="text-4xl font-bold">Checkout Inteligente</h3>
                                <p className="text-zinc-400 leading-relaxed md:text-lg">
                                    Costo por KM automatizado mediante Google Maps. Se acabó el cajero haciendo cuentas matemáticas. El sistema calcula el flete exacto según la ubicación real del cliente.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">Fidelización</div>
                                <h3 className="text-4xl font-bold">Seguimiento de Estado</h3>
                                <p className="text-zinc-400 leading-relaxed md:text-lg">
                                    Aviso de estados aunque se cierre la página. Tu cliente siempre sabe si su pedido está preparándose en cocina o viajando camino a su casa. Ansiedad reducida a cero.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-center md:justify-end gap-6 sm:gap-8">
                            <ScreenshotFrame
                                isMobile
                                badge="Client Side"
                                title="Checkout"
                                description="Mapa y datos de envío."
                            >
                                <div className="relative w-full h-full border-t-[32px] border-zinc-950">
                                    <Image src="/checkout.png" alt="Checkout" fill className="object-cover object-top" unoptimized />
                                </div>
                            </ScreenshotFrame>
                            <ScreenshotFrame
                                isMobile
                                badge="Client Side"
                                title="Tracking"
                                description="Seguimiento en vivo."
                            >
                                <div className="relative w-full h-full border-t-[32px] border-zinc-950">
                                    <Image src="/confirmacion-pedido.png" alt="Seguimiento real" fill className="object-cover object-top" unoptimized />
                                </div>
                            </ScreenshotFrame>
                        </div>
                    </div>
                </div>
            </section>

            {/* Custom Solutions Section */}
            <section id="especial" className="py-24 px-6 relative overflow-hidden border-t border-white/5 bg-zinc-950/40">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -mt-48 -mr-48"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2 text-emerald-500 mb-4">
                                <Wrench size={20} />
                                <span className="text-xs font-bold uppercase tracking-widest">Socio Tecnológico</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Desarrollo a <br /><span className="text-zinc-500">medida.</span></h2>
                        </div>
                        <p className="text-zinc-400 md:max-w-xs text-sm leading-relaxed">
                            ¿Tenés un flujo de trabajo especial? Lo construimos. Desde integraciones con ERPs hasta lógicas de envío únicas.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="group p-8 bg-zinc-900/50 border border-white/5 rounded-3xl hover:border-emerald-500/50 transition-all">
                            <Code2 className="text-emerald-500 mb-6" size={32} />
                            <h4 className="text-xl font-bold mb-3">Integraciones</h4>
                            <p className="text-sm text-zinc-500">Conectamos PedidosPosta con tus herramientas actuales (Sistemas de gestión, facturación, etc).</p>
                        </div>
                        <div className="group p-8 bg-zinc-900/50 border border-white/5 rounded-3xl hover:border-emerald-500/50 transition-all">
                            <Cpu className="text-emerald-500 mb-6" size={32} />
                            <h4 className="text-xl font-bold mb-3">Lógica Única</h4>
                            <p className="text-sm text-zinc-500">Sistemas de puntos, cupones complejos o flujos de aprobación especiales para tu marca.</p>
                        </div>
                        <div className="group p-8 bg-zinc-900/50 border border-white/5 rounded-3xl hover:border-emerald-500/50 transition-all">
                            <Sparkles className="text-emerald-500 mb-6" size={32} />
                            <h4 className="text-xl font-bold mb-3">Reportes Pro</h4>
                            <p className="text-sm text-zinc-500">Diseñamos tableros específicos con las métricas clave para la gerencia de tu negocio.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 text-center relative border-t border-emerald-500/20 bg-emerald-950/20 overflow-hidden">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none translate-y-1/2"></div>
                <div className="max-w-3xl mx-auto space-y-12 relative z-10">
                    <Logo className="justify-center scale-150 mb-8" />
                    <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter uppercase leading-[0.9]">Tu local merece <br /> funcionar mejor.</h2>
                    <p className="text-xl text-zinc-400">Sumate a la plataforma que prioriza tu marca y tu tranquilidad.</p>
                    <Link href="/register" className="inline-block px-12 py-6 bg-white text-black font-black rounded-full transition-transform hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.2)] text-xl md:text-2xl uppercase tracking-tighter hover:bg-zinc-200">
                        Crear mi tienda hoy
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 border-t border-white/5 px-6 bg-[#050505]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <Logo className="scale-110" />
                    <div className="flex gap-12 text-sm font-bold text-zinc-500 uppercase tracking-widest hidden sm:flex">
                        <a href="#" className="hover:text-emerald-500 transition-colors">Términos</a>
                        <a href="#" className="hover:text-emerald-500 transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-emerald-500 transition-colors">Contacto</a>
                    </div>
                    <p className="text-zinc-600 text-xs tracking-[0.3em] font-medium uppercase text-center md:text-right">
                        © {new Date().getFullYear()} PedidosPosta<br /><span className="mt-1 block">La evolución del delivery</span>
                    </p>
                </div>
            </footer>

        </div>
    );
}
