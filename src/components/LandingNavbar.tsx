import Link from "next/link";
import Image from "next/image";

export default function LandingNavbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/60 transition-all duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between">

                {/* Logo & Brand */}
                <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
                    <div className="relative h-9 w-40 sm:h-10 sm:w-48">
                        <Image
                            src="/logo-pedidoposta.png"
                            alt="PedidosPosta Logo"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                </Link>

                {/* Right side Actions */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/login-posta"
                        className="hidden sm:flex px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white transition-colors border-transparent hover:bg-zinc-900 rounded-xl"
                    >
                        Iniciar Sesión
                    </Link>
                    <Link
                        href="/register"
                        className="px-5 py-2.5 text-sm font-extrabold text-[#09090b] bg-primary hover:brightness-110 active:scale-95 transition-all rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] uppercase tracking-wider"
                    >
                        Crear mi Tienda
                    </Link>
                </div>
            </div>
        </nav>
    );
}
