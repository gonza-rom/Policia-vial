import type { Metadata, Viewport } from "next";
import { Public_Sans, Space_Grotesk } from "next/font/google";
import { RegistrarServiceWorker } from "@/components/ui/RegistrarServiceWorker";
import { SincronizadorOffline } from "@/components/ui/SincronizadorOffline";
import { Footer } from "@/components/ui/Footer";
import "./globals.css";

// Fuentes variables (sin lista de pesos): con pesos sueltos Google devuelve
// URLs /l/font?kit=… que Turbopack no puede resolver y rompe el build.
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dirección de Seguridad Vial - Huillapima",
  description:
    "Sistema de control y actas viales — Policía de Catamarca, Dirección de Seguridad Vial, Puesto Caminero Huillapima.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vial Huillapima",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d2240",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${publicSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Extensiones como ColorZilla agregan atributos al <body> antes de
          hidratar; esto silencia solo ese aviso, no el de los hijos. */}
      <body
        className="min-h-full flex flex-col bg-background text-on-surface font-sans"
        suppressHydrationWarning
      >
        <RegistrarServiceWorker />
        <SincronizadorOffline />
        {children}
        <Footer />
      </body>
    </html>
  );
}
