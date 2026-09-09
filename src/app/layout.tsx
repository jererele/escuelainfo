import type { Metadata } from "next";
import "./globals.css";
import CosmosBackground from "@/components/CosmosBackground";
import TermsModal from "@/components/TermsModal";
import Footer from "@/components/Footer";

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
    // suppressHydrationWarning en <html> evita el warning de hidratación cuando
    // el JS de tema agrega/quita la clase 'dark' antes del primer render.
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:wght@100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
        {/* Script de tema */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let t = localStorage.getItem('theme');
                if (!t) {
                  t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(t);
              } catch (e) {}
            `,
          }}
        />
        {/* Script preventivo: limpia atributos inyectados por extensiones del navegador (como Bitdefender bis_skin_checked) antes de la hidratación de React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var attrs = ['bis_skin_checked', 'bis_register', 'bis_size', 'bis_id', 'data-bis-skin-checked'];
                function cleanNode(node) {
                  if (!node || node.nodeType !== 1) return;
                  for (var i = 0; i < attrs.length; i++) {
                    if (node.hasAttribute(attrs[i])) node.removeAttribute(attrs[i]);
                  }
                  var children = node.children;
                  if (children) {
                    for (var c = 0; c < children.length; c++) {
                      cleanNode(children[c]);
                    }
                  }
                }
                if (typeof MutationObserver !== 'undefined') {
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName && m.attributeName.indexOf('bis_') === 0) {
                        m.target.removeAttribute(m.attributeName);
                      } else if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          cleanNode(m.addedNodes[j]);
                        }
                      }
                    }
                  });
                  observer.observe(document.documentElement, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    attributeFilter: attrs
                  });
                }
                document.addEventListener('DOMContentLoaded', function() {
                  cleanNode(document.documentElement);
                });
              })();
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
