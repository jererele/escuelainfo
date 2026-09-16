"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, useSpring } from "motion/react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  maxTilt?: number;
  onClick?: () => void;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = "",
  glowColor = "rgba(16, 185, 129, 0.18)",
  maxTilt = 7,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile / touch device to disable tilt for high performance (Rule 2)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const rotateX = useSpring(0, { stiffness: 220, damping: 22 });
  const rotateY = useSpring(0, { stiffness: 220, damping: 22 });

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;
    setIsHovered(true);
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
  }, [isMobile]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile || !cardRef.current) return;
      const rect = rectRef.current || cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Actualizar posición de resplandor directamente en CSS (0 re-renders de React)
      cardRef.current.style.setProperty("--glow-x", `${x}px`);
      cardRef.current.style.setProperty("--glow-y", `${y}px`);

      const xPct = (x / rect.width - 0.5) * 2;
      const yPct = (y / rect.height - 0.5) * 2;

      rotateY.set(xPct * maxTilt);
      rotateX.set(-yPct * maxTilt);
    },
    [isMobile, maxTilt, rotateX, rotateY]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    rectRef.current = null;
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  if (isMobile) {
    return (
      <div
        className={`relative rounded-[32px] border border-[var(--border)] bg-[var(--bg3)] transition-all active:scale-[0.98] shadow-md ${className}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative rounded-[32px] border border-[var(--border)] bg-[var(--bg3)] transition-shadow duration-200 overflow-hidden cursor-pointer ${
        isHovered ? "shadow-2xl border-[var(--verde)]/50" : "shadow-md hover:shadow-xl"
      } ${className}`}
    >
      {/* Radial Glow follow cursor via pure CSS variables (Zero React Re-renders) */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[32px] opacity-100 transition-opacity duration-200"
          style={{
            background: `radial-gradient(360px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${glowColor}, transparent 65%)`,
          }}
        />
      )}
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
};

export default TiltCard;
