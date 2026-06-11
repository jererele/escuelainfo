/**
 * EscuelaInfoLogo — SVG inline del logo institucional.
 * Muestra el libro con flecha en colores azul oscuro (#1e3a5f) y verde (#3a7d44).
 * Sin recuadro, sin borde redondeado, sin fondo. Renderiza como vector puro.
 */
export default function EscuelaInfoLogo({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label="EscuelaInfo Logo"
      role="img"
      fill="none"
    >
      {/* Tapa izquierda del libro */}
      <path
        d="M10 18 C10 14 13 12 17 12 L48 12 L48 80 L17 80 C13 80 10 78 10 74 Z"
        fill="#1e3a5f"
      />
      {/* Lomo/espina del libro */}
      <rect x="46" y="12" width="8" height="68" fill="#152b46" rx="1" />
      {/* Tapa derecha del libro */}
      <path
        d="M54 12 L83 12 C87 12 90 14 90 18 L90 74 C90 78 87 80 83 80 L54 80 Z"
        fill="#1e3a5f"
      />
      {/* Punto decorativo (letra "i") en tapa izquierda */}
      <circle cx="34" cy="30" r="4" fill="white" opacity="0.9" />
      {/* Flecha hacia arriba-derecha — verde */}
      <path
        d="M55 65 L55 42 L78 42"
        stroke="#3a7d44"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M66 30 L80 44 L68 56"
        stroke="#3a7d44"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
