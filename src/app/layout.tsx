import type { Metadata, Viewport } from "next";
import { Inter, Archivo_Black, JetBrains_Mono } from "next/font/google";
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
            </body>
        </html>
    );
}
