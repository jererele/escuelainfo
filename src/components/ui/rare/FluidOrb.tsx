"use client";

import React from "react";

interface FluidOrbProps {
  color?: string;
  size?: number;
  className?: string;
}

export const FluidOrb: React.FC<FluidOrbProps> = ({
  color = "rgba(16, 185, 129, 0.25)",
  size = 280,
  className = "",
}) => {
  return (
    <div
      className={`hidden md:block pointer-events-none absolute overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Orbe ambiental optimizado por hardware: gradiente radial nativo y animación CSS en GPU */}
      <div
        className="rounded-full animate-ambient-float will-change-transform"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        }}
      />
    </div>
  );
};

export default FluidOrb;
