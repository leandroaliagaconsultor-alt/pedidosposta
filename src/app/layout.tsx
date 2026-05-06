import type { Metadata, Viewport } from "next";
import { Inter, Archivo_Black, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { META_PIXEL_ID } from "@/lib/analytics/meta-pixel";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: {
        default: "PedidosPosta — Sistema de Pedidos Online para Gastronomicos",
        template: "%s | PedidosPosta",
    },
    description:
        "Crea tu tienda de pedidos online en minutos. Menu digital, checkout profesional, delivery y takeaway. 0% comisiones, dominio propio y panel en tiempo real.",
    keywords: [
        "pedidos online",
        "menu digital",
        "delivery",
        "sistema de pedidos",
        "gastronomia",
        "restaurante",
        "takeaway",
        "pedidos whatsapp",
    ],
    authors: [{ name: "PedidosPosta" }],
    creator: "PedidosPosta",
    metadataBase: new URL("https://pedidosposta.com"),
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://pedidosposta.com",
        siteName: "PedidosPosta",
        title: "PedidosPosta — Sistema de Pedidos Online para Gastronomicos",
        description:
            "Deja de perder pedidos por WhatsApp. Menu digital, checkout profesional, 0% comisiones.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "PedidosPosta - Sistema de pedidos online",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "PedidosPosta — Pedidos Online para Gastronomicos",
        description:
            "Menu digital, checkout profesional, 0% comisiones. Setup en 5 minutos.",
        images: ["/og-image.png"],
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className="overflow-x-hidden">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#43926A" />
                <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
            </head>
            <body className={`${inter.variable} ${archivoBlack.variable} ${jetbrainsMono.variable} font-sans overflow-x-hidden w-full`}>
                {children}

                {/* ── Meta Pixel (Facebook) — se carga en TODAS las páginas ── */}
                <Script id="meta-pixel" strategy="afterInteractive">{`
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${META_PIXEL_ID}');
                    fbq('track', 'PageView');
                `}</Script>
                <noscript>
                    <img height="1" width="1" style={{ display: "none" }}
                        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} alt="" />
                </noscript>
            </body>
        </html>
    );
}
