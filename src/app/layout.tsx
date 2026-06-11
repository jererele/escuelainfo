import type { Metadata } from "next";
import "./globals.css";
import CosmosBackground from "@/components/CosmosBackground";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "EscuelaInfo — Registro de Ausencias",
  description: "Sistema de registro de ausencias · La Escuela 713 \"Juan Abdala Chayep\"",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("h-full", "font-sans")} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:wght@100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
        <script id="theme-initializer" suppressHydrationWarning dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          })()
        `}} />
      </head>
      <body
        className="antialiased min-h-screen relative"
        suppressHydrationWarning
      >
        <CosmosBackground />
        <div id="root-app" className="relative z-10 min-h-screen" suppressHydrationWarning>
          {children}
        </div>
      </body>
    </html>
  );
}
