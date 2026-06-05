import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CosmosBackground from "@/components/CosmosBackground";

const inter = Inter({
  variable: "--font-text",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-title",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AulaInfo — Registro de Ausencias",
  description: "Sistema de registro de ausencias · La Escuela 713 \"Juan Abdala Chayep\"",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
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
        className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased min-h-screen relative`}
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
