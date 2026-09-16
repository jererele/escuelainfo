"use client";

import React from "react";
import { motion } from "motion/react";

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
      <motion.div
        animate={{
          scale: [1, 1.25, 0.95, 1.15, 1],
          x: [0, 25, -15, 10, 0],
          y: [0, -20, 25, -10, 0],
          borderRadius: [
            "40% 60% 70% 30% / 40% 50% 60% 50%",
            "60% 40% 30% 70% / 60% 30% 70% 40%",
            "50% 60% 40% 60% / 40% 60% 30% 70%",
            "40% 60% 70% 30% / 40% 50% 60% 50%",
          ],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
    </div>
  );
};

export default FluidOrb;
