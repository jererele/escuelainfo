/**
 * EscuelaInfoLogo — Componente React del logo vectorial.
 * Carga el diseño abstracto de la copa de graduación y el monograma 'E' & 'I'.
 */
import React from 'react';

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
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-label="EscuelaInfo Logo"
      role="img"
      fill="none"
    >
      <defs>
        {/* Accent Gradient Emerald */}
        <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Blue Gradient */}
        <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      {/* Abstract Monogram E & I with Graduation Cap and Technology Nodes */}
      <g>
        {/* Graduation Cap / Diamond top shape */}
        <path d="M 256 80 L 416 160 L 256 240 L 96 160 Z" fill="url(#grad-emerald)" />
        
        {/* Cap's tassel */}
        <path d="M 416 160 C 430 200, 440 240, 440 260" fill="none" stroke="currentColor" strokeWidth={8} strokeLinecap="round" />
        <circle cx={440} cy={275} r={15} fill="#F59E0B" />

        {/* Stylized 'E' pages curves */}
        <path d="M 160 220 L 160 360 C 160 400, 220 420, 256 420" fill="none" stroke="url(#grad-blue)" strokeWidth={28} strokeLinecap="round" />
        <path d="M 352 220 L 352 360 C 352 400, 292 420, 256 420" fill="none" stroke="url(#grad-emerald)" strokeWidth={28} strokeLinecap="round" />
        
        {/* Center Line representing 'I' / Cap post */}
        <line x1={256} y1={200} x2={256} y2={440} stroke="currentColor" strokeWidth={24} strokeLinecap="round" />
        
        {/* Connection Nodes */}
        <circle cx={256} cy={160} r={24} fill="currentColor" />
        <circle cx={256} cy={160} r={12} fill="#090d16" />
        <circle cx={160} cy={220} r={18} fill="#3B82F6" />
        <circle cx={352} cy={220} r={18} fill="#10B981" />
      </g>
    </svg>
  );
}
