'use client';

import Link from 'next/link';
import EscuelaInfoLogo from '@/components/EscuelaInfoLogo';

// ─── Footer global de EscuelaInfo — SKBCraft ─────────────────────────────────
// Componente Server (sin 'use client') → zero JS bundle overhead en cliente.
// Renderizado estático, no contiene estado ni efectos.

const CURRENT_YEAR = new Date().getFullYear();
const COPYRIGHT_YEAR = CURRENT_YEAR > 2026 ? `2024 – ${CURRENT_YEAR}` : '2024 – 2026';

export default function Footer() {
  return (
    <footer
      className="relative w-full no-print"
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        // Asegura que el footer quede siempre al fondo del flex container
        marginTop: 'auto',
      }}
      aria-label="Pie de página — EscuelaInfo"
    >
      {/* Línea decorativa superior con gradiente */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--verde), transparent)',
          opacity: 0.6,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* ── Bloque izquierdo: Copyright ──────────────────────────────────── */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <EscuelaInfoLogo size={24} />
            <p
              className="text-xs"
              style={{ color: 'var(--text3)', letterSpacing: '0.01em' }}
            >
              <span style={{ color: 'var(--text2)', fontWeight: 500 }}>
                © {COPYRIGHT_YEAR} SKBCraft.
              </span>
              {' '}Todos los derechos reservados.
            </p>
            <span className="px-2 py-0.5 text-[9px] font-mono font-black rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]">
              v2.5.0
            </span>
          </div>

          {/* ── Bloque derecho: Links legales ────────────────────────────────── */}
          <nav
            aria-label="Links legales"
            className="flex items-center gap-1"
          >
            <FooterLink href="/terminos" label="Términos de Servicio" />
            <Separator />
            <FooterLink href="/contacto" label="Consultas Legales" />
            <Separator />
            <FooterLink href="/privacidad" label="Privacidad" />
          </nav>

        </div>

        {/* ── Línea inferior: tagline ──────────────────────────────────────────── */}
        <p
          className="text-center text-[10px] mt-3"
          style={{ color: 'var(--text3)', opacity: 0.65 }}
        >
          EscuelaInfo · Tecnología con propósito educativo · Desarrollado por{' '}
          <span style={{ color: 'var(--verde)', opacity: 1 }}>SKBCraft</span>
        </p>
      </div>
    </footer>
  );
}

// ─── Sub-componentes auxiliares (internos, sin exportar) ─────────────────────

function FooterLink({
  href,
  label,
  external = false,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const sharedStyle = {
    color: 'var(--text3)',
    fontSize: '11px',
    padding: '4px 8px',
    borderRadius: '6px',
    textDecoration: 'none',
    transition: 'color 150ms ease, background 150ms ease',
    display: 'inline-block',
    willChange: 'color',
  };

  if (external) {
    return (
      <a
        href={href}
        style={sharedStyle}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--verde)';
          (e.currentTarget as HTMLAnchorElement).style.background = 'var(--verde-bg)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text3)';
          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
        }}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      style={sharedStyle}
      aria-label={label}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--verde)';
        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--verde-bg)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text3)';
        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
      }}
    >
      {label}
    </Link>
  );
}

function Separator() {
  return (
    <span aria-hidden="true" style={{ color: 'var(--border2)', fontSize: '10px', userSelect: 'none' }}>
      │
    </span>
  );
}
