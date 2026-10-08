import type { Metadata, Viewport } from "next";
import { Outfit, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CosmosBackground from "@/components/layout/CosmosBackground";
import TermsModal from "@/components/modals/TermsModal";
import Footer from "@/components/layout/Footer";
import SileoToaster from "@/components/ui/SileoToaster";
import DatePickerEnhancer from "@/components/ui/DatePickerEnhancer";
import NyanCatGamerOverlay from "@/components/easter-egg/NyanCatGamerOverlay";
import NetworkStatusIndicator from "@/components/shared/NetworkStatusIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
    { media: "(prefers-color-scheme: light)", color: "#edf2f7" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "EscuelaInfo — Escuela N° 713",
    template: "%s · EscuelaInfo"
  },
  description: "Sistema de gestión escolar y ausencias · Escuela N° 713 \"Juan Abdala Chayep\"",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EscuelaInfo",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning en <html> evita el warning de hidratación cuando
    // el JS de tema agrega/quita la clase 'dark' antes del primer render.
    <html lang="es" className={`${geistSans.variable} ${outfit.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconexión de baja latencia a Appwrite Cloud para máxima velocidad de carga (LCP) */}
        <link rel="preconnect" href="https://cloud.appwrite.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cloud.appwrite.io" />
        {/* Script de tema y recuperación automática de chunks tras nuevo despliegue */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let t = localStorage.getItem('theme');
                if (!t) {
                  t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(t);
              } catch (e) {}

              // Auto-recuperación ante ChunkLoadError por actualización de versión en Vercel
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  var msg = (e && (e.message || (e.error && e.error.message))) || '';
                  if (
                    msg.indexOf('Loading chunk') !== -1 ||
                    msg.indexOf('ChunkLoadError') !== -1 ||
                    msg.indexOf('Failed to fetch dynamically imported module') !== -1
                  ) {
                    var now = Date.now();
                    var lastReload = parseInt(sessionStorage.getItem('last_chunk_reload') || '0', 10);
                    if (now - lastReload > 8000) {
                      sessionStorage.setItem('last_chunk_reload', String(now));
                      window.location.reload();
                    }
                  }
                });
              }
            `,
          }}
        />
      </head>

      {/*
        BODY: La estructura flex-col + min-h-screen aquí es la ÚNICA fuente
        de verdad del layout. No se repite en ningún hijo.
        - 'antialiased'         → suavizado de fuentes
        - 'font-sans'           → fuente base del sistema de diseño
        - 'bg-[var(--bg)]'      → respeta el CSS custom property del tema activo
        - 'text-[var(--text)]'  → igual para el color de texto
        - 'transition-colors'   → transición suave al cambiar de tema
        - 'duration-200'        → 200ms, imperceptible pero elimina el flash
        suppressHydrationWarning → evita mismatch por la clase 'dark' en SSR
      */}
      <body
        className="antialiased font-sans min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-200 relative overflow-x-hidden"
        suppressHydrationWarning
      >
        {/* Fondo animado — pointer-events:none, no interfiere con el flujo */}
        <div className="hidden md:block absolute inset-0 pointer-events-none z-0" suppressHydrationWarning>
          <CosmosBackground />
        </div>

        {/*
          TermsModal: fixed + inset-0 + z-[9999]
          Al estar en 'fixed', NO ocupa espacio en el flujo del documento.
          Cuando se desmonta físicamente (accepted=true → return null),
          desaparece sin rastro del árbol de React.
        */}
        <TermsModal />
        <NyanCatGamerOverlay />
        <SileoToaster />
        <DatePickerEnhancer />
        <NetworkStatusIndicator />

        {/*
          Contenedor principal: relative + z-10 para estar sobre el fondo.
          flex-col + flex-1 (flex-grow) → ocupa todo el espacio disponible
          empujando el Footer al fondo aunque la página tenga poco contenido.
        */}
        <div
          id="root-app"
          className="relative z-10 flex flex-col flex-1"
          suppressHydrationWarning
        >
          {/* El children ocupa el espacio restante y se estira como flex item/container */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>

          {/* Footer siempre al fondo, nunca pisa contenido */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
