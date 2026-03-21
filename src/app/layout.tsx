import { Inter, Oswald, Zilla_Slab, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-urbana" });
const zilla = Zilla_Slab({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-artesanal" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-vanguardia" });

export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false };

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className={`${inter.variable} ${oswald.variable} ${zilla.variable} ${space.variable} font-sans`}>
                {children}
            </body>
        </html>
    );
}
