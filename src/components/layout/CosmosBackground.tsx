"use client";

import React from "react";

/**
 * InstitutionalBackground
 * ─────────────────────────────────────────────────────────────────────────────
 * Fondo institucional de alto nivel con micro-textura arquitectónica sutil.
 * Reemplaza las animaciones espaciales genéricas de IA por un acabado sobrio,
 * profesional y de rendimiento óptimo (0% consumo de CPU/GPU, puro CSS nativo).
 */
export default function CosmosBackground() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden transition-colors duration-300"
      aria-hidden="true"
    >
      {/* Resplandor ambiental cenital ultra sutil en modo oscuro */}
      <div 
        className="hidden dark:block absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] opacity-60"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% -20%, rgba(16, 185, 129, 0.07), transparent 70%)"
        }}
      />

      {/* Trama arquitectónica de micropuntos (Linear / Vercel style) */}
      <div 
        className="absolute inset-0 opacity-40 dark:opacity-30"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          color: "var(--border2)"
        }}
      />

      {/* Degradado de desvanecimiento hacia los bordes inferiores */}
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, transparent 60%, var(--bg) 100%)"
        }}
      />
    </div>
  );
}
